"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatCount } from "@/lib/format"
import type { TimeBucket } from "@/lib/api"

/**
 * Structural chart (DIRECTION §3): quiet neutral ink, dashed hairline grid,
 * soft gradient fill, no dots — one violet moment budgeted for the active
 * point. Tooltip is a data card with computed rows (ref 26).
 */

const hourFmt = new Intl.DateTimeFormat("en", { hour: "numeric" })
const dayFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" })
const fullFmt = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
})

type Datum = TimeBucket & { t: number }

function ChartTooltip({
  active,
  payload,
  hourly,
}: {
  active?: boolean
  payload?: Array<{ payload: Datum }>
  hourly: boolean
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const rate = d.clicks ? Math.round((d.unique_clicks / d.clicks) * 100) : 0
  return (
    <div className="border-border/60 bg-popover min-w-[168px] overflow-hidden rounded-lg border shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
      <div className="border-border/60 bg-muted/40 border-b px-3 py-1.5">
        <span className="text-foreground text-xs font-medium">
          {hourly ? fullFmt.format(d.t) : dayFmt.format(d.t)}
        </span>
      </div>
      <div className="space-y-1 px-3 py-2">
        <Row swatch="bg-brand" label="Clicks" value={formatCount(d.clicks)} />
        <Row
          swatch="border-brand border bg-transparent"
          label="Unique"
          value={formatCount(d.unique_clicks)}
        />
        <div className="border-border/60 mt-1.5 border-t pt-1.5">
          <Row label="Unique rate" value={`${rate}%`} muted />
        </div>
      </div>
    </div>
  )
}

function Row({
  swatch,
  label,
  value,
  muted,
}: {
  swatch?: string
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {swatch && <span className={`size-2 rounded-full ${swatch}`} />}
      <span className="text-muted-foreground flex-1 text-xs">{label}</span>
      <span
        className={`font-mono text-xs font-medium tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  )
}

export type ChartMetric = "total" | "unique" | "both"

export function ClicksChart({
  series,
  hourly = false,
  height = 240,
  metric = "total",
}: {
  series: TimeBucket[]
  hourly?: boolean
  height?: number
  /** total / unique swap the solid series; "both" overlays uniques dashed. */
  metric?: ChartMetric
}) {
  const data: Datum[] = React.useMemo(
    () => series.map((b) => ({ ...b, t: new Date(b.bucket).getTime() })),
    [series],
  )
  const tickFmt = hourly ? hourFmt : dayFmt

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 4"
            stroke="var(--border)"
            strokeOpacity={0.7}
          />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => tickFmt.format(t)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickMargin={8}
            minTickGap={48}
          />
          <YAxis
            width={44}
            tickFormatter={(v: number) => formatCount(v)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip hourly={hourly} />}
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 4", strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey={metric === "unique" ? "unique_clicks" : "clicks"}
            stroke="var(--brand)"
            strokeWidth={1.75}
            fill="url(#clicksFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: "var(--brand)", strokeWidth: 0 }}
          />
          {metric === "both" && (
            <Area
              type="monotone"
              dataKey="unique_clicks"
              stroke="var(--brand)"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              fill="none"
              dot={false}
              activeDot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
