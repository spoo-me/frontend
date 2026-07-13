"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clock,
  Globe,
  Globe2,
  Lock,
  MoveUpRight,
  Pause,
  ShieldAlert,
} from "lucide-react"

import type {
  PreviewDestination,
  PublicPreview,
} from "@/lib/api/public-preview"
import { faviconUrl } from "@/lib/favicon"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { CopyButton } from "@/components/dashboard/copy-button"
import { DimensionIcon } from "@/components/dashboard/dim-icon"

/**
 * The preview body — a safety surface first: where the link actually goes,
 * stated plainly, before anyone opens it. The destination is shown only
 * while the link is active: password, expiry, pause and block all hide it
 * (the preview never reveals more than the redirect would). Reading
 * column, not a dashboard.
 */

const STATUS_META: Record<
  Exclude<PublicPreview["status"], "active">,
  { icon: React.ElementType; title: string; body: string; danger?: boolean }
> = {
  expired: {
    icon: Clock,
    title: "This link has expired",
    body: "It reached its expiry and no longer redirects.",
  },
  inactive: {
    icon: Pause,
    title: "The owner paused this link",
    body: "It doesn't redirect right now.",
  },
  blocked: {
    icon: ShieldAlert,
    title: "spoo.me blocked this link",
    body: "It violated our policies and no longer redirects.",
    danger: true,
  },
}

export function PreviewView({ data }: { data: PublicPreview }) {
  const shortDisplay = data.short_url.replace(/^https?:\/\//, "")
  // Same-host links continue relative (identical to the redirect the
  // visitor was about to take); custom-domain links need the absolute URL.
  const continueHref = data.short_url.startsWith("https://spoo.me/")
    ? `/${encodeURIComponent(data.alias)}`
    : data.short_url
  const statusMeta = data.status !== "active" ? STATUS_META[data.status] : null

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Identity */}
      <div className="flex items-center gap-2">
        <h1 className="truncate font-mono font-semibold text-2xl text-foreground tracking-tight">
          {shortDisplay}
        </h1>
        <CopyButton value={data.short_url} label="Copy short link" />
      </div>
      {data.created_at && (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
          created {formatDate(data.created_at)}
        </p>
      )}

      {/* Safety framing: status stated plainly, before the destination */}
      {statusMeta && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
          <statusMeta.icon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              statusMeta.danger ? "text-destructive" : "text-muted-foreground"
            )}
            strokeWidth={1.75}
          />
          <div>
            <p className="font-medium text-foreground text-sm">
              {statusMeta.title}
            </p>
            <p className="mt-0.5 text-muted-foreground text-sm">
              {statusMeta.body}
            </p>
          </div>
        </div>
      )}

      {data.status === "active" && data.password_protected ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
          <Lock
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <div>
            <p className="font-medium text-foreground text-sm">
              Password protected
            </p>
            <p className="mt-0.5 text-muted-foreground text-sm">
              The owner locked this link, so the destination stays hidden. You
              can continue and enter the password there.
            </p>
          </div>
        </div>
      ) : (
        data.destination && (
          <>
            {/* The destination — the whole point of the page */}
            <div className="mt-8">
              <SectionHeader
                icon={MoveUpRight}
                title={
                  data.geo_destinations ? "Default destination" : "Redirects to"
                }
              />
              <Panel className="mt-2 p-4">
                <DestinationRow destination={data.destination} />
              </Panel>
            </div>

            {/* Geo spread — every destination listed, nothing cloaked */}
            {data.geo_destinations && (
              <div className="mt-8">
                <SectionHeader icon={Globe2} title="Destinations by country" />
                <Panel className="mt-2 divide-y divide-border/60">
                  {data.geo_destinations.map((dest) => (
                    <div
                      key={dest.url}
                      className="flex items-center gap-3 p-3.5"
                    >
                      <span className="flex min-w-14 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                        {dest.countries.map((country) => (
                          <span
                            key={country}
                            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground tabular-nums"
                          >
                            <DimensionIcon
                              dimension="country"
                              value={country}
                              className="size-3.5 shrink-0"
                            />
                            {country}
                          </span>
                        ))}
                      </span>
                      <DestinationRow destination={dest} compact />
                    </div>
                  ))}
                </Panel>
                <p className="mt-2 text-muted-foreground/70 text-xs">
                  Visitors are sent to different destinations depending on their
                  country. Every destination is listed above.
                </p>
              </div>
            )}
          </>
        )
      )}

      {/* Actions: continuing exists only while the redirect does, and so
          does reporting — someone inspecting a LIVE link is exactly the
          person about to report one. Dead or blocked links get neither:
          nothing left to act on. */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        {data.status === "active" && (
          <Button asChild>
            <a href={continueHref} rel="noreferrer">
              {data.password_protected
                ? "Continue and enter password"
                : "Continue to destination"}
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/">Make your own short link</Link>
        </Button>
        {data.status === "active" && (
          <Button
            asChild
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href={`/report?code=${encodeURIComponent(data.alias)}`}>
              Report this link
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function DestinationRow({
  destination,
  compact,
}: {
  destination: PreviewDestination
  compact?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {!compact && <Favicon domain={destination.domain} />}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "break-all font-mono text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {destination.url}
        </p>
        {!destination.is_https && (
          <p className="mt-1 font-mono text-[11px] text-destructive">
            not https, the connection is unencrypted
          </p>
        )}
      </div>
      <CopyButton value={destination.url} label="Copy destination" />
    </div>
  )
}

/** Marks an SSR'd <img> failed even when it errored BEFORE hydration —
    onError alone misses that window and leaves a broken-image frame. */
function useImgFailed() {
  const ref = React.useRef<HTMLImageElement | null>(null)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (el?.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  return { ref, failed, onError: () => setFailed(true) }
}

/** Same identity tile as the links page: bordered slab, favicon or a
    crisp Globe fallback (the /api/favicon proxy 404s so onError fires). */
function Favicon({ domain }: { domain: string }) {
  const { ref, failed, onError } = useImgFailed()
  return (
    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={faviconUrl(domain)}
          alt=""
          loading="lazy"
          onError={onError}
          className="size-4"
        />
      ) : (
        <Globe
          className="size-3.5 text-muted-foreground/60"
          strokeWidth={1.75}
        />
      )}
    </span>
  )
}
