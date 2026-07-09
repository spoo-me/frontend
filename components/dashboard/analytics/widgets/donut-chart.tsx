"use client"

import * as React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"

/**
 * Share-of-total view: a thin ring in a brand alpha ramp (top slices bright,
 * tail quiet, Other in the neutral map tone) with the total in the center.
 * Slices and legend rows are click-to-filter, same as bars and tables.
 */

const OTHER = "__other__"

type Slice = DimensionRow & { fill: string }

function DonutTooltip({
  active,
  payload,
  dimension,
}: {
  active?: boolean
  payload?: Array<{ payload: Slice }>
  dimension: Exclude<StatsDimension, "time">
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const rate = d.clicks ? Math.round((d.unique_clicks / d.clicks) * 100) : 0
  return (
    <div className="border-border/60 bg-popover min-w-[168px] overflow-hidden rounded-lg border shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
      <div className="border-border/60 bg-muted/40 border-b px-3 py-1.5">
        <span className="text-foreground text-xs font-medium">
          {d.value === OTHER ? "Other" : dimensionLabel(dimension, d.value)}
        </span>
      </div>
      <div className="space-y-1 px-3 py-2">
        <Row label="Clicks" value={formatCount(d.clicks)} />
        <Row label="Unique" value={formatCount(d.unique_clicks)} />
        <div className="border-border/60 mt-1.5 border-t pt-1.5">
          <Row label="Unique rate" value={`${rate}%`} muted />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground flex-1 text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-xs font-medium tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function DonutChart({
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
  /** Top-N slices before the Other bucket (size-derived). */
  segments: number
  legend: boolean
  onSelect?: (value: string) => void
}) {
  const key = metric === "unique" ? "unique_clicks" : "clicks"

  const slices: Slice[] = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => b[key] - a[key])
    const top = sorted.slice(0, segments)
    const rest = sorted.slice(segments)
    const n = top.length
    const ramp = (i: number) =>
      `color-mix(in oklab, var(--chart-accent, var(--brand)) ${Math.round(88 - i * (64 / Math.max(n - 1, 1)))}%, var(--background))`
    const out: Slice[] = top.map((r, i) => ({ ...r, fill: ramp(i) }))
    if (rest.length) {
      out.push({
        value: OTHER,
        clicks: rest.reduce((s, r) => s + r.clicks, 0),
        unique_clicks: rest.reduce((s, r) => s + r.unique_clicks, 0),
        percentage: rest.reduce((s, r) => s + r.percentage, 0),
        fill: "var(--map-base)",
      })
    }
    return out
  }, [rows, key, segments])

  const total = React.useMemo(
    () => rows.reduce((s, r) => s + r[key], 0),
    [rows, key],
  )

  if (!rows.length) {
    return (
      <div className="text-muted-foreground/70 flex h-full items-center justify-center text-xs">
        no data in this range
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-stretch gap-2 p-2">
      <div className="relative min-w-0 flex-1 **:outline-none">
        {/* Re-keyed on metric: slice order/size change replays the sweep,
            the same data-change grammar as the bar cascade. */}
        <ResponsiveContainer key={metric} width="100%" height="100%">
          <PieChart>
            <Tooltip content={<DonutTooltip dimension={dimension} />} />
            <Pie
              data={slices}
              dataKey={key}
              nameKey="value"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="var(--background)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              onClick={(d) => {
                // nameKey="value" puts the row's value string on `name`.
                const v = (d as { name?: string | number }).name
                if (typeof v === "string" && v !== OTHER) onSelect?.(v)
              }}
              className={onSelect ? "cursor-pointer" : undefined}
            >
              {slices.map((s) => (
                <Cell key={s.value} fill={s.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-foreground font-mono text-lg leading-none font-semibold tracking-tight tabular-nums">
            {formatCount(total)}
          </span>
          <span className="label-mono text-muted-foreground/60 mt-1 text-[9px]">
            {metric === "unique" ? "unique" : "clicks"}
          </span>
        </div>
      </div>
      {legend && (
        <div className="flex w-[42%] min-w-0 shrink-0 flex-col justify-center gap-0.5 pr-1">
          {slices.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={!onSelect || s.value === OTHER}
              onClick={() => onSelect?.(s.value)}
              className="hover:bg-accent/60 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors duration-150 disabled:pointer-events-none"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: s.fill }}
              />
              {s.value !== OTHER && (
                <DimensionIcon dimension={dimension} value={s.value} className="size-3.5 shrink-0" />
              )}
              <span className="text-foreground min-w-0 flex-1 truncate text-xs">
                {s.value === OTHER ? "Other" : dimensionLabel(dimension, s.value)}
              </span>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                {metric === "both"
                  ? `${formatCount(s.clicks)} · ${formatCount(s.unique_clicks)}`
                  : formatCount(s[key])}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
