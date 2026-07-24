"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChartSpline,
  ChevronRight,
  Compass,
  Globe2,
  History,
  LineChart,
  Link2,
  MapPin,
  Maximize2,
  LayoutDashboard,
  MonitorSmartphone,
  Table2,
  Filter,
} from "@/components/icons"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import { KpiCard } from "@/components/dashboard/kpi"
import { SectionHeader } from "@/components/dashboard/section"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { siteConfig } from "@/lib/site-config"
import {
  clickSeries,
  countryRows,
  kpis,
  referrerRows,
} from "@/components/sections/dashboard-hero-fixtures"

/**
 * The landing's product shot: the analytics page in its real chrome —
 * breadcrumb topbar, filter chips, the actual chart/list/map widgets —
 * fed static fixtures. No fetching for board data, no session state, no
 * window chrome; one thin glass border, hard-cropped with a fade into the
 * page background.
 *
 * recharts and the d3 map stay off first paint via next/dynamic({ssr:false})
 * into fixed-height slots.
 */

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

export function DashboardHero() {
  return (
    <>
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          title={
            <>
              Click insights without{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                a separate tool.
              </span>
            </>
          }
          description="A real analytics product, included with every link. No third-party scripts, no cookie banners. Yours by default."
        />
      </Band>

      {/* Preview band — the app pours under the next rule, hard-cropped */}
      <Band rule className="overflow-hidden px-5 pt-10 sm:px-12 sm:pt-14">
        <GutterHatch />
        <div className="relative mx-auto -mb-24 max-w-6xl sm:-mb-32">
          {/* KpiCard's info hints are Radix tooltips; the marketing layout
              has no provider (the dashboard layout owns one). */}
          <TooltipProvider delayDuration={0}>
            <AppFrame />
          </TooltipProvider>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"
        />
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <Button asChild variant="outline" size="sm">
            <a href={siteConfig.app.dashboard} target="_blank" rel="noreferrer">
              See live demo
              <ArrowUpRight className="size-3.5" data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </Band>

      <Callouts />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* The app frame: glass border › topbar + board                        */
/* ------------------------------------------------------------------ */

function AppFrame() {
  return (
    <div className="relative">
      {/* Thin padded glass frame around the whole app — the panels' own
          p-0.5 recipe at frame scale: hairline, small gutter, hairline. */}
      <div className="rounded-[20px] border border-border/60 bg-shell/40 p-1 backdrop-blur-md">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background [zoom:0.92]">
          <Topbar />
          <div className="space-y-5 p-5 sm:p-8">
            <ChipsRow />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
              <ChartPanel />
              <StatColumn />
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <ReferrersPanel />
              <CountriesPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Topbar() {
  return (
    <div className="flex h-[52px] items-center justify-between border-border/60 border-b px-4">
      <span className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Dashboard</span>
        <ChevronRight className="size-3.5 text-muted-foreground/50" />
        <span className="font-medium text-foreground">Analytics</span>
      </span>
    </div>
  )
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-shell px-2.5 text-[13px] text-foreground">
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
      {children}
    </span>
  )
}

function ChipsRow() {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Chip icon={CalendarDays}>Last 30 days</Chip>
      <Chip icon={Link2}>Links</Chip>
      <Chip icon={Globe2}>Referrer</Chip>
      <Chip icon={MapPin}>Country</Chip>
      <span className="hidden items-center gap-2 md:flex">
        <Chip icon={Compass}>Browser</Chip>
        <Chip icon={MonitorSmartphone}>OS</Chip>
        <Chip icon={Building2}>City</Chip>
      </span>
    </div>
  )
}

/** Widget-header control cluster: viz toggle + expand. */
function HeaderControls({ table = false }: { table?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="hidden h-7 items-center rounded-lg border border-border/60 bg-shell sm:inline-flex">
        <span className="flex h-full items-center rounded-lg border border-border bg-card px-2 text-foreground">
          {table ? (
            <Filter className="size-3.5" strokeWidth={1.75} />
          ) : (
            <LineChart className="size-3.5" strokeWidth={1.75} />
          )}
        </span>
        <span className="flex h-full items-center px-2 text-muted-foreground">
          <Table2 className="size-3.5" strokeWidth={1.75} />
        </span>
      </span>
      <Maximize2
        className="hidden size-3.5 text-muted-foreground sm:block"
        strokeWidth={1.75}
      />
    </span>
  )
}

function ChartPanel() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5 lg:col-span-3">
      <SectionHeader
        className="h-10 px-2.5"
        icon={ChartSpline}
        title="Clicks over time"
        action={<HeaderControls />}
      />
      <div className="mt-0 flex-1 rounded-[14px] bg-background p-3">
        <div className="h-[280px]">
          <ClicksChart series={clickSeries} height={280} metric="both" />
        </div>
      </div>
    </div>
  )
}

function StatColumn() {
  return (
    <div className="flex flex-col gap-5">
      <KpiCard
        label="Unique visitors"
        value={kpis.uniqueVisitors}
        delta={kpis.uniqueDelta}
        deltaLabel="vs previous 30d"
      />
      <KpiCard
        label="Total clicks"
        value={kpis.totalClicks}
        delta={kpis.totalDelta}
        deltaLabel="vs previous 30d"
      />
      <KpiCard
        label="Avg redirect"
        value={kpis.avgRedirectMs}
        sub="ms"
        footer="median over 30 days"
      />
    </div>
  )
}

function ReferrersPanel() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5 lg:col-span-2">
      <SectionHeader
        className="h-10 px-2.5"
        icon={Globe2}
        title="Top referrers"
        action={<HeaderControls table />}
      />
      <div className="mt-0 flex-1 rounded-[14px] bg-background p-2">
        <BreakdownList dimension="referrer" rows={referrerRows} limit={7} />
      </div>
    </div>
  )
}

function CountriesPanel() {
  return (
    <div
      className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5 lg:col-span-3"
      style={
        { "--chart-accent": "var(--chart-neutral)" } as React.CSSProperties
      }
    >
      <SectionHeader
        className="h-10 px-2.5"
        icon={MapPin}
        title="Countries"
        action={<HeaderControls />}
      />
      <div className="mt-0 flex-1 overflow-hidden rounded-[14px] bg-background">
        <div className="h-[300px]">
          <CountryMap rows={countryRows} metric="total" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Claim cells                                                         */
/* ------------------------------------------------------------------ */

function Callouts() {
  const callouts = [
    {
      icon: LineChart,
      title: "Per-link dashboards",
      description:
        "Open any short link and get its own time series: clicks, unique visitors, repeat behavior.",
    },
    {
      icon: History,
      title: "Compare periods",
      description:
        "Ghost the previous range under any chart and read the drift at a glance.",
    },
    {
      icon: LayoutDashboard,
      title: "A board you arrange",
      description:
        "Drag, resize, and swap between a dozen chart types: donut to treemap to calendar heatmap.",
    },
    {
      icon: Globe2,
      title: "Built-in geo maps",
      description:
        "World-level click distribution on a choropleth, without a single third-party script.",
    },
  ]
  return (
    <Band rule>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {callouts.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-3 bg-background p-6 sm:p-7"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-foreground">
              <c.icon className="size-3.5" />
            </span>
            <div>
              <h4 className="font-semibold text-foreground text-sm tracking-tight">
                {c.title}
              </h4>
              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Band>
  )
}
