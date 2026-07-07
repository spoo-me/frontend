"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs"
import {
  AppWindow,
  ChartLine,
  Compass,
  Globe2,
  Link2,
  MapPin,
  MonitorSmartphone,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  dimensionRowsOf,
  getStats,
  timeSeriesOf,
  type StatsDimension,
} from "@/lib/api"
import { formatCount, formatPercent } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { KpiCard } from "@/components/dashboard/kpi"
import { ClicksChart } from "@/components/dashboard/clicks-chart"
import { Segmented } from "@/components/dashboard/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
import { DimensionCard } from "@/components/dashboard/analytics/dimension-card"
import {
  humanize,
  presetRange,
  type TimeRange,
} from "@/components/dashboard/analytics/time-range"
import { dimensionLabel } from "@/components/dashboard/dim-icon"

const FILTER_DIMS = [
  { key: "link", dim: "short_code", label: "Links", icon: Link2 },
  { key: "referrer", dim: "referrer", label: "Referrer", icon: Globe2 },
  { key: "country", dim: "country", label: "Country", icon: MapPin },
  { key: "browser", dim: "browser", label: "Browser", icon: Compass },
  { key: "os", dim: "os", label: "OS", icon: MonitorSmartphone },
] as const

const arrayParser = parseAsArrayOf(parseAsString).withDefault([])

