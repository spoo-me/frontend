"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { TimeBucket } from "@/lib/api"
import type { ChartMetric } from "@/components/dashboard/clicks-chart"

/**
 * The contributions grid: one accent-tinted cell per day, columns are
 * weeks, rows are weekdays. Intensity is quantized into five steps so the
 * eye reads bands, not noise. Clicking a day narrows the board's range to
 * it. Hourly ranges (a 24h window) render as a single strip of hours.
 */

const DAY_MS = 86_400_000
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", ""]
const monthFmt = new Intl.DateTimeFormat("en", { month: "short" })
const dayFmt = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
})
const hourFmt = new Intl.DateTimeFormat("en", { hour: "numeric" })

/** Five GitHub-style steps: transparent-ish base up to full accent. */
function stepFill(value: number, max: number) {
  if (value <= 0 || max <= 0) return "var(--map-base)"
  const q = Math.min(4, Math.max(1, Math.ceil((value / max) * 4)))
  const pct = [0, 30, 52, 74, 96][q]
  return `color-mix(in oklab, var(--chart-accent, var(--brand)) ${pct}%, var(--background))`
}

export function CalendarHeatmap({
  series,
  hourly,
  metric,
  onRangeSelect,
}: {
  series: TimeBucket[]
  hourly: boolean
  metric: ChartMetric
  onRangeSelect?: (from: Date, to: Date) => void
}) {
  const value = (b: TimeBucket) =>
    metric === "unique" ? b.unique_clicks : b.clicks

  const max = React.useMemo(
    () => Math.max(0, ...series.map(value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, metric],
  )

  // Cells grow into whatever the grid cell offers (a bigger widget means
  // bigger day squares, not more dead space around a fixed grid).
  const ref = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)
  const hasData = series.length > 0
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setBox({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
    // Re-attach when data arrives: the empty state renders without the ref.
  }, [hasData])

  if (!series.length) {
    return (
      <div className="text-muted-foreground/70 flex h-full items-center justify-center text-xs">
        no data in this range
      </div>
    )
  }

  /* Hourly window (a day or so of hourly buckets): a labelled strip of
     hour cells, sized to the panel like the daily grid. Finer-than-daily
     cells for LONGER ranges need the backend to serve hourly buckets. */
  if (hourly) {
    const count = series.length
    const cell = box
      ? Math.max(
          10,
          Math.min(
            36,
            Math.floor(Math.min((box.w - 8) / count, box.h - 18)) - 3,
          ),
        )
      : 16
    return (
      <div ref={ref} className="flex h-full w-full items-center justify-center p-4">
        <div className="flex gap-[3px]">
          {series.map((b) => {
            const t = new Date(b.bucket)
            const hour = t.getHours()
            return (
              <div key={b.bucket} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  title={`${hourFmt.format(t)} · ${formatCount(value(b))} ${metric === "unique" ? "unique" : "clicks"}`}
                  onClick={() =>
                    onRangeSelect?.(t, new Date(t.getTime() + 3_600_000))
                  }
                  className={cn(
                    "transition-transform duration-150",
                    onRangeSelect && "cursor-pointer hover:scale-110",
                  )}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: Math.max(3, Math.round(cell / 6)),
                    background: stepFill(value(b), max),
                  }}
                />
                <span className="text-muted-foreground/60 h-3 font-mono text-[9px] leading-none whitespace-nowrap">
                  {hour % 6 === 0 ? hourFmt.format(t) : ""}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* Daily grid: pad the first week so weekday rows line up (Monday top). */
  const byDay = new Map(
    series.map((b) => [new Date(b.bucket).setHours(0, 0, 0, 0), b]),
  )
  const first = new Date(series[0].bucket)
  first.setHours(0, 0, 0, 0)
  const last = new Date(series[series.length - 1].bucket)
  last.setHours(0, 0, 0, 0)
  const mondayIndex = (d: Date) => (d.getDay() + 6) % 7
  const start = first.getTime() - mondayIndex(first) * DAY_MS
  const days: Array<{ t: number; bucket?: TimeBucket }> = []
  for (let t = start; t <= last.getTime(); t += DAY_MS)
    days.push({ t, bucket: byDay.get(t) })
  const weeks: Array<typeof days> = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // Fit: labels take ~34px of width and 15px of height; 3px gaps ride on
  // top of the cell size. Clamped so tiny widgets stay legible and huge
  // ones don't turn into a Mondrian.
  const GAP = 3
  const cell = box
    ? Math.max(
        10,
        Math.min(
          36,
          Math.floor(
            Math.min((box.w - 34) / weeks.length, (box.h - 15) / 7),
          ) - GAP,
        ),
      )
    : 16
  const radius = Math.max(3, Math.round(cell / 6))

  // Month label above the first week, and above any week containing a 1st
  // (labelled with THAT month, not the week's start month).
  const monthLabel = (week: typeof days, wi: number) => {
    const firstOfMonth = week.find((d) => new Date(d.t).getDate() === 1)
    if (firstOfMonth) return monthFmt.format(firstOfMonth.t)
    if (wi === 0) return monthFmt.format(week[week.length - 1].t)
    return null
  }

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center p-4">
      <div className="flex max-h-full gap-1.5">
        <div className="flex shrink-0 flex-col gap-[3px] pt-[15px]" aria-hidden>
          {WEEKDAYS.map((d, i) => (
            <span
              key={i}
              className="text-muted-foreground/60 flex items-center pr-1 font-mono text-[9px] leading-none"
              style={{ height: cell }}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 gap-[3px] overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              <span className="text-muted-foreground/60 h-3 font-mono text-[9px] leading-none whitespace-nowrap">
                {monthLabel(week, wi)}
              </span>
              {week.map(({ t, bucket }) => {
                if (!bucket)
                  return (
                    <span key={t} style={{ width: cell, height: cell }} />
                  )
                const v = value(bucket)
                return (
                  <button
                    key={t}
                    type="button"
                    title={`${dayFmt.format(t)} · ${formatCount(v)} ${metric === "unique" ? "unique" : "clicks"}`}
                    onClick={() =>
                      onRangeSelect?.(new Date(t), new Date(t + DAY_MS))
                    }
                    className={cn(
                      "transition-transform duration-150",
                      onRangeSelect && "cursor-pointer hover:scale-110",
                    )}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: radius,
                      background: stepFill(v, max),
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
