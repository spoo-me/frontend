"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  Building2,
  ChartSpline,
  Compass,
  Globe2,
  Link2,
  MapPin,
  MonitorSmartphone,
} from "lucide-react"

import { KpiCard } from "@/components/dashboard/kpi"
import { SectionHeader } from "@/components/dashboard/section"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { BreakdownTable } from "@/components/dashboard/analytics/widgets/breakdown-table"
import {
  ChipsRow,
  HeaderControls,
  Topbar,
} from "@/components/sections/dashboard-hero"
import {
  clickSeries,
  countryRows,
  kpis,
  referrerRows,
} from "@/components/sections/dashboard-hero-fixtures"
import {
  browserRows,
  cityRows,
  linkRows,
  osRows,
} from "@/components/product/board-fixtures"

/* The DEFAULT analytics board, whole: the same widget set
   lib/analytics-layout.ts seeds for a fresh account — four stats, the
   timeseries, then country/city, links/referrers, browsers/OS. Same
   chrome as the landing preview, none of the crop. */

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

function Panel({
  icon,
  title,
  table = false,
  flush = false,
  children,
}: {
  icon: React.ElementType
  title: string
  table?: boolean
  flush?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5">
      <SectionHeader
        className="h-10 shrink-0 px-2.5"
        icon={icon}
        title={title}
        action={<HeaderControls table={table} />}
      />
      <div
        className={
          flush
            ? "mt-0 flex-1 overflow-hidden rounded-[14px] bg-background"
            : "mt-0 flex-1 rounded-[14px] bg-background p-2"
        }
      >
        {children}
      </div>
    </div>
  )
}

export function FullBoard() {
  return (
    <div className="relative">
      <div className="rounded-[20px] border border-border/60 bg-shell/40 p-1 backdrop-blur-md">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background [zoom:0.92]">
          <Topbar />
          <div className="space-y-5 p-5 sm:p-8">
            <ChipsRow />

            {/* Stat row — the four defaults */}
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <KpiCard
                label="Total clicks"
                value={kpis.totalClicks}
                delta={kpis.totalDelta}
                deltaLabel="vs previous 30d"
              />
              <KpiCard
                label="Unique visitors"
                value={kpis.uniqueVisitors}
                delta={kpis.uniqueDelta}
                deltaLabel="vs previous 30d"
              />
              <KpiCard
                label="Unique rate"
                value="69.9%"
                footer="uniques per click"
              />
              <KpiCard
                label="Clicks / visitor"
                value="1.43"
                footer="repeat behavior"
              />
            </div>

            {/* The pulse, full width */}
            <div
              className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5"
              style={
                {
                  "--chart-accent": "var(--chart-brand)",
                } as React.CSSProperties
              }
            >
              <SectionHeader
                className="h-10 shrink-0 px-2.5"
                icon={ChartSpline}
                title="Clicks over time"
                action={<HeaderControls />}
              />
              <div className="mt-0 flex-1 rounded-[14px] bg-background p-3">
                <div className="h-[260px]">
                  <ClicksChart
                    series={clickSeries}
                    height={260}
                    metric="both"
                  />
                </div>
              </div>
            </div>

            {/* Geography */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel icon={MapPin} title="Countries" flush>
                <div className="h-[280px]">
                  <CountryMap rows={countryRows} metric="total" />
                </div>
              </Panel>
              <Panel icon={Building2} title="Cities" table>
                <BreakdownList dimension="city" rows={cityRows} limit={6} />
              </Panel>
            </div>

            {/* Links + referrers */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel icon={Link2} title="Links" table>
                <BreakdownTable
                  dimension="short_code"
                  title="Link"
                  rows={linkRows}
                  metric="total"
                  fullCols={false}
                />
              </Panel>
              <Panel icon={Globe2} title="Referrers" table>
                <BreakdownList
                  dimension="referrer"
                  rows={referrerRows}
                  limit={6}
                />
              </Panel>
            </div>

            {/* Client environment */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel icon={Compass} title="Browsers" table>
                <BreakdownList
                  dimension="browser"
                  rows={browserRows}
                  limit={6}
                />
              </Panel>
              <Panel icon={MonitorSmartphone} title="Operating systems" table>
                <BreakdownList dimension="os" rows={osRows} limit={5} />
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
