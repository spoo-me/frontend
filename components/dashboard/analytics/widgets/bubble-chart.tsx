"use client"

import * as React from "react"
import { hierarchy, pack } from "d3-hierarchy"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { DimTooltip } from "@/components/dashboard/analytics/widgets/dim-tooltip"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

/**
 * Circle packing: every category is a bubble sized by its count, identity
 * marks inside the big ones. The whole cluster reads as proportion at a
 * glance; hover carries the numbers (hand-rolled tooltip — no recharts
 * here, d3-hierarchy computes the layout, we draw the SVG). Bubbles are
 * click-to-filter.
 */

const ICON_DIMS = new Set(["referrer", "country", "browser", "os"])

type Bubble = { x: number; y: number; r: number; row: DimensionRow; tint: string }

export function BubbleChart({
  dimension,
  rows,
  metric,
  limit,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Bubble count (area-derived). */
  limit: number
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null)
  const [hover, setHover] = React.useState<{
    x: number
    y: number
    row: DimensionRow
    /** Near the top edge the card flips below so the panel can't clip it. */
    below: boolean
  } | null>(null)

  const hasData = rows.length > 0
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
    // Re-attach when data arrives: the empty state renders without the ref.
  }, [hasData])

  const bubbles: Bubble[] = React.useMemo(() => {
    if (!size) return []
    const top = [...rows]
      .sort((a, b) => b[key] - a[key])
      .slice(0, limit)
      .filter((r) => r[key] > 0)
    if (!top.length) return []
    type PackDatum = { children?: DimensionRow[] } | DimensionRow
    const root = hierarchy<PackDatum>({ children: top }).sum((d) =>
      "value" in d ? d[key] : 0,
    )
    const packed = pack<PackDatum>().size([size.w, size.h]).padding(4)(root)
    const n = top.length
    const rank = new Map(top.map((r, i) => [r.value, i]))
    return packed.leaves().map((leaf) => {
      const row = leaf.data as DimensionRow
      const i = rank.get(row.value) ?? n - 1
      return {
        x: leaf.x,
        y: leaf.y,
        r: leaf.r,
        row,
        tint: `color-mix(in oklab, var(--chart-accent, var(--brand)) ${Math.round(62 - i * (44 / Math.max(n - 1, 1)))}%, var(--background))`,
      }
    })
  }, [rows, key, limit, size])

  if (!rows.length) {
    return (
      <EmptyRange />
    )
  }

  return (
    <div ref={ref} className="relative h-full w-full p-2">
      {size && (
        <svg width={size.w} height={size.h} className="absolute inset-2">
          {bubbles.map((b) => {
            const showIcon = ICON_DIMS.has(dimension) && b.r > 14
            const showLabel = b.r > 30
            return (
              <g
                key={b.row.value}
                onClick={onSelect ? () => onSelect(b.row.value) : undefined}
                onMouseEnter={() => {
                  const below = b.y - b.r < 132
                  setHover({
                    x: b.x,
                    y: below ? b.y + b.r : b.y - b.r,
                    row: b.row,
                    below,
                  })
                }}
                onMouseLeave={() => setHover(null)}
                className={cn(onSelect && "cursor-pointer")}
              >
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={b.r}
                  fill={b.tint}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
                {showIcon && (
                  <foreignObject
                    x={b.x - 8}
                    y={b.y - (showLabel ? 16 : 8)}
                    width={16}
                    height={16}
                    className="pointer-events-none"
                  >
                    <div className="flex h-full w-full items-center justify-center **:block">
                      <DimensionIcon
                        dimension={dimension}
                        value={b.row.value}
                        className="size-4"
                      />
                    </div>
                  </foreignObject>
                )}
                {showLabel && (
                  <>
                    <text
                      x={b.x}
                      y={b.y + (ICON_DIMS.has(dimension) ? 8 : 0)}
                      textAnchor="middle"
                      fill="var(--foreground)"
                      fillOpacity={0.9}
                      fontSize={11}
                      fontWeight={500}
                      className="pointer-events-none"
                    >
                      {truncate(dimensionLabel(dimension, b.row.value), b.r)}
                    </text>
                    <text
                      x={b.x}
                      y={b.y + (ICON_DIMS.has(dimension) ? 22 : 14)}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize={10}
                      fontFamily="var(--font-geist-mono, monospace)"
                      className="pointer-events-none"
                    >
                      {formatCount(b.row[key])}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      )}
      {hover && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 -translate-x-1/2",
            hover.below ? "pt-2" : "-translate-y-full pb-2",
          )}
          style={{ left: hover.x + 8, top: hover.y + 8 }}
        >
          <DimTooltip active payload={[{ payload: hover.row }]} dimension={dimension} />
        </div>
      )}
    </div>
  )
}

function truncate(label: string, r: number) {
  const chars = Math.max(3, Math.floor((r * 1.6) / 7))
  return label.length > chars ? `${label.slice(0, chars - 1)}…` : label
}
