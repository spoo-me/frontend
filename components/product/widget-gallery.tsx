"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  CalendarDays,
  ChartColumn,
  ChartPie,
  ChartSpline,
  Grip,
  LayoutGrid,
} from "lucide-react"

import { Band } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { SectionHeader } from "@/components/dashboard/section"
import { clickSeries } from "@/components/sections/dashboard-hero-fixtures"
import type { DimensionRow } from "@/lib/api"

/* The real widgets, isolated: one cell per chart type the board can
   swap between, each with the question it's best at. recharts stays
   off first paint, same pattern as everywhere else. */

const ClicksChart = dynamic(
  () =>
    import("@/components/dashboard/clicks-chart").then((m) => m.ClicksChart),
  { ssr: false, loading: () => null }
)
const DonutChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/donut-chart").then(
      (m) => m.DonutChart
    ),
  { ssr: false, loading: () => null }
)
const TreemapChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/treemap-chart").then(
      (m) => m.TreemapChart
    ),
  { ssr: false, loading: () => null }
)
const ColumnChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/column-chart").then(
      (m) => m.ColumnChart
    ),
  { ssr: false, loading: () => null }
)
const CalendarHeatmap = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/calendar-heatmap").then(
      (m) => m.CalendarHeatmap
    ),
  { ssr: false, loading: () => null }
)
const BubbleChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/bubble-chart").then(
      (m) => m.BubbleChart
    ),
  { ssr: false, loading: () => null }
)

const browserRows: DimensionRow[] = [
  { value: "Chrome", clicks: 1124, unique_clicks: 792, percentage: 55.5 },
  { value: "Safari", clicks: 486, unique_clicks: 344, percentage: 24.0 },
  { value: "Firefox", clicks: 296, unique_clicks: 214, percentage: 14.6 },
  { value: "Edge", clicks: 120, unique_clicks: 84, percentage: 5.9 },
]

const referrerRows: DimensionRow[] = [
  { value: "google.com", clicks: 1900, unique_clicks: 1240, percentage: 34 },
  { value: "github.com", clicks: 986, unique_clicks: 700, percentage: 18 },
  { value: "x.com", clicks: 772, unique_clicks: 560, percentage: 14 },
  { value: "chatgpt.com", clicks: 462, unique_clicks: 330, percentage: 8 },
  { value: "reddit.com", clicks: 416, unique_clicks: 300, percentage: 7 },
  { value: "discord.com", clicks: 380, unique_clicks: 270, percentage: 7 },
]

const cityRows: DimensionRow[] = [
  { value: "Berlin", clicks: 640, unique_clicks: 450, percentage: 22 },
  { value: "Tokyo", clicks: 540, unique_clicks: 380, percentage: 19 },
  { value: "San Francisco", clicks: 470, unique_clicks: 330, percentage: 16 },
  { value: "London", clicks: 420, unique_clicks: 300, percentage: 15 },
  { value: "Bengaluru", clicks: 360, unique_clicks: 255, percentage: 12 },
  { value: "São Paulo", clicks: 280, unique_clicks: 200, percentage: 10 },
]

type GalleryCell = {
  id: string
  icon: React.ElementType
  title: string
  name: string
  copy: string
  chart: React.ReactNode
  ink?: string
}

const CELLS: GalleryCell[] = [
  {
    id: "timeseries",
    icon: ChartSpline,
    title: "Clicks over time",
    name: "Time series",
    copy: "The pulse. Line, step, or bars per bucket, with uniques and totals as separate strands.",
    ink: "var(--chart-blue)",
    chart: (
      <ClicksChart
        series={clickSeries}
        height="100%"
        metric="both"
        variant="step"
      />
    ),
  },
  {
    id: "heatmap",
    icon: CalendarDays,
    title: "Clicks over time",
    name: "Calendar heatmap",
    copy: "The rhythm. Which weekdays carry your traffic, and whether the launch broke the pattern.",
    ink: "var(--chart-teal)",
    chart: (
      <CalendarHeatmap series={clickSeries} hourly={false} metric="total" />
    ),
  },
  {
    id: "donut",
    icon: ChartPie,
    title: "Browsers",
    name: "Donut",
    copy: "Share of a whole. Four browsers, one glance, no mental math.",
    ink: "var(--chart-rose)",
    chart: (
      <DonutChart
        dimension="browser"
        rows={browserRows}
        metric="total"
        segments={4}
        legend
      />
    ),
  },
  {
    id: "treemap",
    icon: LayoutGrid,
    title: "Referrers",
    name: "Treemap",
    copy: "Many values at once. The long tail of referrers stays legible instead of becoming an 'other' bucket.",
    ink: "var(--chart-amber)",
    chart: (
      <TreemapChart
        dimension="referrer"
        rows={referrerRows}
        metric="total"
        segments={6}
      />
    ),
  },
  {
    id: "columns",
    icon: ChartColumn,
    title: "Cities",
    name: "Columns",
    copy: "Ranked comparison. Cities side by side when the order matters more than the share.",
    ink: "var(--chart-sky)",
    chart: (
      <ColumnChart
        dimension="city"
        rows={cityRows.slice(0, 5)}
        metric="total"
        count={5}
      />
    ),
  },
  {
    id: "bubble",
    icon: Grip,
    title: "Cities",
    name: "Bubbles",
    copy: "Weight at a glance. Outliers surface themselves before you go looking.",
    ink: "var(--chart-violet, var(--chart-blue))",
    chart: (
      <BubbleChart dimension="city" rows={cityRows} metric="total" limit={6} />
    ),
  },
]

export function WidgetGallery() {
  return (
    <>
      <Band rule className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          align="center"
          title={
            <>
              A board you{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                rearrange.
              </span>
            </>
          }
          description="Drag it, resize it, swap any widget between a dozen chart types. The same numbers, whichever shape answers your question fastest."
        />
      </Band>

      <Band rule>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {CELLS.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-5 bg-background p-6 sm:p-7"
            >
              <div
                className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5"
                style={{ "--chart-accent": c.ink } as React.CSSProperties}
              >
                <SectionHeader
                  className="h-10 shrink-0 px-2.5"
                  icon={c.icon}
                  title={c.title}
                />
                <div className="mt-0 overflow-hidden rounded-[14px] bg-background p-3">
                  <div className="h-44">{c.chart}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm tracking-tight">
                  {c.name}
                </h3>
                <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                  {c.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Band>
    </>
  )
}
