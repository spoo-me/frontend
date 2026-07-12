"use client"

import * as React from "react"

const LG = "(min-width: 64rem)" // Tailwind v4 `lg`
const SM = "(min-width: 40rem)" // Tailwind v4 `sm`

function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", cb)
      return () => mql.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** True at the `lg` breakpoint and up. Server snapshot is false, so
    desktop-only chrome appears after hydration rather than flashing on
    phones. */
export function useIsLgUp() {
  return useMediaQuery(LG)
}

/** True at the `sm` breakpoint and up — phone layouts sit below this. */
export function useIsSmUp() {
  return useMediaQuery(SM)
}
