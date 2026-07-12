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

import { cn } from "@/lib/utils"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import {
  DimTooltip,
  TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/analytics/widgets/dim-tooltip"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

/**
 * Top categories on spokes: shape-reading over value-reading — a lopsided
 * blob says "one channel dominates" at a glance. "both" overlays uniques
 * as a quieter second shape, the same twin grammar as the time series.
 * Spoke labels carry identity marks where the dimension has them.
 */

const ICON_DIMS = new Set(["referrer", "country", "browser", "os"])

/** Angle-axis tick: identity icon + label, aligned by the tick's anchor. */
function RadarTick(props: {
  x?: number
  y?: number
  textAnchor?: string
  payload?: { value?: string | number }
  dimension: Exclude<StatsDimension, "time">
  lookup: Map<string, string>
}) {
  const {
    x = 0,
    y = 0,
    textAnchor = "middle",
    payload,
    dimension,
    lookup,
  } = props
  const label = String(payload?.value ?? "")
  const raw = lookup.get(label) ?? label
  const w = 110
  const xPos =
    textAnchor === "middle" ? x - w / 2 : textAnchor === "end" ? x - w : x
  return (
    <foreignObject x={xPos} y={y - 9} width={w} height={18}>
      <div
        className={cn(
          "flex h-full min-w-0 items-center gap-1",
          textAnchor === "middle"
            ? "justify-center"
            : textAnchor === "end"
              ? "justify-end"
              : "justify-start"
        )}
      >
        <DimensionIcon
          dimension={dimension}
          value={raw}
          className="block size-3 shrink-0"
        />
        <span className="min-w-0 truncate text-[10px] text-muted-foreground leading-none">
          {label}
        </span>
      </div>
    </foreignObject>
  )
}

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
    [rows, key, spokes, dimension]
  )
  // Ticks receive the display label; the icon needs the raw value back.
  const lookup = React.useMemo(
    () => new Map(data.map((d) => [d.label, d.value])),
    [data]
  )

  if (data.length < 3) {
    return (
      <EmptyRange
        label={
          rows.length
            ? "A radar needs at least 3 categories"
            : "No data in this range"
        }
      />
    )
  }

  return (
    <div className="h-full w-full p-2 **:outline-none">
      <ResponsiveContainer key={metric} width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.7} />
          <PolarAngleAxis
            dataKey="label"
            tick={
              ICON_DIMS.has(dimension) ? (
                <RadarTick dimension={dimension} lookup={lookup} />
              ) : (
                { fill: "var(--muted-foreground)", fontSize: 10 }
              )
            }
            tickFormatter={(v: string) =>
              v.length > 10 ? `${v.slice(0, 9)}…` : v
            }
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
