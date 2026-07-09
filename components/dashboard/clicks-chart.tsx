"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
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

/** Draw duration; the animate flag holds slightly longer so nothing cancels it. */
const ANIM_MS = 700

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
    <div className="min-w-[168px] overflow-hidden rounded-lg border border-border/60 bg-popover shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
      <div className="border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium text-foreground">
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
        <div className="mt-1.5 border-t border-border/60 pt-1.5">
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
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
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
  expanded = false,
  onRangeSelect,
}: {
  series: TimeBucket[]
  hourly?: boolean
  height?: number | string
  /** total / unique swap the solid series; "both" overlays uniques dashed. */
  metric?: ChartMetric
  /** Entering the expanded (focus) view grows the area's amplitude from the
      baseline up into the taller canvas. Purely presentational: the plot
      snaps to its final geometry and a scaleY animation on the area layer
      carries the motion, so axes and labels never distort. */
  expanded?: boolean
  /** Drag-to-zoom: drag across the plot to select a window; on release the
      selection (snapped to buckets, end bucket included) is handed here. */
  onRangeSelect?: (from: Date, to: Date) => void
}) {
  const data: Datum[] = React.useMemo(
    () => series.map((b) => ({ ...b, t: new Date(b.bucket).getTime() })),
    [series]
  )
  const tickFmt = hourly ? hourFmt : dayFmt

  // Animation = data change, and recharts can't be trusted to deliver it:
  // its appear animation dies when unrelated re-renders (query-state flips,
  // container re-measures) land mid-draw, which on these pages is always.
  // So the left-to-right draw on new data is OUR clip-path animation (CSS
  // can't be cancelled by a re-render), recharts stays static for it, and
  // recharts' update interpolation is used only to morph metric switches.
  const dataIdentity = React.useMemo(
    () =>
      `${data.length}:${data[0]?.t ?? 0}:${data[data.length - 1]?.clicks ?? 0}:${data[data.length - 1]?.t ?? 0}`,
    [data]
  )
  const [drawnData, setDrawnData] = React.useState<string | null>(null)
  const draw = drawnData !== dataIdentity
  React.useEffect(() => {
    if (!draw) return
    const t = setTimeout(() => setDrawnData(dataIdentity), ANIM_MS + 150)
    return () => clearTimeout(t)
  }, [draw, dataIdentity])

  // The morph flag must HOLD through the whole interpolation — flipping
  // isAnimationActive mid-flight cancels it.
  const [morphFrom, setMorphFrom] = React.useState(metric)
  const morph = morphFrom !== metric
  React.useEffect(() => {
    if (!morph) return
    const t = setTimeout(() => setMorphFrom(metric), ANIM_MS + 150)
    return () => clearTimeout(t)
  }, [morph, metric])

  // Drag-to-zoom: track the pressed and current bucket; the live region
  // renders as a ReferenceArea and commits as a custom range on release.
  // The last hovered bucket is kept in a ref because mousedown state may
  // not carry activeLabel before the first move settles.
  const [drag, setDrag] = React.useState<{ a: number; b: number } | null>(null)
  const hoverX = React.useRef<number | null>(null)
  const dragX = (e: { activeLabel?: string | number } | null) =>
    e?.activeLabel == null ? null : Number(e.activeLabel)
  const commitDrag = () => {
    setDrag(null)
    if (!drag || drag.a === drag.b || !onRangeSelect) return
    const lo = Math.min(drag.a, drag.b)
    const hi = Math.max(drag.a, drag.b)
    const bucketMs = hourly ? 3_600_000 : 86_400_000
    onRangeSelect(new Date(lo), new Date(hi + bucketMs))
  }

  // Amplitude grow on entering focus mode; collapse just snaps.
  const [grow, setGrow] = React.useState(false)
  const prevExpanded = React.useRef(expanded)
  React.useEffect(() => {
    const entering = expanded && !prevExpanded.current
    prevExpanded.current = expanded
    if (!entering) return
    setGrow(true)
    const t = setTimeout(() => setGrow(false), 700)
    return () => clearTimeout(t)
  }, [expanded])

  return (
    <div
      style={{ height }}
      className={cn(
        // recharts' accessibility layer makes the svg a tab stop AND gives
        // every z-index layer <g> tabindex=-1, so any click (and drag)
        // would paint a focus ring around the svg or the plot layer's box.
        "w-full **:outline-none",
        draw && "chart-draw",
        grow && "chart-amplitude",
        onRangeSelect && "cursor-crosshair select-none"
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* Keyed on the data identity so new data always lays out fresh at
            final geometry under the CSS draw — never a recharts morph from
            a stale dataset. Metric switches stay off the key so they morph. */}
        <AreaChart
          key={dataIdentity}
          data={data}
          margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          onMouseDown={
            onRangeSelect
              ? (e) => {
                  const x = dragX(e) ?? hoverX.current
                  if (x != null) setDrag({ a: x, b: x })
                }
              : undefined
          }
          onMouseMove={
            onRangeSelect
              ? (e) => {
                  const x = dragX(e)
                  if (x == null) return
                  hoverX.current = x
                  setDrag((d) => (d && d.b !== x ? { ...d, b: x } : d))
                }
              : undefined
          }
          onMouseUp={onRangeSelect ? commitDrag : undefined}
          onMouseLeave={
            onRangeSelect
              ? () => {
                  hoverX.current = null
                  setDrag(null)
                }
              : undefined
          }
        >
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
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeDasharray: "3 4",
              strokeOpacity: 0.5,
            }}
          />
          <Area
            type="monotone"
            dataKey={metric === "unique" ? "unique_clicks" : "clicks"}
            stroke="var(--brand)"
            strokeWidth={1.75}
            fill="url(#clicksFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: "var(--brand)", strokeWidth: 0 }}
            isAnimationActive={morph}
            animationDuration={ANIM_MS}
            animationEasing="ease-out"
          />
          {drag && drag.a !== drag.b && (
            <ReferenceArea
              x1={Math.min(drag.a, drag.b)}
              x2={Math.max(drag.a, drag.b)}
              fill="var(--brand)"
              fillOpacity={0.08}
              stroke="var(--brand)"
              strokeOpacity={0.3}
            />
          )}
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
              isAnimationActive={morph}
              animationDuration={ANIM_MS}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
