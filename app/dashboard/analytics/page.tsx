"use client"

import * as React from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs"
import {
  Building2,
  ChartBar,
  ChartLine,
  Compass,
  Globe2,
  Link2,
  MapPin,
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Table2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  dimensionRowsOf,
  getStats,
  timeSeriesOf,
  type StatsDimension,
} from "@/lib/api"
import { formatCount, formatPercent, pctChange } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { FilterChip } from "@/components/dashboard/filter-chip"
import { KpiCard } from "@/components/dashboard/kpi"
import { ClicksChart } from "@/components/dashboard/clicks-chart"
import { Segmented } from "@/components/dashboard/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
import {
  DimensionCard,
  type CardView,
} from "@/components/dashboard/analytics/dimension-card"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import {
  humanize,
  PRESETS,
  type TimeRange,
} from "@/components/dashboard/analytics/time-range"
import { useAutoRefreshPref, useSlidingNow } from "@/hooks/use-auto-refresh"
import { RefreshControl } from "@/components/dashboard/refresh-control"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"

const FILTER_DIMS = [
  { key: "link", dim: "short_code", label: "Links", icon: Link2 },
  { key: "referrer", dim: "referrer", label: "Referrer", icon: Globe2 },
  { key: "country", dim: "country", label: "Country", icon: MapPin },
  { key: "browser", dim: "browser", label: "Browser", icon: Compass },
  { key: "os", dim: "os", label: "OS", icon: MonitorSmartphone },
  { key: "city", dim: "city", label: "City", icon: Building2 },
] as const

const arrayParser = parseAsArrayOf(parseAsString).withDefault([])

// Row pairs are thematic: what's clicked and who sends it, where in the
// world (map + precise city numbers side by side), then device/software.
const DIM_CARDS = [
  {
    dimension: "short_code",
    title: "Top links",
    icon: Link2,
    filterKey: "link",
  },
  {
    dimension: "referrer",
    title: "Referrers",
    icon: Globe2,
    filterKey: "referrer",
  },
  {
    dimension: "country",
    title: "Countries",
    icon: MapPin,
    filterKey: "country",
  },
  { dimension: "city", title: "Cities", icon: Building2, filterKey: "city" },
  {
    dimension: "browser",
    title: "Browsers",
    icon: Compass,
    filterKey: "browser",
  },
  {
    dimension: "os",
    title: "Operating systems",
    icon: MonitorSmartphone,
    filterKey: "os",
  },
] as const

