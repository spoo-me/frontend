"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  CalendarDays,
  ChartSpline,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  MapPin,
} from "lucide-react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { Band } from "@/components/shared/section-shell"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { DimensionIcon } from "@/components/dashboard/dim-icon"
import {
  clickSeries,
  countryRows,
  referrerRows,
} from "@/components/sections/dashboard-hero-fixtures"
import { cn } from "@/lib/utils"

/* The real dashboard widgets, fed the landing fixtures — never an
   imitation. recharts / d3 stay off first paint (same pattern as the
   dashboard preview above this band). */
const ClicksChart = dynamic(
  () =>
    import("@/components/dashboard/clicks-chart").then((m) => m.ClicksChart),
  { ssr: false, loading: () => null }
)
const CountryMap = dynamic(
  () =>
    import("@/components/dashboard/analytics/country-map").then(
      (m) => m.CountryMap
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
const DonutChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/donut-chart").then(
      (m) => m.DonutChart
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

/* A filtered slice of the board series — visibly smaller than the full
   preview above, so the scope reads as a real cut. */
const scopedSeries = clickSeries.map((b) => ({
  ...b,
  clicks: Math.round(b.clicks * 0.18),
  unique_clicks: Math.round(b.unique_clicks * 0.18),
}))

/* Browsers Windows users in Delhi arrive on — DimensionRow wire shape. */
const browserRows = [
  { value: "Chrome", clicks: 1124, unique_clicks: 792, percentage: 55.5 },
  { value: "Edge", clicks: 428, unique_clicks: 301, percentage: 21.1 },
  { value: "Firefox", clicks: 296, unique_clicks: 214, percentage: 14.6 },
  { value: "Opera", clicks: 104, unique_clicks: 76, percentage: 5.1 },
  { value: "Brave", clicks: 74, unique_clicks: 52, percentage: 3.7 },
]

/* Every dimension here is a shipped filterKey (browser, os, country, city,
   referrer, link). Sentence words stay human; pills carry the product-real
   values the dashboard would show. Each answer takes a different chart ink,
   the way board widgets do — never violet, so the inks read as data, not
   brand. */
type Pill = { dim: string; value: string; label: string }

type QueryPart = { t: string; pill?: Pill }

type Query = {
  id: string
  parts: QueryPart[]
  widget: { icon: React.ElementType; title: string }
  ink: string
  chart: React.ReactNode
}

const QUERIES: Query[] = [
  {
    id: "chrome-de-discord",
    parts: [
      { t: "Show me " },
      {
        t: "Chrome",
        pill: { dim: "browser", value: "Chrome", label: "Chrome" },
      },
      { t: " users from " },
      {
        t: "Germany",
        pill: { dim: "country", value: "DE", label: "Germany" },
      },
      { t: " who came through " },
      {
        t: "Discord",
        pill: { dim: "referrer", value: "discord.com", label: "discord.com" },
      },
      { t: "." },
    ],
    widget: { icon: ChartSpline, title: "Clicks over time" },
    ink: "var(--chart-blue)",
    chart: (
      <ClicksChart
        series={scopedSeries}
        height={320}
        metric="total"
        variant="step"
      />
    ),
  },
  {
    id: "ios-instagram-countries",
    parts: [
      { t: "Show me where " },
      {
        t: "Instagram",
        pill: {
          dim: "referrer",
          value: "instagram.com",
          label: "instagram.com",
        },
      },
      { t: " sends my " },
      { t: "iOS", pill: { dim: "os", value: "iOS", label: "iOS" } },
      { t: " readers." },
    ],
    widget: { icon: MapPin, title: "Countries" },
    ink: "var(--chart-amber)",
    chart: <CountryMap rows={countryRows} metric="total" />,
  },
  {
    id: "launch-in-referrers",
    parts: [
      { t: "Show me who in " },
      { t: "India", pill: { dim: "country", value: "IN", label: "India" } },
      { t: " clicks the " },
      {
        t: "launch link",
        pill: { dim: "short_code", value: "launch", label: "/launch" },
      },
      { t: "." },
    ],
    widget: { icon: Globe2, title: "Referrers" },
    ink: "var(--chart-teal)",
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
    id: "delhi-windows-browsers",
    parts: [
      { t: "Show me what " },
      {
        t: "Windows",
        pill: { dim: "os", value: "Windows", label: "Windows" },
      },
      { t: " users in " },
      { t: "Delhi", pill: { dim: "city", value: "Delhi", label: "Delhi" } },
      { t: " browse with." },
    ],
    widget: { icon: Compass, title: "Browsers" },
    ink: "var(--chart-rose)",
    chart: (
      <DonutChart
        dimension="browser"
        rows={browserRows}
        metric="total"
        segments={5}
        legend
      />
    ),
  },
  {
    id: "x-macos-calendar",
    parts: [
      { t: "Show me when " },
      { t: "X", pill: { dim: "referrer", value: "x.com", label: "x.com" } },
      { t: " sends my " },
      { t: "macOS", pill: { dim: "os", value: "macOS", label: "macOS" } },
      { t: " readers." },
    ],
    widget: { icon: CalendarDays, title: "Calendar" },
    ink: "var(--chart-sky)",
    chart: (
      <CalendarHeatmap series={scopedSeries} hourly={false} metric="total" />
    ),
  },
]

/* The question lands, the pills follow, the widget answers, next. */
const ANSWER_MS = 450
const CYCLE_MS = 3400

export function AnalyticsQueryDemo() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { once: false, amount: 0.35 })
  const reduced = useReducedMotion()

  /* qi: the question on screen. shownQi: the query the widget answers —
     it lags a beat so the swap reads as the answer arriving. Arrow
     navigation hands the wheel to the user: auto-advance stops for good. */
  const [qi, setQi] = React.useState(0)
  const [shownQi, setShownQi] = React.useState(0)
  const [manual, setManual] = React.useState(false)

  React.useEffect(() => {
    const answer = setTimeout(() => setShownQi(qi), reduced ? 0 : ANSWER_MS)
    const next =
      !reduced && inView && !manual
        ? setTimeout(() => setQi((i) => (i + 1) % QUERIES.length), CYCLE_MS)
        : null
    return () => {
      clearTimeout(answer)
      if (next) clearTimeout(next)
    }
  }, [reduced, inView, manual, qi])

  function step(dir: 1 | -1) {
    setManual(true)
    setQi((i) => (i + dir + QUERIES.length) % QUERIES.length)
  }

  const query = QUERIES[qi]
  const pills = query.parts.filter((p) => p.pill)
  const shown = QUERIES[shownQi]

  return (
    <Band rule>
      <div className="grid gap-px bg-border lg:grid-cols-[1fr_1.5fr]">
        {/* Copy cell */}
        <div className="flex flex-col justify-center bg-background p-7 sm:p-9">
          <h3 className="text-balance font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Ask for the exact slice.
          </h3>
          <p className="mt-3 max-w-md text-balance text-base text-muted-foreground">
            Every widget on the board takes filters: browser, country, city,
            referrer, OS. Scope one, and the chart answers just that question.
          </p>
        </div>

        {/* Artifact cell — the real widget, scoped live */}
        <div className="bg-background p-5 sm:p-9" ref={stageRef}>
          <div
            className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5"
            style={{ "--chart-accent": shown.ink } as React.CSSProperties}
          >
            <SectionHeader
              className="h-10 shrink-0 px-2.5"
              icon={shown.widget.icon}
              title={shown.widget.title}
              badge={
                <AnimatePresence mode="wait">
                  <motion.span
                    key={query.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex min-w-0 items-center gap-1.5"
                  >
                    {pills.map((p) => (
                      <span
                        key={p.pill!.dim}
                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums"
                      >
                        <DimensionIcon
                          dimension={p.pill!.dim}
                          value={p.pill!.value}
                          className="size-3.5 shrink-0"
                        />
                        {p.pill!.label}
                      </span>
                    ))}
                  </motion.span>
                </AnimatePresence>
              }
            />
            <Panel className="mt-0 min-h-0 flex-1 overflow-hidden rounded-[14px] bg-background">
              <div className="h-[320px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={shown.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {shown.chart}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Panel>
          </div>

          {/* The question, beneath the widget it scopes */}
          <div className="mt-6 flex h-14 items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Previous example"
              onClick={() => step(-1)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" strokeWidth={1.75} />
            </button>
            <div className="flex min-w-0 flex-1 justify-center sm:max-w-xl">
              <AnimatePresence mode="wait">
                <motion.p
                  key={query.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="text-balance text-center text-lg text-muted-foreground italic sm:text-xl"
                >
                  <span aria-hidden className="text-muted-foreground/60">
                    &ldquo;
                  </span>
                  {query.parts.map((p, i) => (
                    <span
                      key={i}
                      className={cn(p.pill && "font-medium text-foreground")}
                    >
                      {p.t}
                    </span>
                  ))}
                  <span aria-hidden className="text-muted-foreground/60">
                    &rdquo;
                  </span>
                </motion.p>
              </AnimatePresence>
            </div>
            <button
              type="button"
              aria-label="Next example"
              onClick={() => step(1)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground"
            >
              <ChevronRight className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </Band>
  )
}
