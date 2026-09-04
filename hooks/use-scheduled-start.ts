"use client"

import * as React from "react"

import { getPublicPreview } from "@/lib/api/public-preview"

export type ScheduledStart = {
  /** Unix seconds; null while loading, when unknown, or once live. */
  startsAt: number | null
  /** Where the short link lives, for the hand-off at the instant. */
  shortUrl: string | null
  /** True once the lookup has answered or failed. */
  settled: boolean
}

function aliasFrom(from?: string): string | null {
  if (!from) return null
  const segments = from.split("?")[0].split("/").filter(Boolean)
  return segments.length === 1 ? segments[0] : null
}

// One lookup per alias per page: the body and the watermark both ask.
const inflight = new Map<string, Promise<ScheduledStart>>()

function lookup(alias: string): Promise<ScheduledStart> {
  const cached = inflight.get(alias)
  if (cached) return cached
  const p = getPublicPreview(alias)
    .then(
      (preview): ScheduledStart => ({
        startsAt: preview.status === "scheduled" ? preview.starts_at : null,
        shortUrl: preview.short_url,
        settled: true,
      })
    )
    .catch(
      (): ScheduledStart => ({ startsAt: null, shortUrl: null, settled: true })
    )
  inflight.set(alias, p)
  return p
}

/** The not-yet-live page's one fact: when the link opens, and where. */
export function useScheduledStart(from?: string): ScheduledStart {
  const alias = aliasFrom(from)
  const [state, setState] = React.useState<ScheduledStart>({
    startsAt: null,
    shortUrl: null,
    settled: alias === null,
  })
  React.useEffect(() => {
    if (!alias) return
    let cancelled = false
    lookup(alias).then((s) => {
      if (!cancelled) setState(s)
    })
    return () => {
      cancelled = true
    }
  }, [alias])
  return state
}
