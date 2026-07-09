"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CustomDomain, UrlListItem } from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"

/**
 * The queue that answers "can I close this tab?": things that will break
 * (or already broke) if ignored, ranked by severity, each row phrased as
 * the situation + a jump to the fix. On a good day it is ONE quiet
 * all-clear line — reassurance is part of the briefing, so the block
 * renders either way. The row type is deliberately generic (tone, text,
 * href) so future backend items (security flags with appeal, broken
 * destinations) slot in without UI changes.
 */

type Item = {
  key: string
  severity: number // 1 = worst
  tone: "red" | "amber"
  text: string
  href: string
}

const DAY = 86_400_000

export function buildAttentionItems(
  links: UrlListItem[],
  domains: CustomDomain[],
): Item[] {
  const items: Item[] = []
  const now = Date.now()

  for (const d of domains) {
    if (d.status === "REVOKED" || d.status === "SUSPENDED") {
      items.push({
        key: `dom-${d.id}`,
        severity: 1,
        tone: "red",
        text: `${d.fqdn} is ${d.status.toLowerCase()} and not serving links`,
        href: `/dashboard/domains/${d.id}`,
      })
    } else if (d.last_verification_error) {
      items.push({
        key: `dom-${d.id}`,
        severity: 1,
        tone: "red",
        text: `verification failing for ${d.fqdn}`,
        href: `/dashboard/domains/${d.id}`,
      })
    } else if (d.status === "PENDING" || d.status === "VERIFYING") {
      items.push({
        key: `dom-${d.id}`,
        severity: 2,
        tone: "amber",
        text: `finish verifying ${d.fqdn}`,
        href: `/dashboard/domains/${d.id}`,
      })
    }
  }

  for (const l of links) {
    if (!l.alias) continue
    if (l.status === "ACTIVE" && l.expire_after != null) {
      const days = Math.ceil((l.expire_after * 1000 - now) / DAY)
      if (days >= 0 && days <= 7) {
        items.push({
          key: `exp-${l.id}`,
          severity: 2,
          tone: "amber",
          text: `/${l.alias} expires ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`,
          href: `/dashboard/links/${l.alias}`,
        })
      }
    }
    if (
      l.status === "ACTIVE" &&
      l.max_clicks != null &&
      l.total_clicks != null &&
      l.total_clicks >= l.max_clicks * 0.8
    ) {
      const capped = l.total_clicks >= l.max_clicks
      items.push({
        key: `cap-${l.id}`,
        severity: capped ? 1 : 2,
        tone: capped ? "red" : "amber",
        text: capped
          ? `/${l.alias} hit its click cap (${l.total_clicks}/${l.max_clicks}) and stopped serving`
          : `/${l.alias} at ${l.total_clicks}/${l.max_clicks} clicks, close to its cap`,
        href: `/dashboard/links/${l.alias}`,
      })
    }
  }

  // Already-dead links, quietest tier; two most recent are enough.
  const dead = links
    .filter((l) => l.alias && (l.status === "EXPIRED" || l.status === "BLOCKED"))
    .slice(0, 2)
  for (const l of dead) {
    items.push({
      key: `dead-${l.id}`,
      severity: l.status === "BLOCKED" ? 1 : 3,
      tone: l.status === "BLOCKED" ? "red" : "amber",
      text:
        l.status === "BLOCKED"
          ? `/${l.alias} is blocked`
          : `/${l.alias} expired ${formatWhen(l.last_click)}`,
      href: `/dashboard/links/${l.alias}`,
    })
  }

  return items.sort((a, b) => a.severity - b.severity)
}

const MAX_ROWS = 4

export function Attention({
  links,
  domains,
  ready,
}: {
  links: UrlListItem[]
  domains: CustomDomain[]
  /** Render only once every source answered — no flash-in. */
  ready: boolean
}) {
  const items = React.useMemo(
    () => buildAttentionItems(links, domains),
    [links, domains],
  )
  if (!ready) return null
  const shown = items.slice(0, MAX_ROWS)
  const overflow = items.length - shown.length

  return (
    <div className="mt-8">
      <SectionHeader
        icon={CircleAlert}
        title="Needs attention"
        action={
          overflow > 0 ? (
            <Link
              href="/dashboard/links"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150"
            >
              {overflow} more
              <ArrowUpRight className="size-3" />
            </Link>
          ) : undefined
        }
      />
      <Panel className="divide-border/60 mt-2 divide-y">
        {shown.length === 0 ? (
          <div className="flex h-11 items-center gap-3 px-4">
            <span aria-hidden className="bg-live size-1.5 shrink-0 rounded-full" />
            <span className="text-muted-foreground text-sm">
              all clear, nothing needs you
            </span>
          </div>
        ) : (
          shown.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="hover:bg-accent/40 group flex h-11 items-center gap-3 px-4 transition-colors duration-150"
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  item.tone === "red" ? "bg-destructive" : "bg-amber-500",
                )}
              />
              <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                {item.text}
              </span>
              <ArrowUpRight className="text-muted-foreground/0 group-hover:text-muted-foreground size-3.5 shrink-0 transition-colors duration-150" />
            </Link>
          ))
        )}
      </Panel>
    </div>
  )
}
