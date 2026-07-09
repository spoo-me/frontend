"use client"

import * as React from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
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
  Gauge,
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
import { Button } from "@/components/ui/button"
import { Kbd, useModKey } from "@/components/dashboard/kbd"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
import { DimensionCard } from "@/components/dashboard/analytics/dimension-card"
import {
  humanize,
  PRESETS,
  type TimeRange,
} from "@/components/dashboard/analytics/time-range"
import { useAutoRefreshPref, useSlidingNow } from "@/hooks/use-auto-refresh"
import { useAnalyticsLayout } from "@/hooks/use-analytics-layout"
import { useIsLgUp } from "@/hooks/use-breakpoint"
import { RefreshControl } from "@/components/dashboard/refresh-control"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import {
  CardGrip,
  CardMenu,
  LayoutToolbarMenu,
} from "@/components/dashboard/analytics/layout-controls"
import { SortableBlock } from "@/components/dashboard/analytics/sortable-block"
import type { BlockId, BreakdownId } from "@/lib/analytics-layout"

const FILTER_DIMS = [
  { key: "link", dim: "short_code", label: "Links", icon: Link2 },
  { key: "referrer", dim: "referrer", label: "Referrer", icon: Globe2 },
  { key: "country", dim: "country", label: "Country", icon: MapPin },
  { key: "browser", dim: "browser", label: "Browser", icon: Compass },
  { key: "os", dim: "os", label: "OS", icon: MonitorSmartphone },
  { key: "city", dim: "city", label: "City", icon: Building2 },
] as const

const arrayParser = parseAsArrayOf(parseAsString).withDefault([])

// Presentational metadata per block. Block ORDER (and span/visibility) comes
// from the user's layout doc; the default order lives in lib/analytics-layout.
const BLOCK_TITLES: Record<BlockId, string> = {
  kpis: "Summary",
  time: "Clicks over time",
  short_code: "Top links",
  referrer: "Referrers",
  country: "Countries",
  city: "Cities",
  browser: "Browsers",
  os: "Operating systems",
}
const CARD_META: Record<
  BreakdownId,
  {
    icon: React.ElementType
    filterKey: "link" | "referrer" | "country" | "browser" | "os" | "city"
  }
