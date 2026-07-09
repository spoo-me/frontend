"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { getStats, timeSeriesOf } from "@/lib/api"
import { formatCount, formatWhen, pctChange } from "@/lib/format"
import { DeltaText } from "@/components/dashboard/kpi"
import { Sparkline } from "@/components/dashboard/analytics/widgets/sparkline"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The briefing's dateline: one ruled band of present-tense numbers.
 * Today so far vs yesterday's same window, last click, workspace size —
 * mono, dot-separated, refreshed every minute. NOT a KPI card grid; the
 * stats page owns windowed analysis.
 */

const MINUTE = 60_000
const DAY = 86_400_000

function midnight(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() - offsetDays * DAY)
}

function Dot() {
  return (
    <span aria-hidden className="text-muted-foreground/40 select-none">
      ·
    </span>
  )
}

export function TodayStrip({ linksTotal }: { linksTotal?: number }) {
  const today = useQuery({
    queryKey: ["stats", "today"],
    // endDate is read at fetch time so the 60s tick actually advances.
    queryFn: () =>
      getStats({ startDate: midnight(), endDate: new Date(), groupBy: ["time"] }),
    refetchInterval: MINUTE,
  })
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

  const t = today.data
  const delta =
    t && yesterday.data
      ? pctChange(t.summary.total_clicks, yesterday.data.summary.total_clicks)
      : null
  const points = t ? timeSeriesOf(t).map((b) => b.clicks) : []

  return (
    <div className="border-border/60 mt-6 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1.5 border-y py-2.5">
      {today.isPending ? (
        <Skeleton className="h-5 w-2/3" />
      ) : (
        <>
          <span className="flex items-baseline gap-1.5">
            <span className="text-foreground font-mono text-sm font-semibold tracking-tight tabular-nums">
              {formatCount(t?.summary.total_clicks ?? 0)}
            </span>
            <span className="text-muted-foreground text-xs">clicks today</span>
          </span>
          {delta != null && <DeltaText value={delta} />}
          <Dot />
          <span className="flex items-baseline gap-1.5">
            <span className="text-foreground font-mono text-sm tabular-nums">
              {formatCount(t?.summary.unique_clicks ?? 0)}
            </span>
            <span className="text-muted-foreground text-xs">unique</span>
          </span>
          <Dot />
          <span className="text-muted-foreground text-xs">
            last click{" "}
            <span className="text-foreground font-mono">
              {formatWhen(t?.summary.last_click ?? null)}
            </span>
          </span>
          {linksTotal != null && (
            <>
              <Dot />
              <span className="flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-sm tabular-nums">
                  {formatCount(linksTotal)}
                </span>
                <span className="text-muted-foreground text-xs">links</span>
              </span>
            </>
          )}
          {points.length >= 2 && (
            <span className="ml-auto hidden h-6 w-28 sm:block">
              <Sparkline points={points} />
            </span>
          )}
        </>
      )}
    </div>
  )
}
