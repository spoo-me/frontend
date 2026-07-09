"use client"

import * as React from "react"

import { formatCount, formatPercent, pctChange } from "@/lib/format"
import { timeSeriesOf, type StatsResponse } from "@/lib/api"
import { statSparkline, type StatConfig } from "@/lib/analytics-layout"
import { STAT_META } from "@/components/dashboard/analytics/widget-meta"
import { KpiCard } from "@/components/dashboard/kpi"
import { Panel } from "@/components/dashboard/section"
import { ScopeChip } from "@/components/dashboard/analytics/widget-shell"
import { Sparkline } from "@/components/dashboard/analytics/widgets/sparkline"
import {
  GaugeArc,
  OdometerValue,
} from "@/components/dashboard/analytics/widgets/stat-viz"

/**
 * One number as a widget. Grows a sparkline when the cell is tall enough —
 * more space means more data, not a bigger font.
 */
export function StatWidget({
  config,
  h,
  stats,
  prevStats,
  rangeLabel,
  deltaLabel,
}: {
  config: StatConfig
  h: number
  stats?: StatsResponse
  prevStats?: StatsResponse
  rangeLabel: string
  deltaLabel: string
}) {
  const meta = STAT_META[config.metric]

  const value = React.useMemo(() => {
    if (!stats) return "–"
    switch (config.metric) {
      case "total_clicks":
        return formatCount(stats.summary.total_clicks)
      case "unique_clicks":
        return formatCount(stats.summary.unique_clicks)
      case "unique_rate":
        return formatPercent(stats.computed_metrics?.unique_click_rate)
      case "clicks_per_visitor":
        return stats.computed_metrics
          ? String(stats.computed_metrics.average_clicks_per_visitor)
          : "–"
    }
  }, [stats, config.metric])

  const delta = React.useMemo(() => {
    if (!stats || !prevStats) return null
    if (config.metric === "total_clicks")
      return pctChange(stats.summary.total_clicks, prevStats.summary.total_clicks)
    if (config.metric === "unique_clicks")
      return pctChange(stats.summary.unique_clicks, prevStats.summary.unique_clicks)
    return null
  }, [stats, prevStats, config.metric])

  const points = React.useMemo(() => {
    if (!stats || !statSparkline(h)) return null
    const buckets = timeSeriesOf(stats)
    if (buckets.length < 2) return null
    switch (config.metric) {
      case "total_clicks":
        return buckets.map((b) => b.clicks)
      case "unique_clicks":
        return buckets.map((b) => b.unique_clicks)
      case "unique_rate":
        return buckets.map((b) => (b.clicks ? b.unique_clicks / b.clicks : 0))
      case "clicks_per_visitor":
        return buckets.map((b) => (b.unique_clicks ? b.clicks / b.unique_clicks : 0))
    }
  }, [stats, h, config.metric])

  // Gauge face: percentage metrics only (normalize enforces it too).
  if (config.viz === "gauge" && config.metric === "unique_rate") {
    const rate = stats?.computed_metrics?.unique_click_rate
    const fraction = typeof rate === "number" ? rate / 100 : 0
    return (
      <Panel className="bg-shell flex h-full flex-col rounded-2xl">
        <div className="px-4 pt-3.5 pb-1">
          <div className="label-mono text-muted-foreground flex min-w-0 items-center gap-1.5">
            <span className="truncate">{config.title ?? meta.label}</span>
            {config.scope && <ScopeChip scope={config.scope} />}
          </div>
        </div>
        <div className="min-h-0 flex-1 px-4 py-1.5">
          <GaugeArc fraction={fraction} label={value} />
        </div>
        <div className="border-border/60 bg-muted/30 flex h-8 items-center border-t px-4">
          <span className="text-muted-foreground/70 text-[11px]">
            {meta.footer ?? rangeLabel}
          </span>
        </div>
      </Panel>
    )
  }

  return (
    <KpiCard
      className="h-full rounded-2xl"
      label={config.title ?? meta.label}
      badge={config.scope && <ScopeChip scope={config.scope} />}
      value={config.viz === "odometer" ? <OdometerValue value={value} /> : value}
      delta={delta}
      deltaLabel={deltaLabel}
      footer={meta.footer ?? rangeLabel}
      chart={points ? <Sparkline points={points} /> : undefined}
    />
  )
}
