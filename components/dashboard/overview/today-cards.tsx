"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"

import { getStats, listUrls } from "@/lib/api"
import { formatCount, formatWhen, pctChange } from "@/lib/format"
import { KpiCard } from "@/components/dashboard/kpi"
import {
  DAY,
  MINUTE,
  midnight,
  useTodayStats,
} from "@/components/dashboard/overview/today"

/**
 * Today's numbers as proper KPI furniture — same card grammar as the
 * analytics stat tiles, but present tense: today so far vs yesterday's
 * same window, refreshed every minute. Each card is the headline; it opens
 * the page that holds the reading.
 */

function CardLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </Link>
  )
}

const CARD = "h-full transition-colors duration-150 group-hover:border-border"
const GO = (
  <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
)

export function TodayCards({ linksTotal }: { linksTotal?: number }) {
  const today = useTodayStats()
  const yesterday = useQuery({
    queryKey: ["stats", "yesterday"],
    queryFn: () =>
      getStats({
        startDate: midnight(1),
        endDate: new Date(Date.now() - DAY),
        groupBy: ["time"],
      }),
    refetchInterval: 5 * MINUTE,
  })

  /* All-time, not today: this card claims most-recent-activity, and
     the stored per-link last_click carries no window. Mongo sorts null
     below Date, so a desc sort puts never-clicked links last and
     items[0] is null only when nothing has ever been clicked. */
  const lastClick = useQuery({
    queryKey: ["urls", "last-click"],
    queryFn: () =>
      listUrls({ pageSize: 1, sortBy: "last_click", sortOrder: "desc" }),
    refetchInterval: 5 * MINUTE,
  })

  const t = today.data
  const y = yesterday.data
  const clicksDelta =
    t && y ? pctChange(t.summary.total_clicks, y.summary.total_clicks) : null
  const uniqueDelta =
    t && y ? pctChange(t.summary.unique_clicks, y.summary.unique_clicks) : null

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CardLink href="/dashboard/analytics?range=today">
        <KpiCard
          className={CARD}
          label="Clicks · today"
          badge={GO}
          value={t ? formatCount(t.summary.total_clicks) : "–"}
          delta={clicksDelta}
          deltaLabel="vs yesterday"
        />
      </CardLink>
      <CardLink href="/dashboard/analytics?range=today">
        <KpiCard
          className={CARD}
          label="Unique · today"
          badge={GO}
          value={t ? formatCount(t.summary.unique_clicks) : "–"}
          delta={uniqueDelta}
          deltaLabel="vs yesterday"
        />
      </CardLink>
      <CardLink href="/dashboard/links?sort=last_click">
        <KpiCard
          className={CARD}
          label="Last click"
          badge={GO}
          value={
            <span className="text-lg leading-tight">
              {lastClick.data
                ? formatWhen(lastClick.data.items[0]?.last_click)
                : "–"}
            </span>
          }
          footer="most recent activity"
        />
      </CardLink>
      <CardLink href="/dashboard/links">
        <KpiCard
          className={CARD}
          label="Links"
          badge={GO}
          value={linksTotal != null ? formatCount(linksTotal) : "–"}
          footer="workspace total"
        />
      </CardLink>
    </div>
  )
}
