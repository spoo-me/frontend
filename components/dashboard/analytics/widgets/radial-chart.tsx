"use client"

import * as React from "react"
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
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

/**
 * Concentric rings, activity-rings grammar: the leader is the outermost
 * and brightest ring, each arc's sweep is that category's share of the
 * leader. Same accent alpha ramp and legend grammar as the donut; rings
 * and legend rows are click-to-filter.
 */

type Ring = DimensionRow & { fill: string }

export function RadialChart({
  dimension,
  rows,
  metric,
  segments,
  legend,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Ring count (size-derived; rings thin out fast beyond ~6). */
  segments: number
  legend: boolean
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"

  const rings: Ring[] = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => b[key] - a[key]).slice(0, segments)
    const n = sorted.length
    const ramp = (i: number) =>
      `color-mix(in oklab, var(--chart-accent, var(--brand)) ${Math.round(90 - i * (56 / Math.max(n - 1, 1)))}%, var(--background))`
    // Recharts draws the FIRST datum innermost; reverse so the leader is
    // the outer ring, then the ramp still runs bright -> quiet inward.
    return sorted.map((r, i) => ({ ...r, fill: ramp(i) })).reverse()
  }, [rows, key, segments])

  const max = rings.length ? Math.max(...rings.map((r) => r[key])) : 0

  if (!rows.length) {
    return <EmptyRange />
  }

  const legendRows = [...rings].reverse()

  return (
    <div className="flex h-full w-full items-stretch gap-2 p-2">
      <div className="relative min-w-0 flex-1 **:outline-none">
        <ResponsiveContainer key={metric} width="100%" height="100%">
          <RadialBarChart
            data={rings}
            innerRadius="24%"
            outerRadius="98%"
            startAngle={90}
            endAngle={-270}
          >
            {/* Sweep is share-of-leader on a hidden axis. */}
            <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
            <Tooltip
              content={<DimTooltip dimension={dimension} />}
              wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            />
            <RadialBar
              dataKey={key}
              background={{ fill: "var(--map-base)", opacity: 0.4 }}
              cornerRadius={6}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              onClick={(d) => {
                const raw = d as {
                  value?: unknown
                  payload?: { value?: unknown }
                }
                const v = raw.payload?.value ?? raw.value
                if (typeof v === "string") onSelect?.(v)
              }}
              className={onSelect ? "cursor-pointer" : undefined}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      {legend && (
        <div className="flex w-[42%] min-w-0 shrink-0 flex-col justify-center gap-0.5 pr-1">
          {legendRows.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(r.value)}
              className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors duration-150 hover:bg-accent/60 disabled:pointer-events-none"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: r.fill }}
              />
              <DimensionIcon
                dimension={dimension}
                value={r.value}
                className="size-3.5 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate text-foreground text-xs">
                {dimensionLabel(dimension, r.value)}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {metric === "both"
                  ? `${formatCount(r.clicks)} · ${formatCount(r.unique_clicks)}`
                  : formatCount(r[key])}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
