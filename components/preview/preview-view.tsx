"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarClock,
  Clock,
  Globe2,
  Lock,
  Pause,
  ShieldAlert,
} from "lucide-react"

import type {
  PreviewDestination,
  PublicPreview,
} from "@/lib/api/public-preview"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { CopyButton } from "@/components/dashboard/copy-button"
import { DestinationCard } from "@/components/shared/destination-card"
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
  scheduled: {
    icon: CalendarClock,
    title: "This link isn't live yet",
    body: "The owner set a start time; it doesn't redirect until then.",
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
    <div className="mx-auto w-full max-w-xl">
      {/* Identity strip — the input, stated quietly; the destination below
          is the page's payoff and carries the visual weight. */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate font-medium font-mono text-base text-foreground">
            {shortDisplay}
          </h1>
          <CopyButton value={data.short_url} label="Copy short link" />
        </div>
        {data.created_at && (
          <p className="shrink-0 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
            created {formatDate(data.created_at)}
          </p>
        )}
      </div>

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
            {/* The destination — the whole point of the page. The elbow
                branches it off the short link above. */}
            <div className="mt-1.5">
              <div className="flex h-9 items-end gap-2.5">
                <span
                  aria-hidden
                  className="mb-[7px] ml-2.5 h-full w-4 shrink-0 rounded-bl-lg border-border/60 border-b border-l"
                />
                <span className="label-mono text-muted-foreground">
                  {data.geo_destinations
                    ? "Default destination"
                    : "Redirects to"}
                </span>
              </div>
              <div className="mt-3 pl-9">
                <DestinationCard
                  url={data.destination.url}
                  domain={data.destination.domain}
                  isHttps={data.destination.is_https}
                />
              </div>
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
      <div className="mt-8 flex flex-wrap items-center gap-3">
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
