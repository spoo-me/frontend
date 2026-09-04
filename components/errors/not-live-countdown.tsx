"use client"

import * as React from "react"

import { formatRemaining } from "@/lib/countdown"
import { useScheduledStart } from "@/hooks/use-scheduled-start"

/**
 * The watermark for a scheduled link: the time left, ticking, in the same
 * faded ink where other error pages show their status code. At zero the
 * visitor is handed to the short link, which now redirects. Until the
 * lookup answers the slot stays empty; if it fails, the plain 404 stands.
 */
export function NotLiveCountdown({ from }: { from?: string }) {
  const { startsAt, shortUrl, settled } = useScheduledStart(from)
  const [now, setNow] = React.useState(() => Date.now())
  const sent = React.useRef(false)

  React.useEffect(() => {
    if (startsAt === null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [startsAt])

  const remaining = startsAt === null ? null : startsAt * 1000 - now

  React.useEffect(() => {
    if (remaining === null || remaining > 0 || sent.current || !shortUrl) return
    sent.current = true
    window.location.replace(shortUrl)
  }, [remaining, shortUrl])

  if (!settled) return null
  if (remaining === null) {
    return (
      <span
        className="whitespace-nowrap font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em]"
        style={{ fontSize: "clamp(12rem, 32vw, 26rem)" }}
      >
        404
      </span>
    )
  }
  return (
    <span
      className="whitespace-nowrap font-semibold text-foreground/[0.04] tabular-nums leading-none tracking-[-0.04em]"
      style={{ fontSize: "clamp(5rem, 15vw, 13rem)" }}
    >
      {formatRemaining(remaining)}
    </span>
  )
}
