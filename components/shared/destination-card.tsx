"use client"

import * as React from "react"
import { Globe } from "lucide-react"

import { fetchUrlMetadata, type UrlMetadata } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/dashboard/copy-button"

/**
 * The destination, shown the way it presents itself: og image on top,
 * favicon, title, description — fetched from the destination's own public
 * tags after the page paints. The URL footer is server-rendered truth and
 * never waits on the fetch; if the destination won't answer, the card
 * quietly stays a URL row and the page loses nothing.
 */
export function DestinationCard({
  url,
  domain,
  isHttps,
}: {
  url: string
  domain: string
  isHttps: boolean
}) {
  const [meta, setMeta] = React.useState<UrlMetadata | null>(null)
  const [settled, setSettled] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    // http destinations: skip — the endpoint is https-only, and the
    // unencrypted warning below is the load-bearing information anyway.
    if (!isHttps) {
      setSettled(true)
      return
    }
    fetchUrlMetadata(url)
      .then((m) => {
        if (!cancelled) setMeta(m)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSettled(true)
      })
    return () => {
      cancelled = true
    }
  }, [url, isHttps])

  const hasCard = Boolean(
    meta && (meta.title || meta.description || meta.image)
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      {!settled && (
        <div className="border-border/50 border-b">
          <Skeleton className="aspect-[1.91/1] w-full rounded-none" />
          <div className="p-5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </div>
        </div>
      )}

      {settled && hasCard && meta && (
        <div className="border-border/50 border-b">
          {meta.image && <OgImage src={meta.image} />}
          <div className="p-5">
            {meta.title && (
              <p className="font-semibold text-[15px] text-foreground leading-snug">
                {meta.title}
              </p>
            )}
            {meta.description && (
              <p className="mt-1.5 line-clamp-2 text-muted-foreground text-sm">
                {meta.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* URL footer — server-rendered truth, never waits on the fetch */}
      <div className="flex min-w-0 items-center gap-3 px-5 py-4">
        <FaviconThumb src={meta?.favicon ?? null} />
        <div className="min-w-0 flex-1">
          <p className="break-all font-medium font-mono text-[15px] text-foreground">
            {url}
          </p>
          {!isHttps && (
            <p className="mt-1 font-mono text-[11px] text-destructive">
              not https, the connection is unencrypted
            </p>
          )}
        </div>
        <CopyButton value={url} label="Copy destination" />
      </div>
    </div>
  )
}

function FaviconThumb({ src }: { src: string | null }) {
  const [failed, setFailed] = React.useState(false)
  if (!src || failed)
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border/60 bg-muted/30">
        <Globe
          className="size-2.5 text-muted-foreground/60"
          strokeWidth={1.75}
        />
      </span>
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="size-4 shrink-0 rounded-[4px]"
    />
  )
}

function OgImage({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="aspect-[1.91/1] w-full border-border/50 border-b object-cover"
    />
  )
}