export default function AnalyticsPage() {
  const [rangeToken, setRangeToken] = useQueryState(
    "range",
    parseAsString.withDefault("30d")
  )
  const [from, setFrom] = useQueryState("from", parseAsIsoDateTime)
  const [to, setTo] = useQueryState("to", parseAsIsoDateTime)
  const [mode, setMode] = useQueryState(
    "metric",
    parseAsStringLiteral(["total", "unique", "both"] as const).withDefault(
      "total"
    )
  )

  const [expandDim, setExpandDim] = useQueryState("expand", parseAsString)
  const [links, setLinks] = useQueryState("link", arrayParser)
  const [referrers, setReferrers] = useQueryState("referrer", arrayParser)
  const [countries, setCountries] = useQueryState("country", arrayParser)
  const [browsers, setBrowsers] = useQueryState("browser", arrayParser)
  const [oses, setOses] = useQueryState("os", arrayParser)
  const [cities, setCities] = useQueryState("city", arrayParser)

  const setters = {
    link: setLinks,
    referrer: setReferrers,
    country: setCountries,
    browser: setBrowsers,
    os: setOses,
    city: setCities,
  } as const
  const values = {
    link: links,
    referrer: referrers,
    country: countries,
    browser: browsers,
    os: oses,
    city: cities,
  } as const

  const fromMs = from?.getTime()
  const toMs = to?.getTime()
  // Preset windows anchor to a minute-truncated "now": stable within a
  // render (keys don't thrash) but sliding forward while auto-refresh is
  // on, so refreshes pick up clicks that landed after page load.
  const [refreshEvery, setRefreshEvery] = useAutoRefreshPref()
  const [nowDate, bumpNow] = useSlidingNow(refreshEvery !== false)
  const nowMs = nowDate.getTime()
  const range: TimeRange = React.useMemo(() => {
    if (rangeToken === "custom" && fromMs && toMs)
      return { from: new Date(fromMs), to: new Date(toMs) }
    const p =
      PRESETS.find((x) => x.token === rangeToken) ??
      PRESETS.find((x) => x.token === "30d")!
    return {
      from: new Date(nowMs - p.ms),
      to: new Date(nowMs),
      preset: p.token,
    }
  }, [rangeToken, fromMs, toMs, nowMs])

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
    ...(cities.length ? { city: cities } : {}),
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
    // Auto-refresh: silent poll at the user's cadence (paused while the
    // tab is hidden) plus the sliding preset key above. Previous data
    // holds until the new window lands so a refresh never blanks the page.
    refetchInterval: refreshEvery,
    placeholderData: keepPreviousData,
  })

  // Trend baseline: the equal-length window immediately before the current
  // range, under the same filters, so deltas compare like with like.
  const prevStats = useQuery({
    queryKey: [
      "stats",
      "hub-prev",
      range.from.getTime(),
      range.to.getTime(),
      links,
      filters,
    ],
    queryFn: () => {
      const span = range.to.getTime() - range.from.getTime()
      return getStats({
        startDate: new Date(range.from.getTime() - span),
        endDate: range.from,
        groupBy: ["time"],
        shortCodes: links.length ? links : undefined,
        filters,
      })
    },
    placeholderData: keepPreviousData,
  })

  const queryClient = useQueryClient()
  const refreshNow = () => {
    // Slide the window to the current minute first so a manual refresh
    // fetches fresh data, not the page-load snapshot.
    bumpNow()
    queryClient.invalidateQueries({ queryKey: ["stats"] })
  }

  const s = stats.data
  const prev = prevStats.data
  const clicksDelta =
    s && prev
      ? pctChange(s.summary.total_clicks, prev.summary.total_clicks)
      : null
  const uniqueDelta =
    s && prev
      ? pctChange(s.summary.unique_clicks, prev.summary.unique_clicks)
      : null
  const deltaLabel = range.preset
    ? `vs previous ${range.preset}`
    : "vs previous period"
  const activeChips = FILTER_DIMS.flatMap(({ key, dim }) =>
    values[key].map((v) => ({ key, dim, value: v }))
  )

  React.useEffect(() => {
    if (expandDim !== "time") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setExpandDim(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expandDim, setExpandDim])

  // Per-dimension metric/view prefs live here so they survive the
  // expand/collapse remounts of the card components.
  const [cardPrefs, setCardPrefs] = React.useState<
    Record<string, { metric: BreakdownMetric; view: CardView }>
  >({})
  const prefsOf = (dim: string) =>
    cardPrefs[dim] ?? {
      metric: "total" as BreakdownMetric,
      // Countries lead with the map: the one deliberately loud card in the
      // grid; ranked numbers stay one click (or one card) away.
      view: dim === "country" ? ("map" as const) : ("chart" as const),
    }
  const patchPrefs = (
    dim: string,
    patch: Partial<{ metric: BreakdownMetric; view: CardView }>
  ) =>
    setCardPrefs((prev) => ({ ...prev, [dim]: { ...prefsOf(dim), ...patch } }))

  const timeView = prefsOf("time").view
  const timeRows = React.useMemo(() => {
    const rows = s ? timeSeriesOf(s) : []
    return [...rows].reverse()
  }, [s])
  const timeRowFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        ...(s?.time_bucket_info.strategy === "hourly"
          ? { hour: "numeric" as const }
          : {}),
      }),
    [s?.time_bucket_info.strategy]
  )

  // Focus mode starts at the top; exiting returns to the saved scroll depth.
  const scrollDepth = React.useRef(0)
  const prevExpand = React.useRef<string | null>(expandDim)
  const handleExpand = (dim: string | null) => {
    if (dim && !expandDim) {
      scrollDepth.current =
        document.querySelector("[data-dashboard-scroller]")?.scrollTop ?? 0
    }
    setExpandDim(dim)
  }
  React.useLayoutEffect(() => {
    const el = document.querySelector("[data-dashboard-scroller]")
    const prev = prevExpand.current
    prevExpand.current = expandDim
    if (!el || prev === expandDim) return
    if (expandDim && !prev) el.scrollTop = 0
    else if (!expandDim && prev) el.scrollTop = scrollDepth.current
  }, [expandDim])

  // Chart rows toggle: clicking an unfiltered value narrows to it, clicking
  // a value that's already the active filter releases it.
  const toggleFilter = (key: keyof typeof setters) => (value: string) => {
    const cur = values[key]
    const next = cur.includes(value)
      ? cur.filter((v) => v !== value)
      : [...cur, value]
    setters[key](next.length ? next : null)
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
        <RefreshControl
          className="ml-auto"
          intervalMs={refreshEvery}
          onIntervalChange={setRefreshEvery}
          onRefresh={refreshNow}
          refreshing={stats.isFetching}
        />
      </div>

      {/* Applied filter chips */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {activeChips.map(({ key, dim, value }) => (
            <FilterChip
              key={`${key}:${value}`}
              label={FILTER_DIMS.find((f) => f.key === key)?.label ?? key}
              icon={
                <DimensionIcon
                  dimension={dim}
                  value={value}
                  className="size-3.5"
                />
              }
              value={
                dim === "short_code" ? `/${value}` : dimensionLabel(dim, value)
              }
              onClear={() =>
                setters[key](
                  values[key].filter((v) => v !== value).length
                    ? values[key].filter((v) => v !== value)
                    : null
                )
              }
            />
          ))}
          {activeChips.length >= 2 && (
            <button
              type="button"
              onClick={() => Object.values(setters).forEach((set) => set(null))}
              className="text-xs text-muted-foreground underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Focus mode (?expand=): everything stays MOUNTED — non-focused
          content hides via CSS so no chart replays its entrance animation
          on collapse; the focused card is the same instance re-styled. */}
      {/* KPI strip */}
      <div
        className={cn(
          "mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4",
          expandDim && "hidden"
        )}
      >
        <KpiCard
          label="Total clicks"
          value={s ? formatCount(s.summary.total_clicks) : "–"}
          delta={clicksDelta}
          deltaLabel={deltaLabel}
          footer={humanize(range).toLowerCase()}
        />
        <KpiCard
          label="Unique visitors"
          value={s ? formatCount(s.summary.unique_clicks) : "–"}
          delta={uniqueDelta}
          deltaLabel={deltaLabel}
          footer={humanize(range).toLowerCase()}
        />
        <KpiCard
          label="Unique rate"
          value={formatPercent(s?.computed_metrics?.unique_click_rate)}
          footer="unique / total"
        />
        <KpiCard
          label="Clicks per visitor"
          value={
            s?.computed_metrics
              ? String(s.computed_metrics.average_clicks_per_visitor)
              : "–"
          }
          footer="repeat behavior"
        />
      </div>

      {/* Main chart: same card grammar as dimensions — metric + view
          switchers, in-place expand (?expand=time). */}
      <div
        className={cn(
          "mt-8 rounded-2xl border border-border/60 bg-shell p-0.5",
          expandDim && expandDim !== "time" && "hidden",
          expandDim === "time" && "mt-6"
        )}
      >
        <SectionHeader
          className="h-9 px-2.5"
          icon={ChartLine}
          title="Clicks over time"
          action={
            <span className="flex items-center gap-1.5">
              <Segmented
                value={mode}
                onChange={(m) => setMode(m === "total" ? null : m)}
                options={[
                  { value: "total", label: "total" },
                  { value: "unique", label: "unique" },
                  { value: "both", label: "both" },
                ]}
              />
              <Segmented
                value={timeView}
                onChange={(v) => patchPrefs("time", { view: v })}
                options={[
                  { value: "chart", icon: ChartBar, ariaLabel: "chart view" },
                  { value: "table", icon: Table2, ariaLabel: "table view" },
                ]}
              />
              <button
                type="button"
                aria-label={
                  expandDim === "time"
                    ? "Collapse Clicks over time"
                    : "Expand Clicks over time"
                }
                onClick={() =>
                  handleExpand(expandDim === "time" ? null : "time")
                }
                className={cn(
                  "flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground",
                  expandDim === "time" && "text-foreground"
                )}
              >
                {expandDim === "time" ? (
                  <Minimize2 className="size-3.5" strokeWidth={1.75} />
                ) : (
                  <Maximize2 className="size-3.5" strokeWidth={1.75} />
                )}
              </button>
            </span>
          }
        />
        <Panel
          className={cn(
            "relative mt-0 overflow-hidden rounded-[14px] bg-background",
            expandDim === "time"
              ? "h-[calc(100dvh-15rem)] min-h-[420px]"
              : "h-[300px]"
          )}
        >
          {stats.isPending ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <>
              {/* Both views stay mounted (crossfade, not swap): unmounting
                  the chart would replay its draw animation on every return
                  from table view. */}
              <div
                className={cn(
                  "absolute inset-0 p-4 transition-opacity duration-150 ease-out",
                  timeView !== "chart" && "pointer-events-none opacity-0"
                )}
              >
                <ClicksChart
                  series={s ? timeSeriesOf(s) : []}
                  hourly={s?.time_bucket_info.strategy === "hourly"}
                  height="100%"
                  metric={mode}
                  expanded={expandDim === "time"}
                  onRangeSelect={(rFrom, rTo) =>
                    applyRange({ from: rFrom, to: rTo })
                  }
                />
              </div>
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-150 ease-out",
                  timeView !== "table" && "pointer-events-none opacity-0"
                )}
              >
                <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr className="border-b border-border/60 text-left text-muted-foreground">
                        <th className="h-8 w-full px-3 label-mono text-[10px] font-medium">
                          When
                        </th>
                        <th
                          className={cn(
                            "h-8 px-3 text-right label-mono text-[10px] font-medium",
                            mode !== "unique" && "text-foreground"
                          )}
                        >
                          Clicks
                        </th>
                        <th
                          className={cn(
                            "h-8 px-3 text-right label-mono text-[10px] font-medium",
                            mode === "unique" && "text-foreground"
                          )}
                        >
                          Unique
                        </th>
                        <th className="h-8 px-3 text-right label-mono text-[10px] font-medium">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {timeRows.map((b) => (
                        <tr key={b.bucket}>
                          <td className="px-3 py-2 font-mono text-xs text-foreground tabular-nums">
                            {timeRowFmt.format(new Date(b.bucket))}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              mode === "unique"
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {formatCount(b.clicks)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              mode === "unique"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatCount(b.unique_clicks)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground tabular-nums">
                            {b.clicks
                              ? Math.round((b.unique_clicks / b.clicks) * 100) +
                                "%"
                              : "0%"}
                          </td>
                        </tr>
                      ))}
                      {!timeRows.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-8 text-center text-xs text-muted-foreground/70"
                          >
                            no data in this range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Dimension cards, all chart↔table, all click-to-filter */}
      <div
        className={cn(
          "grid grid-cols-1 gap-x-6 gap-y-8 pb-8 lg:grid-cols-2",
          expandDim === "time" && "hidden",
          expandDim && expandDim !== "time" ? "mt-6" : "mt-8"
        )}
      >
        {DIM_CARDS.map((c) => {
          const isExpanded = expandDim === c.dimension
          return (
            <div
              key={c.dimension}
              className={cn(
                expandDim && !isExpanded && "hidden",
                isExpanded && "lg:col-span-2"
              )}
            >
              <DimensionCard
                dimension={c.dimension}
                title={c.title}
                icon={c.icon}
                rows={s ? dimensionRowsOf(s, c.dimension) : []}
                loading={stats.isPending}
                onSelect={c.filterKey ? toggleFilter(c.filterKey) : undefined}
                expanded={isExpanded}
                onExpandedChange={(v) => handleExpand(v ? c.dimension : null)}
                metric={prefsOf(c.dimension).metric}
                view={prefsOf(c.dimension).view}
                onMetricChange={(m) => patchPrefs(c.dimension, { metric: m })}
                onViewChange={(v) => patchPrefs(c.dimension, { view: v })}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
