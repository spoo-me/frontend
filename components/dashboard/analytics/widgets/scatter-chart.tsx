"use client"

import * as React from "react"
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon } from "@/components/dashboard/dim-icon"
import {
  DimTooltip,
  TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/analytics/widgets/dim-tooltip"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

/**
 * Volume vs quality: each category is a point at (clicks, unique rate).
 * High-volume low-rate points are the bot-ish outliers; high-rate points
 * are the healthy audiences. Identity marks (favicons, flags, logos) ARE
 * the points where the dimension has them. Points are click-to-filter.
 */

const ICON_DIMS = new Set(["referrer", "country", "browser", "os"])

type Point = DimensionRow & { rate: number }

function ScatterMark(props: {
  cx?: number
  cy?: number
  payload?: Point
  dimension: Exclude<StatsDimension, "time">
  [k: string]: unknown
}) {
  const { cx = 0, cy = 0, payload, dimension } = props
  if (!payload) return <g />
  const iconed = ICON_DIMS.has(dimension)
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={iconed ? 11 : 5.5}
        fill="var(--chart-accent, var(--brand))"
        fillOpacity={iconed ? 0.12 : 0.75}
        stroke="var(--chart-accent, var(--brand))"
        strokeOpacity={iconed ? 0.35 : 0}
        strokeWidth={1}
      />
      {iconed && (
        <foreignObject x={cx - 7} y={cy - 7} width={14} height={14}>
          <div className="flex h-full w-full items-center justify-center **:block">
            <DimensionIcon
              dimension={dimension}
              value={payload.value}
              className="size-3.5"
            />
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export function BreakdownScatter({
  dimension,
  rows,
  metric,
  limit,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Top-N categories by volume (size-derived). */
  limit: number
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"
  const data: Point[] = React.useMemo(
    () =>
      [...rows]
        .sort((a, b) => b[key] - a[key])
        .slice(0, limit)
        .map((r) => ({
          ...r,
          rate: r.clicks
            ? Math.round((r.unique_clicks / r.clicks) * 1000) / 10
            : 0,
        })),
    [rows, key, limit]
  )

  if (!rows.length) {
    return <EmptyRange />
  }

  const axisTick = { fill: "var(--muted-foreground)", fontSize: 10 }

  return (
    <div className="h-full w-full p-2 pt-3 **:outline-none">
      <ResponsiveContainer key={metric} width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 4"
            stroke="var(--border)"
            strokeOpacity={0.7}
          />
          <XAxis
            type="number"
            dataKey={key}
            name="Clicks"
            tickFormatter={(v: number) => formatCount(v)}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickMargin={6}
            domain={[0, "dataMax"]}
          />
          <YAxis
            type="number"
            dataKey="rate"
            name="Unique rate"
            width={38}
            unit="%"
            tickFormatter={(v: number) => String(v)}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            domain={[0, 100]}
          />
          <Tooltip
            content={<DimTooltip dimension={dimension} />}
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeDasharray: "3 4",
              strokeOpacity: 0.4,
            }}
          />
          <Scatter
            data={data}
            isAnimationActive={false}
            shape={<ScatterMark dimension={dimension} />}
            onClick={(d) => {
              const v = (d as { payload?: { value?: string } }).payload?.value
              if (typeof v === "string") onSelect?.(v)
            }}
            className={onSelect ? "cursor-pointer" : undefined}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
