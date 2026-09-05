"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getMyEntitlements,
  type Entitlements,
  type FeatureMap,
  type FeatureName,
  type FeatureState,
  type LimitName,
  type PlanBlock,
} from "@/lib/api"
import { onEntitlementsVersion } from "@/lib/api/client"
import { trackPlanChanged, trackPlanResolved } from "@/lib/analytics"
import { useAuth } from "@/components/auth/auth-context"

/**
 * One query for everything plan shaped, pessimistically: every feature is
 * "hidden" and every limit is 0 until the backend says otherwise, so
 * anonymous, loading and error all fail closed like the backend does.
 *
 * Pop-in is killed the same way as the `spoo:authed` hint: the last known
 * answer is mirrored in localStorage per user and served as placeholder
 * data, so returning users paint their real plan on first render while the
 * fresh answer loads. Every authenticated response carries
 * X-Entitlements-Version; when it differs from what we hold, the query is
 * invalidated, so an override, a lapse or a payment lands on the very next
 * request without any push channel.
 */

const MIRROR_KEY = "spoo:entitlements:v1"

type Mirror = { u: string; e: Entitlements }

export const entitlementsKey = (userId: string | null) =>
  ["entitlements", userId] as const

function readMirror(userId: string): Entitlements | undefined {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY)
    if (!raw) return undefined
    const m = JSON.parse(raw) as Mirror
    return m.u === userId ? m.e : undefined
  } catch {
    return undefined
  }
}

function writeMirror(userId: string, e: Entitlements) {
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify({ u: userId, e }))
  } catch {
    // Storage unavailable: the mirror is an optimisation, not state.
  }
}

/** Pure: does a header version mean our cached answer is stale? */
export function versionIsStale(
  held: number | undefined,
  seen: number | null
): boolean {
  return seen !== null && held !== undefined && seen !== held
}

export type LimitView = {
  max: number
  used: number
  remaining: number
  atLimit: boolean
  unlimited: boolean
}

/** Pure: the counter view of one limit block. */
export function limitView(
  block: { max: number; used: number | null } | undefined
): LimitView {
  const max = block?.max ?? 0
  const used = block?.used ?? 0
  const unlimited = max === -1
  return {
    max,
    used,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, max - used),
    atLimit: !unlimited && used >= max,
    unlimited,
  }
}

// One record per tab, not per mounted hook, so a plan change is tracked once.
let lastTracked:
  | { userId: string; name: string; status: string | null }
  | undefined

export function useEntitlements(): {
  entitlements: Entitlements | null
  /** True once a REAL server answer (or failure) exists; placeholder data
      does not count. Guards that redirect should wait for this. */
  settled: boolean
  /** Refetch now; resolves when the fresh answer is in the cache. */
  refresh: () => Promise<Entitlements | null>
} {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  const q = useQuery({
    queryKey: entitlementsKey(userId),
    queryFn: async () => {
      const e = await getMyEntitlements()
      if (userId) writeMirror(userId, e)
      return e
    },
    enabled: userId !== null,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: () => (userId ? readMirror(userId) : undefined),
  })

  const held = q.data?.version
  React.useEffect(() => {
    if (userId === null) return
    return onEntitlementsVersion((seen) => {
      // The entitlements response carries this header too; cancelling that
      // in-flight fetch to start another would loop forever.
      if (versionIsStale(held, seen))
        void queryClient.invalidateQueries(
          { queryKey: entitlementsKey(userId) },
          { cancelRefetch: false }
        )
    })
  }, [userId, held, queryClient])

  const status = q.data?.plan.status ?? null
  const name = q.data?.plan.name ?? null
  React.useEffect(() => {
    if (!q.isFetched || name === null || userId === null) return
    if (lastTracked === undefined || lastTracked.userId !== userId)
      trackPlanResolved(name)
    else if (lastTracked.name !== name || lastTracked.status !== status)
      trackPlanChanged(lastTracked, { name, status })
    lastTracked = { userId, name, status }
  }, [q.isFetched, name, status, userId])

  const refetch = q.refetch
  const refresh = React.useCallback(async () => {
    const r = await refetch()
    return r.data ?? null
  }, [refetch])

  return {
    entitlements: userId ? (q.data ?? null) : null,
    settled: userId !== null && (q.isFetched || q.isError),
    refresh,
  }
}

export function useFeatures(): {
  features: FeatureMap | null
  settled: boolean
} {
  const { entitlements, settled } = useEntitlements()
  return { features: entitlements?.features ?? null, settled }
}

export function useFeature(name: FeatureName): FeatureState {
  const { entitlements } = useEntitlements()
  return entitlements?.features[name] ?? "hidden"
}

export function useLimit(key: LimitName): LimitView {
  const { entitlements } = useEntitlements()
  return limitView(entitlements?.limits[key])
}

export function usePlan(): PlanBlock | null {
  const { entitlements } = useEntitlements()
  return entitlements?.plan ?? null
}

/** Route guard for pages whose whole existence is gated. `hidden` bounces
    once the server has really answered; `locked` stays on the page so it
    can render its locked state. */
export function useFeatureGuard(
  name: FeatureName,
  onHidden: () => void
): FeatureState {
  const { entitlements, settled } = useEntitlements()
  const state = entitlements?.features[name] ?? "hidden"
  React.useEffect(() => {
    if (settled && state === "hidden") onHidden()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, state])
  return state
}