export default function AnalyticsPage() {
  const [rangeToken, setRangeToken] = useQueryState(
    "range",
    parseAsString.withDefault("30d"),
  )
  const [from, setFrom] = useQueryState("from", parseAsIsoDateTime)
  const [to, setTo] = useQueryState("to", parseAsIsoDateTime)
  const [mode, setMode] = useQueryState(
    "metric",
    parseAsStringLiteral(["total", "unique", "both"] as const).withDefault("total"),
  )

  const [links, setLinks] = useQueryState("link", arrayParser)
  const [referrers, setReferrers] = useQueryState("referrer", arrayParser)
  const [countries, setCountries] = useQueryState("country", arrayParser)
  const [browsers, setBrowsers] = useQueryState("browser", arrayParser)
  const [oses, setOses] = useQueryState("os", arrayParser)

  const setters = {
    link: setLinks,
    referrer: setReferrers,
    country: setCountries,
    browser: setBrowsers,
    os: setOses,
  } as const
  const values = {
    link: links,
    referrer: referrers,
    country: countries,
    browser: browsers,
    os: oses,
  } as const

  const fromMs = from?.getTime()
  const toMs = to?.getTime()
  // Stabilize "now" so preset query keys don't thrash on every render.
  const range: TimeRange = React.useMemo(() => {
    if (rangeToken === "custom" && fromMs && toMs)
      return { from: new Date(fromMs), to: new Date(toMs) }
    const r = presetRange(rangeToken) ?? presetRange("30d")!
    r.to.setSeconds(0, 0)
    r.from.setSeconds(0, 0)
    return r
  }, [rangeToken, fromMs, toMs])

  const applyRange = (r: TimeRange) => {
    if (r.preset) {
      setRangeToken(r.preset === "30d" ? null : r.preset)
      setFrom(null)
      setTo(null)
    } else {
      setRangeToken("custom")
      setFrom(r.from)
      setTo(r.to)
    }
  }

  const filters = {
    ...(referrers.length ? { referrer: referrers } : {}),
    ...(countries.length ? { country: countries } : {}),
    ...(browsers.length ? { browser: browsers } : {}),
    ...(oses.length ? { os: oses } : {}),
  }

  const stats = useQuery({
    queryKey: [
      "stats",
      "hub",
      range.from.getTime(),
      range.to.getTime(),
      links,
      filters,
    ],
    queryFn: () =>
      getStats({
        startDate: range.from,
        endDate: range.to,
        groupBy: [
          "time",
          "short_code",
          "referrer",
          "country",
          "browser",
          "os",
          "city",
        ],
        shortCodes: links.length ? links : undefined,
        filters,
      }),
  })

  const s = stats.data
  const activeChips = FILTER_DIMS.flatMap(({ key, dim }) =>
    values[key].map((v) => ({ key, dim, value: v })),
  )

  const addFilter = (key: keyof typeof setters) => (value: string) => {
    if (!values[key].includes(value)) setters[key]([...values[key], value])
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toolbar: time range + dimension filters */}
      <div className="flex flex-wrap items-center gap-2">
        <TimeRangePicker value={range} onApply={applyRange} />
        {FILTER_DIMS.map(({ key, dim, label, icon }) => (
          <DimensionFilter
            key={key}
            dimension={dim as Exclude<StatsDimension, "time">}
            label={label}
            icon={icon}
            range={range}
            selected={values[key]}
            onChange={(v) => setters[key](v.length ? v : null)}
          />
        ))}
      </div>

      {/* Applied filter chips */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {activeChips.map(({ key, dim, value }) => (
            <span
              key={`${key}:${value}`}
              className="border-border/60 bg-card text-foreground flex h-7 items-center gap-1 rounded-full border pr-1 pl-2.5 text-xs"
            >
              <span className="text-muted-foreground">
                {FILTER_DIMS.find((f) => f.key === key)?.label}:
              </span>
              {dim === "short_code" ? `/${value}` : dimensionLabel(dim, value)}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  setters[key](
                    values[key].filter((v) => v !== value).length
                      ? values[key].filter((v) => v !== value)
                      : null,
                  )
                }
                className="text-muted-foreground hover:text-foreground hover:bg-accent/60 flex size-5 items-center justify-center rounded-full transition-colors duration-150"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {activeChips.length >= 2 && (
            <button
              type="button"
              onClick={() => Object.values(setters).forEach((set) => set(null))}
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total clicks"
          value={s ? formatCount(s.summary.total_clicks) : "–"}
          footer={humanize(range).toLowerCase()}
        />
        <KpiCard
          label="Unique visitors"
          value={s ? formatCount(s.summary.unique_clicks) : "–"}
          footer={humanize(range).toLowerCase()}
        />
        <KpiCard
          label="Unique rate"
          value={formatPercent(s?.computed_metrics?.unique_click_rate)}
          footer="unique / total"
        />
        <KpiCard
          label="Clicks per visitor"
          value={s?.computed_metrics ? String(s.computed_metrics.average_clicks_per_visitor) : "–"}
          footer="repeat behavior"
        />
      </div>

      {/* Main chart with Clicks | vs unique switcher (per-card, ref 26) */}
      <div className="mt-8">
        <SectionHeader
          icon={ChartLine}
          title="Clicks over time"
          action={
            <Segmented
              value={mode}
              onChange={(m) => setMode(m === "total" ? null : m)}
              options={[
                { value: "total", label: "total" },
                { value: "unique", label: "unique" },
                { value: "both", label: "both" },
              ]}
            />
          }
        />
        <Panel className="mt-2 p-4">
          {stats.isPending ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ClicksChart
              series={s ? timeSeriesOf(s) : []}
              hourly={s?.time_bucket_info.strategy === "hourly"}
              height={260}
              metric={mode}
            />
          )}
        </Panel>
      </div>

      {/* Dimension cards, all chart↔table, all click-to-filter */}
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 pb-8 lg:grid-cols-2">
        <DimensionCard
          dimension="short_code"
          title="Top links"
          icon={Link2}
          rows={s ? dimensionRowsOf(s, "short_code") : []}
          loading={stats.isPending}
          onSelect={addFilter("link")}
        />
        <DimensionCard
          dimension="referrer"
          title="Referrers"
          icon={Globe2}
          rows={s ? dimensionRowsOf(s, "referrer") : []}
          loading={stats.isPending}
          onSelect={addFilter("referrer")}
        />
        <DimensionCard
          dimension="country"
          title="Countries"
          icon={MapPin}
          rows={s ? dimensionRowsOf(s, "country") : []}
          loading={stats.isPending}
          onSelect={addFilter("country")}
        />
        <DimensionCard
          dimension="browser"
          title="Browsers"
          icon={Compass}
          rows={s ? dimensionRowsOf(s, "browser") : []}
          loading={stats.isPending}
          onSelect={addFilter("browser")}
        />
        <DimensionCard
          dimension="os"
          title="Operating systems"
          icon={MonitorSmartphone}
          rows={s ? dimensionRowsOf(s, "os") : []}
          loading={stats.isPending}
          onSelect={addFilter("os")}
        />
        <DimensionCard
          dimension="city"
          title="Cities"
          icon={AppWindow}
          rows={s ? dimensionRowsOf(s, "city") : []}
          loading={stats.isPending}
        />
      </div>
    </div>
  )
}
