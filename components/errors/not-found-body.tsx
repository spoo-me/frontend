"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { AliasClaim } from "@/components/errors/alias-claim"

/** Creatable-alias shape (mirrors the backend + mock validator). */
const ALIAS_RE = /^[a-zA-Z0-9_-]{3,16}$/

const emptySubscribe = () => () => {}

function aliasFrom(from?: string): string | null {
  if (!from) return null
  const path = from.split("?")[0]
  const segments = path.split("/").filter(Boolean)
  if (segments.length !== 1) return null
  return ALIAS_RE.test(segments[0]) ? segments[0] : null
}

/**
 * The 404. When the missing path is a claimable alias, the page flips from
 * dead end to product moment: check availability live, offer to claim it
 * on the spot. Everything else gets the honest typo copy. The fisherman
 * lives in the shell's watermark scene, fishing either way.
 */
export function NotFoundBody({ from }: { from?: string }) {
  // Next-internal 404s (app/not-found.tsx) carry no `from` — recover the
  // path client-side so a direct hit gets the same claim hook the
  // Caddy-composed /_error URL gets. The server snapshot is false so the
  // hydration render matches the pathname-less server HTML; the swap
  // happens one render later.
  const pathname = usePathname()
  const hydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const effectiveFrom =
    from ?? (hydrated && pathname && pathname !== "/" ? pathname : undefined)
  const alias = aliasFrom(effectiveFrom)
  const [available, setAvailable] = React.useState<boolean | null>(null)
  const [claimed, setClaimed] = React.useState(false)

  React.useEffect(() => {
    if (!alias) return
    let cancelled = false
    fetch(`/api/v1/shorten/check-alias?alias=${encodeURIComponent(alias)}`)
      .then((r) => r.json())
      .then((d: { available?: boolean }) => {
        if (!cancelled) setAvailable(Boolean(d.available))
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [alias])

  return (
    <div className="max-w-xl">
      <div className="min-w-0">
        {alias ? (
          <>
            <h1 className="font-mono font-semibold text-3xl text-foreground tracking-tight">
              spoo.me/{alias}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {claimed ? (
                <>
                  exists.{" "}
                  <span className="font-normal font-serif text-foreground italic">
                    since just now.
                  </span>
                </>
              ) : (
                <>
                  doesn&apos;t exist.{" "}
                  {available && (
                    <span className="font-normal font-serif text-foreground italic">
                      yet.
                    </span>
                  )}
                </>
              )}
            </p>
            {/* Fixed slot: availability resolving must not shove the page. */}
            <div className="mt-6 min-h-32">
              {available === true && (
                <>
                  <p className="mb-4 text-muted-foreground text-sm">
                    {claimed
                      ? "Yours. It redirects already."
                      : "The alias is free. Point it anywhere."}
                  </p>
                  <AliasClaim
                    alias={alias}
                    onClaimed={() => setClaimed(true)}
                  />
                </>
              )}
              {available === false && <TypoFallback from={effectiveFrom} />}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-semibold text-3xl text-foreground tracking-tight">
              This page doesn&apos;t exist.
            </h1>
            <div className="mt-6 min-h-32">
              <TypoFallback from={effectiveFrom} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TypoFallback({ from }: { from?: string }) {
  return (
    <>
      {from && (
        <p className="mb-2 break-all font-mono text-[11px] text-muted-foreground/70">
          {from}
        </p>
      )}
      <p className="mb-4 text-muted-foreground text-sm">
        Check the address for typos, or head back to the start.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/">Go home</Link>
      </Button>
    </>
  )
}
