"use client"

import * as React from "react"

const LG = "(min-width: 64rem)" // Tailwind v4 `lg`

/** True at the `lg` breakpoint and up. Server snapshot is false, so
    desktop-only chrome appears after hydration rather than flashing on
    phones. */
export function useIsLgUp() {
  return React.useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(LG)
      mql.addEventListener("change", cb)
      return () => mql.removeEventListener("change", cb)
    },
    () => window.matchMedia(LG).matches,
    () => false,
  )
}
