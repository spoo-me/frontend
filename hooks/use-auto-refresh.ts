"use client"

import * as React from "react"

const KEY = "spoo:auto-refresh"
const CHANGE_EVENT = "spoo:auto-refresh-change"
const DEFAULT_MS = 60_000

export type RefreshInterval = number | false

export const REFRESH_OPTIONS: Array<{ label: string; ms: RefreshInterval }> = [
  { label: "Off", ms: false },
  { label: "30s", ms: 30_000 },
  { label: "1m", ms: 60_000 },
  { label: "5m", ms: 300_000 },
]

function readPref(): RefreshInterval {
  const saved = localStorage.getItem(KEY)
  if (saved === "off") return false
  const n = Number(saved)
  return REFRESH_OPTIONS.some((o) => o.ms === n) ? n : DEFAULT_MS
}

function subscribe(cb: () => void) {
  // "storage" covers other tabs; the custom event covers this one.
  window.addEventListener("storage", cb)
  window.addEventListener(CHANGE_EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(CHANGE_EVENT, cb)
  }
}

/** Auto-refresh cadence: a lasting preference, shared by stats and links. */
export function useAutoRefreshPref() {
  const pref = React.useSyncExternalStore(subscribe, readPref, () => DEFAULT_MS)
  const set = React.useCallback((v: RefreshInterval) => {
    localStorage.setItem(KEY, v === false ? "off" : String(v))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])
  return [pref, set] as const
}

function truncated() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d
}

/**
 * A "now" anchor for relative time windows, truncated to the minute. While
 * enabled it slides forward (only when the tab is visible) so "last N days"
 * query windows chase the clock instead of freezing at page load; bump()
 * slides it immediately for manual refreshes.
 */
export function useSlidingNow(enabled: boolean) {
  const [now, setNow] = React.useState(truncated)
  const bump = React.useCallback(() => {
    setNow((prev) => {
      const next = truncated()
      return next.getTime() === prev.getTime() ? prev : next
    })
  }, [])
  React.useEffect(() => {
    if (!enabled) return
    // Check well under the minute so a tick lands close to the boundary;
    // state only changes when the minute actually rolls over.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") bump()
    }, 15_000)
    document.addEventListener("visibilitychange", bump)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", bump)
    }
  }, [enabled, bump])
  return [now, bump] as const
}
