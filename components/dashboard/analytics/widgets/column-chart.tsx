"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import {
  DimTooltip,
  TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/analytics/widgets/dim-tooltip"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

/** Dimensions whose values carry real identity marks (favicons, flags,
    browser logos, OS glyphs). Cities and links only have a generic glyph,
    so their axis stays text. */
const ICON_AXIS_DIMENSIONS = new Set(["referrer", "country", "browser", "os"])

/** Category tick rendered as the value's identity icon; recharts clones
    this element with {x, y, payload} per tick. */
function IconTick(props: {
  x?: number
  y?: number
  payload?: { value?: string | number }
  dimension: Exclude<StatsDimension, "time">
}) {
  const { x = 0, y = 0, payload, dimension } = props
  const value = String(payload?.value ?? "")
  return (
    // Flex-centered block icon: an inline img sits on the text baseline
    // and its descender gap pushes it past the box, clipping the mark.
    <foreignObject x={x - 9} y={y + 2} width={18} height={18}>
      <div className="flex h-full w-full items-center justify-center **:block">
        <DimensionIcon dimension={dimension} value={value} className="size-4" />
      </div>
    </foreignObject>
  )
}

/**
 * Ranked categories as vertical columns, the classic browsers/OS shape.
 * Columns carry the accent alpha ramp (leader bright, tail quiet); "both"
 * groups the unique count as a quieter twin, same grammar as the
 * time-series bars. Columns are click-to-filter.
 */

export function ColumnChart({
  dimension,
  rows,
  metric,
  count,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** How many ranked categories to show (width-derived). */
  count: number
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"
  const data = React.useMemo(
    () => [...rows].sort((a, b) => b[key] - a[key]).slice(0, count),
    [rows, key, count]
  )
  const n = data.length
  const ramp = (i: number) =>
    `color-mix(in oklab, var(--chart-accent, var(--brand)) ${Math.round(88 - i * (48 / Math.max(n - 1, 1)))}%, var(--background))`

  if (!rows.length) {
    return <EmptyRange />
  }

  const clickBar = onSelect
    ? {
        onClick: (d: unknown) => {
          const v = (d as { payload?: { value?: string } }).payload?.value
          if (typeof v === "string") onSelect(v)
        },
        className: "cursor-pointer",
      }
    : {}

  return (
    <div className="h-full w-full p-2 pt-3 **:outline-none">
      <ResponsiveContainer key={metric} width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 4"
            stroke="var(--border)"
            strokeOpacity={0.7}
          />
          <XAxis
            dataKey="value"
            type="category"
            tickFormatter={(v: string) => {
              const label = dimensionLabel(dimension, v)
              return label.length > 9 ? `${label.slice(0, 8)}…` : label
            }}
            tickLine={false}
            axisLine={false}
            height={30}
            tick={
              ICON_AXIS_DIMENSIONS.has(dimension) ? (
                <IconTick dimension={dimension} />
              ) : (
                { fill: "var(--muted-foreground)", fontSize: 10 }
              )
            }
            tickMargin={6}
            interval={0}
          />
          <YAxis
            width={40}
            tickFormatter={(v: number) => formatCount(v)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            content={<DimTooltip dimension={dimension} />}
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            cursor={{ fill: "var(--muted-foreground)", fillOpacity: 0.06 }}
          />
          <Bar
            dataKey={key}
            radius={[3, 3, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
            {...clickBar}
          >
            {data.map((d, i) => (
              <Cell key={d.value} fill={ramp(i)} />
            ))}
          </Bar>
          {metric === "both" && (
            <Bar
              dataKey="unique_clicks"
              fill="var(--chart-accent, var(--brand))"
              fillOpacity={0.3}
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              isAnimationActive={false}
              {...clickBar}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
