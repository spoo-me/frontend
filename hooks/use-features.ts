"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import {
  getMyFeatures,
  type FeatureMap,
  type FeatureName,
  type FeatureState,
} from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"

/**
 * Feature availability, pessimistically: everything is "hidden" until the
 * backend says otherwise — anonymous, loading, and error all read as
 * hidden, mirroring the backend's default-deny.
 *
 * Pop-in is killed the same way as the `spoo:authed` pre-hydration hint:
 * the last-known answer is mirrored in localStorage (keyed to the user id
 * so accounts never leak into each other) and served as placeholder data,
 * so returning users render their real feature set on first paint while
 * the fresh answer loads in the background. A brand-new browser shows the
 * gated surfaces only after the first response — the safe direction.
 */

const MIRROR_KEY = "spoo:features:v1"

type Mirror = { u: string; f: FeatureMap }

function readMirror(userId: string): FeatureMap | undefined {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY)
    if (!raw) return undefined
    const m = JSON.parse(raw) as Mirror
    return m.u === userId ? m.f : undefined
  } catch {
    return undefined
  }
}

function writeMirror(userId: string, features: FeatureMap) {
  try {
    window.localStorage.setItem(
      MIRROR_KEY,
      JSON.stringify({ u: userId, f: features })
    )
  } catch {
    // Storage unavailable — the mirror is an optimization, not state.
  }
}

export function useFeatures(): {
  features: FeatureMap | null
  /** True once a REAL server answer (or failure) exists — placeholder
      data doesn't count. Guards that redirect should wait for this. */
  settled: boolean
} {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const q = useQuery({
    queryKey: ["features", userId],
    queryFn: async () => {
      const { features } = await getMyFeatures()
      if (userId) writeMirror(userId, features)
      return features
    },
    enabled: userId !== null,
    staleTime: 5 * 60_000,
    placeholderData: () => (userId ? readMirror(userId) : undefined),
  })
  return {
    features: userId ? (q.data ?? null) : null,
    settled: userId !== null && (q.isFetched || q.isError),
  }
}

export function useFeature(name: FeatureName): FeatureState {
  const { features } = useFeatures()
  return features?.[name] ?? "hidden"
}

/** Route guard for pages whose whole existence is gated: bounces to the
    dashboard once the server has really answered (never on placeholder
    or mid-flight data), and tells the page whether to render. */
export function useFeatureGuard(
  name: FeatureName,
  onDenied: () => void
): boolean {
  const { features, settled } = useFeatures()
  const enabled = features?.[name] === "enabled"
  React.useEffect(() => {
    if (settled && !enabled) onDenied()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, enabled])
  return enabled
}
