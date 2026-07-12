"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { getStats, timeSeriesOf } from "@/lib/api"
import { formatCount, formatWhen, pctChange } from "@/lib/format"
import { KpiCard } from "@/components/dashboard/kpi"
import { Sparkline } from "@/components/dashboard/analytics/widgets/sparkline"

/**
 * Today's numbers as proper KPI furniture — same card grammar as the
 * analytics stat tiles, but present tense: today so far vs yesterday's
 * same window, refreshed every minute. Windowed analysis stays on the
 * stats page.
 */

const MINUTE = 60_000
const DAY = 86_400_000

function midnight(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() - offsetDays * DAY)
}

export function TodayCards({ linksTotal }: { linksTotal?: number }) {
  const today = useQuery({
    queryKey: ["stats", "today"],
    // endDate is read at fetch time so the 60s tick actually advances.
    queryFn: () =>
      getStats({
        startDate: midnight(),
        endDate: new Date(),
        groupBy: ["time"],
      }),
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
  const y = yesterday.data
  const clicksDelta =
    t && y ? pctChange(t.summary.total_clicks, y.summary.total_clicks) : null
  const uniqueDelta =
    t && y ? pctChange(t.summary.unique_clicks, y.summary.unique_clicks) : null
  // An all-zero day would draw as a flat ink line at the baseline — no
  // signal, no sparkline.
  const points = t ? timeSeriesOf(t).map((b) => b.clicks) : []
  const hasSignal = points.some((p) => p > 0)

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Clicks · today"
        value={t ? formatCount(t.summary.total_clicks) : "–"}
        delta={clicksDelta}
        deltaLabel="vs yesterday"
        chart={
          hasSignal && points.length >= 2 ? (
            <Sparkline points={points} />
          ) : undefined
        }
      />
      <KpiCard
        label="Unique · today"
        value={t ? formatCount(t.summary.unique_clicks) : "–"}
        delta={uniqueDelta}
        deltaLabel="vs yesterday"
      />
      <KpiCard
        label="Last click"
        value={
          <span className="text-lg leading-tight">
            {t ? formatWhen(t.summary.last_click) : "–"}
          </span>
        }
        footer="most recent activity"
      />
      <KpiCard
        label="Links"
        value={linksTotal != null ? formatCount(linksTotal) : "–"}
        footer="workspace total"
      />
    </div>
  )
}
