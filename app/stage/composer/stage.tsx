"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import {
  COMPOSER_DEFAULTS,
  ComposerForm,
  type ComposerState,
} from "@/components/dashboard/analytics/widget-composer"
import { ACCENT_VARS } from "@/components/dashboard/analytics/widget-meta"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"
import {
  countryRows,
  referrerRows,
} from "@/components/sections/dashboard-hero-fixtures"
import { clickSeries } from "@/components/sections/dashboard-hero-fixtures"
import { osRows } from "@/components/product/board-fixtures"

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
const DonutChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/donut-chart").then(
      (m) => m.DonutChart
    ),
  { ssr: false, loading: () => null }
)

const DAY = 86_400_000
const anchor = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()
const RANGE: TimeRange = {
  from: new Date(anchor - 30 * DAY),
  to: new Date(anchor),
  preset: "30d",
}

/* Fixture stand-in for the dialog's live WidgetCell — same components
   the board renders, no fetching. */
function PreviewChart({ state }: { state: ComposerState }) {
  if (state.x === "country" && state.bdViz === "map")
    return <CountryMap rows={countryRows} metric="total" />
  if (state.x === "country")
    return <BreakdownList dimension="country" rows={countryRows} limit={6} />
  if (state.x === "referrer" && state.bdViz === "donut")
    return (
      <div className="h-full p-3">
        <DonutChart
          dimension="referrer"
          rows={referrerRows}
          metric="total"
          segments={5}
          legend
        />
      </div>
    )
  if (state.x === "referrer")
    return <BreakdownList dimension="referrer" rows={referrerRows} limit={6} />
  if (state.x === "os")
    return <BreakdownList dimension="os" rows={osRows} limit={5} />
  return (
    <div className="h-full p-3">
      <ClicksChart series={clickSeries} height="100%" metric="total" />
    </div>
  )
}

export function ComposerStage() {
  const [state, setState] = React.useState<ComposerState>(COMPOSER_DEFAULTS)
  const onChange = React.useCallback(
    (patch: Partial<ComposerState>) => setState((s) => ({ ...s, ...patch })),
    []
  )

  return (
    /* The stage: band background, panel parked high so downward menus
       stay inside the frame. */
    <div
      data-stage
      className="flex min-h-screen items-start justify-center bg-background pt-12"
    >
      <div className="w-[1024px] rounded-xl border border-border/60 bg-background p-6 shadow-2xl shadow-black/40">
        <div className="mb-4">
          <h2 className="font-semibold text-foreground text-lg">
            Custom chart
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            The preview is live: exactly what lands on the board.
          </p>
        </div>
        <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_340px]">
          <div className="pattern-dots flex items-center justify-center rounded-xl p-6">
            <div
              className="pointer-events-none w-full select-none"
              style={
                {
                  height: 400,
                  maxWidth: 620,
                  "--chart-accent": ACCENT_VARS[state.accent],
                } as React.CSSProperties
              }
            >
              <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-shell p-0.5">
                <div className="mt-0 min-h-0 flex-1 overflow-hidden rounded-[14px] bg-background">
                  <PreviewChart state={state} />
                </div>
              </div>
            </div>
          </div>
          <TooltipProvider delayDuration={0}>
            <ComposerForm state={state} onChange={onChange} range={RANGE} />
          </TooltipProvider>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Add widget</Button>
        </div>
      </div>
    </div>
  )
}
