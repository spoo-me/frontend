"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown, ChevronUp, CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CustomDomain, UrlListItem } from "@/lib/api"
import { formatWhen } from "@/lib/format"
import { InfoHint } from "@/components/dashboard/info-hint"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * The queue that answers "can I close this tab?": things that will break
 * (or already broke) if ignored. Rows are columnar so four problems scan
 * as four distinct shapes, not four sentences: category tag → subject in
 * mono → quiet detail → the action. On a good day the whole block is ONE
 * all-clear line. The item type is deliberately generic so future backend
 * residents (security flags with appeal, broken destinations) slot in.
 */

type Item = {
  key: string
  severity: number // 1 = worst
  tone: "red" | "amber"
  /** Short mono category tag: what KIND of problem. */
  category: string
  /** The resource, in mono: /alias or fqdn. */
  subject: string
  /** Quiet context: what exactly is wrong. */
  detail: string
  /** The verb on the right edge. */
  action: string
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
        category: "domain",
        subject: d.fqdn,
        detail: `${d.status.toLowerCase()}, not serving links`,
        action: "Review",
        href: `/dashboard/domains/${d.id}`,
      })
    } else if (d.last_verification_error) {
      items.push({
        key: `dom-${d.id}`,
        severity: 1,
        tone: "red",
        category: "domain",
        subject: d.fqdn,
        detail: "verification failing",
        action: "Fix DNS",
        href: `/dashboard/domains/${d.id}`,
      })
    } else if (d.status === "PENDING" || d.status === "VERIFYING") {
      items.push({
        key: `dom-${d.id}`,
        severity: 2,
        tone: "amber",
        category: "domain",
        subject: d.fqdn,
        detail: "waiting on verification",
        action: "Verify",
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
          category: "expiry",
          subject: `/${l.alias}`,
          detail:
            days === 0
              ? "expires today"
              : days === 1
                ? "expires tomorrow"
                : `expires in ${days} days`,
          action: "Extend",
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
        category: "cap",
        subject: `/${l.alias}`,
        detail: capped
          ? `hit its cap (${l.total_clicks}/${l.max_clicks}), stopped serving`
          : `${l.total_clicks}/${l.max_clicks} clicks used`,
        action: capped ? "Raise cap" : "Review",
        href: `/dashboard/links/${l.alias}`,
      })
    }
  }

  // Already-dead links, quietest tier; two most recent are enough.
  const dead = links
    .filter((l) => l.alias && (l.status === "EXPIRED" || l.status === "BLOCKED"))
    .slice(0, 2)
  for (const l of dead) {
    const blocked = l.status === "BLOCKED"
    items.push({
      key: `dead-${l.id}`,
      severity: blocked ? 1 : 3,
      tone: blocked ? "red" : "amber",
      category: blocked ? "blocked" : "expired",
      subject: `/${l.alias}`,
      detail: blocked
        ? "blocked and not serving"
        : `expired, last click ${formatWhen(l.last_click)}`,
      action: "Review",
      href: `/dashboard/links/${l.alias}`,
    })
  }

  return items.sort((a, b) => a.severity - b.severity)
}

const MAX_ROWS = 4

const TAG_TONES = {
  red: "bg-destructive/10 text-destructive dark:bg-destructive/15",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
} as const

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
  // Overflow expands IN PLACE — the hidden items don't share a page.
  const [expanded, setExpanded] = React.useState(false)
  // Nothing to say = no section. The old all-clear reassurance row read
  // as furniture the moment the queue was empty.
  if (!ready || items.length === 0) return null
  const shown = expanded ? items : items.slice(0, MAX_ROWS)
  const overflow = items.length - MAX_ROWS

  return (
    <div className="mt-8">
      <SectionHeader
        icon={CircleAlert}
        title="Needs attention"
        badge={
          <InfoHint label="What lands here">
            Links and domains that will break or already broke if ignored.
          </InfoHint>
        }
        action={
          overflow > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150"
            >
              {expanded ? "show less" : `${overflow} more`}
              {expanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          ) : undefined
        }
      />
      <Panel className="divide-border/60 mt-2 divide-y">
        {shown.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="hover:bg-accent/40 group flex h-11 items-center gap-3 px-4 transition-colors duration-150"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "label-mono w-[4.5rem] shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] whitespace-nowrap",
                      TAG_TONES[item.tone],
                    )}
                  >
                    {item.category}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {item.tone === "red"
                    ? "Broken now, needs action."
                    : "Will break soon."}
                </TooltipContent>
              </Tooltip>
              <span className="text-foreground shrink-0 font-mono text-[13px]">
                {item.subject}
              </span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                {item.detail}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground flex shrink-0 items-center gap-1 text-xs transition-colors duration-150">
                {item.action}
                <ArrowUpRight className="size-3" />
              </span>
            </Link>
        ))}
      </Panel>
    </div>
  )
}
