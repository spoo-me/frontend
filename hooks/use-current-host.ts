"use client"

import * as React from "react"

const subscribe = () => () => {}

/**
 * The current hostname, hydration-safe: "" on the server and during the
 * hydration render, the real host immediately after. For hrefs that render
 * inside server-rendered HTML (the public stats page), where reading
 * window.location directly in render would mismatch on hydration.
 */
export function useCurrentHost(): string {
  return React.useSyncExternalStore(
    subscribe,
    () => window.location.hostname,
    () => ""
  )
}
