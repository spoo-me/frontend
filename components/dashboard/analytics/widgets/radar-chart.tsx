"use client"

import * as React from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { dimensionLabel } from "@/components/dashboard/dim-icon"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import {
  DimTooltip,
  TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/analytics/widgets/dim-tooltip"

/**
 * Top categories on spokes: shape-reading over value-reading — a lopsided
 * blob says "one channel dominates" at a glance. "both" overlays uniques
 * as a quieter second shape, the same twin grammar as the time series.
 */

export function BreakdownRadar({
  dimension,
  rows,
  metric,
  spokes,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Spoke count (width-derived; readable between 5 and 8). */
  spokes: number
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"
  const data = React.useMemo(
    () =>
      [...rows]
        .sort((a, b) => b[key] - a[key])
        .slice(0, spokes)
        .map((r) => ({
          ...r,
          label: dimensionLabel(dimension, r.value),
        })),
    [rows, key, spokes, dimension],
  )

  if (data.length < 3) {
    return (
      <div className="text-muted-foreground/70 flex h-full items-center justify-center px-6 text-center text-xs">
        {rows.length ? "a radar needs at least 3 categories" : "no data in this range"}
      </div>
    )
  }

  return (
    <div className="h-full w-full p-2 **:outline-none">
      <ResponsiveContainer key={metric} width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.7} />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
          />
          <Tooltip
            content={<DimTooltip dimension={dimension} />}
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
          />
          <Radar
            dataKey={metric === "unique" ? "unique_clicks" : "clicks"}
            stroke="var(--chart-accent, var(--brand))"
            strokeWidth={1.75}
            fill="var(--chart-accent, var(--brand))"
            fillOpacity={0.14}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          {metric === "both" && (
            <Radar
              dataKey="unique_clicks"
              stroke="var(--chart-accent, var(--brand))"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              fill="none"
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
