"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Filters live in the URL (nuqs), so sidebar navigation drops them. This
 * remembers each dashboard path's last query string for the session and
 * restores it when the user comes back with a bare URL.
 *
 * Deliberate split: arriving on a page with no params restores the saved
 * state; clearing params while ON the page (Clear all, or re-clicking the
 * active nav item) forgets it, so an explicit reset stays a reset.
 */
function Keeper() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lastPath = React.useRef<string | null>(null)

  React.useEffect(() => {
    const key = `spoo:qs:${pathname}`
    const qs = searchParams.toString()
    const arriving = lastPath.current !== pathname
    lastPath.current = pathname

    if (qs) {
      sessionStorage.setItem(key, qs)
      return
    }
    if (arriving) {
      const saved = sessionStorage.getItem(key)
      if (saved) router.replace(`${pathname}?${saved}`, { scroll: false })
    } else {
      sessionStorage.removeItem(key)
    }
  }, [pathname, searchParams, router])

  return null
}

export function SearchParamsKeeper() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <React.Suspense fallback={null}>
      <Keeper />
    </React.Suspense>
  )
}
