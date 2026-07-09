"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip, Treemap } from "recharts"

import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { dimensionLabel } from "@/components/dashboard/dim-icon"
import {
  DimTooltip,
  OTHER,
  TOOLTIP_WRAPPER_STYLE,
} from "@/components/dashboard/analytics/widgets/dim-tooltip"

/**
 * Share-of-total as area: each category is a tile sized by its count, in a
 * quiet accent tint ramp so the leader reads at a glance. Labels only where
 * they fit; the tooltip carries the rest. Tiles are click-to-filter.
 */

type TreemapDatum = DimensionRow & { name: string; size: number; tint: string }

function TreemapCell(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  dimension: Exclude<StatsDimension, "time">
  onSelect?: (value: string) => void
  [k: string]: unknown
}) {
  const { x = 0, y = 0, width = 0, height = 0, dimension, onSelect } = props
  const datum = props as unknown as Partial<TreemapDatum>
  // The root node has no tint; recharts renders it as depth-0 content.
  // `value` gets overwritten with the computed number, so read `name`.
  if (!datum.tint || typeof props.name !== "string") return <g />
  const value = props.name
  const label = value === OTHER ? "Other" : dimensionLabel(dimension, value)
  const showLabel = width > 64 && height > 40
  const clickable = onSelect && value !== OTHER
  return (
    <g
      onClick={clickable ? () => onSelect(value) : undefined}
      className={clickable ? "cursor-pointer" : undefined}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={datum.tint}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {showLabel && (
        <>
          <text
            x={x + 8}
            y={y + 18}
            fill="var(--foreground)"
            fillOpacity={0.85}
            fontSize={11}
            fontWeight={500}
          >
            {label.length > width / 7 ? `${label.slice(0, Math.max(3, Math.floor(width / 7) - 1))}…` : label}
          </text>
          <text
            x={x + 8}
            y={y + 33}
            fill="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {formatCount(datum.size ?? 0)}
          </text>
        </>
      )}
    </g>
  )
}

export function TreemapChart({
  dimension,
  rows,
  metric,
  segments,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Top-N tiles before the Other bucket (size-derived). */
  segments: number
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"

  const data: TreemapDatum[] = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => b[key] - a[key])
    const top = sorted.slice(0, segments)
    const rest = sorted.slice(segments)
    const n = top.length
    // Softer ramp than the donut: tiles are large paint areas, and the
    // label ink stays --foreground, so tints must stay quiet enough to
    // read against in both themes.
    const ramp = (i: number) =>
      `color-mix(in oklab, var(--chart-accent, var(--brand)) ${Math.round(56 - i * (38 / Math.max(n - 1, 1)))}%, var(--background))`
    const out: TreemapDatum[] = top.map((r, i) => ({
      ...r,
      name: r.value,
      size: r[key],
      tint: ramp(i),
    }))
    if (rest.length) {
      const clicks = rest.reduce((s, r) => s + r.clicks, 0)
      const unique = rest.reduce((s, r) => s + r.unique_clicks, 0)
      out.push({
        value: OTHER,
        name: OTHER,
        clicks,
        unique_clicks: unique,
        percentage: rest.reduce((s, r) => s + r.percentage, 0),
        size: metric === "unique" ? unique : clicks,
        tint: "var(--map-base)",
      })
    }
    return out.filter((d) => d.size > 0)
  }, [rows, key, segments, metric])

  if (!data.length) {
    return (
      <div className="text-muted-foreground/70 flex h-full items-center justify-center text-xs">
        no data in this range
      </div>
    )
  }

  return (
    <div className="h-full w-full p-2 **:outline-none">
      <ResponsiveContainer key={metric} width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          aspectRatio={4 / 3}
          isAnimationActive={false}
          content={
            <TreemapCell dimension={dimension} onSelect={onSelect} />
          }
        >
          <Tooltip
            content={<DimTooltip dimension={dimension} />}
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