> = {
  short_code: { icon: Link2, filterKey: "link" },
  referrer: { icon: Globe2, filterKey: "referrer" },
  country: { icon: MapPin, filterKey: "country" },
  city: { icon: Building2, filterKey: "city" },
  browser: { icon: Compass, filterKey: "browser" },
  os: { icon: MonitorSmartphone, filterKey: "os" },
}

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

  // Card order, spans, visibility and per-card view/metric prefs all live in
  // the layout doc: localStorage mirror for instant paint, server doc as the
  // cross-browser truth, structural edits staged in a draft until saved.
  const lay = useAnalyticsLayout()
  const heroView = lay.layout.hero.view
  const modKey = useModKey()

  // Editing is desktop-only and pauses in focus mode; the layout itself
  // (order, spans, hidden) still applies everywhere.
  const isLgUp = useIsLgUp()
  const canEdit = isLgUp && !expandDim
  const [activeDrag, setActiveDrag] = React.useState<string | null>(null)
  const sensors = useSensors(
    // Distance threshold keeps twitchy grip clicks from starting drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const visibleIds = lay.layout.blocks
    .filter((b) => !b.hidden)
    .map((b) => b.id)

  // mod+S commits the layout draft while the save bar is up. Esc deliberately
  // does NOT discard: a curated draft is expensive, a lingering pill is not.
  const { dirty: layoutDirty, saving: layoutSaving, save: saveLayout } = lay
  React.useEffect(() => {
    if (!layoutDirty) return
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.key !== "s" && e.key !== "S")) return
      e.preventDefault()
      const dialogOpen = document.querySelector(
        "[role=dialog][data-state=open], [role=alertdialog][data-state=open]"
      )
      if (typing(e.target) || dialogOpen || layoutSaving) return
      saveLayout()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [layoutDirty, layoutSaving, saveLayout])
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
        <span className="ml-auto flex items-center gap-1.5">
          {canEdit && (
            <LayoutToolbarMenu
              cards={lay.layout.blocks.map((b) => ({
                id: b.id,
                title: BLOCK_TITLES[b.id],
                hidden: b.hidden === true,
              }))}
              onToggle={(id, visible) => lay.setHidden(id, !visible)}
              onResetAll={lay.resetAll}
            />
          )}
          <RefreshControl
            intervalMs={refreshEvery}
            onIntervalChange={setRefreshEvery}
            onRefresh={refreshNow}
            refreshing={stats.isFetching}
          />
        </span>
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
      {/* Dimension cards: order/span/visibility from the layout doc, dragged
          by the header grip only — card bodies keep click-to-filter. */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveDrag(String(active.id))}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id)
            lay.moveBlock(String(active.id), String(over.id))
          // One-frame gap: the order-commit render happens while motion
          // layout is still off, so FLIP never fights dnd-kit's settle.
          requestAnimationFrame(() => setActiveDrag(null))
        }}
        onDragCancel={() => requestAnimationFrame(() => setActiveDrag(null))}
      >
        <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
          <div
            className={cn(
              "mt-5 grid grid-cols-1 gap-x-6 gap-y-8 pb-8 lg:grid-cols-2",
              // Blueprint reveal: the lattice shows itself while you hold a card.
              activeDrag && "pattern-dots select-none"
            )}
          >
            {lay.layout.blocks
              .filter((b) => !b.hidden || b.id === expandDim)
              .map((b) => {
                const isExpanded = expandDim === b.id
                if (b.type === "kpis")
                  return (
                    <SortableBlock
                      key={b.id}
                      id={b.id}
                      span={b.span}
                      expanded={false}
                      hiddenCell={!!expandDim}
                      disabled={!canEdit}
                      dragActive={!!activeDrag}
                    >
                      {({ attributes, listeners }) => (
                        <div>
                          <SectionHeader
                            className="h-9"
                            icon={Gauge}
                            lead={
                              canEdit ? (
                                <CardGrip
                                  icon={Gauge}
                                  attributes={attributes}
                                  listeners={listeners}
                                />
                              ) : undefined
                            }
                            title="Summary"
                            action={
                              canEdit ? (
                                <CardMenu
                                  title="Summary"
                                  onHide={() => lay.setHidden("kpis", true)}
                                  onReset={() => lay.resetBlock("kpis")}
                                />
                              ) : undefined
                            }
                          />
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                        </div>
                      )}
                    </SortableBlock>
                  )
                if (b.type === "timeseries")
                  return (
                    <SortableBlock
                      key={b.id}
                      id={b.id}
                      span={b.span}
                      expanded={isExpanded}
                      hiddenCell={!!expandDim && !isExpanded}
                      disabled={!canEdit}
                      dragActive={!!activeDrag}
                    >
                      {({ attributes, listeners }) => (
                        <div className="rounded-2xl border border-border/60 bg-shell p-0.5">
                    <SectionHeader
                      className="h-9 px-2.5"
                      icon={ChartLine}
                      lead={
                        canEdit ? (
                          <CardGrip
                            icon={ChartLine}
                            attributes={attributes}
                            listeners={listeners}
                          />
                        ) : undefined
                      }
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
                            value={heroView}
                            onChange={lay.setHeroView}
                            options={[
                              { value: "chart", icon: ChartLine, ariaLabel: "line chart view" },
                              { value: "bars", icon: ChartBar, ariaLabel: "bar chart view" },
                              { value: "table", icon: Table2, ariaLabel: "table view" },
                            ]}
                          />
                          {canEdit && (
                            <CardMenu
                              title="Clicks over time"
                              onHide={() => lay.setHidden("time", true)}
                              onReset={() => lay.resetBlock("time")}
                            />
                          )}
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
                              heroView !== "chart" && "pointer-events-none opacity-0"
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
                              "absolute inset-0 p-4 transition-opacity duration-150 ease-out",
                              heroView !== "bars" && "pointer-events-none opacity-0"
                            )}
                          >
                            <ClicksChart
                              series={s ? timeSeriesOf(s) : []}
                              hourly={s?.time_bucket_info.strategy === "hourly"}
                              height="100%"
                              metric={mode}
                              variant="bars"
                              expanded={expandDim === "time"}
                              onRangeSelect={(rFrom, rTo) =>
                                applyRange({ from: rFrom, to: rTo })
                              }
                            />
                          </div>
                          <div
                            className={cn(
                              "absolute inset-0 transition-opacity duration-150 ease-out",
                              heroView !== "table" && "pointer-events-none opacity-0"
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
                      )}
                    </SortableBlock>
                  )
                const meta = CARD_META[b.id as BreakdownId]
                return (
                  <SortableBlock
                    key={b.id}
                    id={b.id}
                    span={b.span}
                    expanded={isExpanded}
                    hiddenCell={!!expandDim && !isExpanded}
                    disabled={!canEdit}
                    dragActive={!!activeDrag}
                  >
                    {({ attributes, listeners }) => (
                      <DimensionCard
                        dimension={b.id as BreakdownId}
                        title={BLOCK_TITLES[b.id]}
                        icon={meta.icon}
                        rows={s ? dimensionRowsOf(s, b.id as BreakdownId) : []}
                        loading={stats.isPending}
                        onSelect={toggleFilter(meta.filterKey)}
                        expanded={isExpanded}
                        onExpandedChange={(v) => handleExpand(v ? b.id : null)}
                        metric={b.config.metric}
                        view={b.config.view}
                        onMetricChange={(m) =>
                          lay.setBlockConfig(b.id, { metric: m })
                        }
                        onViewChange={(v) => lay.setBlockConfig(b.id, { view: v })}
                        animateLayout={!activeDrag}
                        dragHandle={
                          canEdit ? (
                            <CardGrip
                              icon={meta.icon}
                              attributes={attributes}
                              listeners={listeners}
                            />
                          ) : undefined
                        }
                        menu={
                          canEdit ? (
                            <CardMenu
                              title={BLOCK_TITLES[b.id]}
                              span={b.span}
                              onSpanChange={(sp) => lay.setSpan(b.id, sp)}
                              onHide={() => lay.setHidden(b.id, true)}
                              onReset={() => lay.resetBlock(b.id)}
                            />
                          ) : undefined
                        }
                      />
                    )}
                  </SortableBlock>
                )
              })}
            {visibleIds.length === 0 && !expandDim && (
              <p className="text-muted-foreground/70 col-span-full py-16 text-center text-xs">
                All cards are hidden. Restore them from the layout menu in the
                toolbar.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Layout save bar: exists only while structural edits are staged —
          same transient-pill grammar as the links bulk bar. */}
      <AnimatePresence>
        {lay.dirty && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none sticky bottom-8 z-20 mt-4 flex justify-center"
          >
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-popover/95 p-1.5 pl-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]">
              <span className="mr-1 font-mono text-xs text-foreground tabular-nums">
                Layout edited
              </span>
              <Button size="sm" disabled={lay.saving} onClick={lay.save}>
                Save layout
                <Kbd className="ml-1.5 border-primary-foreground/25 bg-transparent text-primary-foreground/80">
                  {modKey}S
                </Kbd>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={lay.saving}
                onClick={lay.discard}
              >
                Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
