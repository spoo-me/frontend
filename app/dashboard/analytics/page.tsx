"use client"

import * as React from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  useQueryState,
} from "nuqs"
import {
  Building2,
  Compass,
  Globe2,
  LayoutGrid,
  Link2,
  MapPin,
  MonitorSmartphone,
  Plus,
} from "lucide-react"
import { dimensionRowsOf, getStats, type StatsDimension } from "@/lib/api"
import { heightPx, type Widget } from "@/lib/analytics-layout"
import { FilterChip } from "@/components/dashboard/filter-chip"
import { Button } from "@/components/ui/button"
import { Kbd, useModKey } from "@/components/dashboard/kbd"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
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
import { WidgetGrid } from "@/components/dashboard/analytics/widget-grid"
import { WidgetRemoveButton } from "@/components/dashboard/analytics/widget-shell"
import {
  DIMENSION_META,
  STAT_META,
} from "@/components/dashboard/analytics/widget-meta"
import { StatWidget } from "@/components/dashboard/analytics/widgets/stat-widget"
import { TimeseriesWidget } from "@/components/dashboard/analytics/widgets/timeseries-widget"
import { BreakdownWidget } from "@/components/dashboard/analytics/widgets/breakdown-widget"

const FILTER_DIMS = [
  { key: "link", dim: "short_code", label: "Links", icon: Link2 },
  { key: "referrer", dim: "referrer", label: "Referrer", icon: Globe2 },
  { key: "country", dim: "country", label: "Country", icon: MapPin },
  { key: "browser", dim: "browser", label: "Browser", icon: Compass },
  { key: "os", dim: "os", label: "OS", icon: MonitorSmartphone },
  { key: "city", dim: "city", label: "City", icon: Building2 },
] as const

const arrayParser = parseAsArrayOf(parseAsString).withDefault([])

export default function AnalyticsPage() {
  const [rangeToken, setRangeToken] = useQueryState(
    "range",
    parseAsString.withDefault("30d")
  )
  const [from, setFrom] = useQueryState("from", parseAsIsoDateTime)
  const [to, setTo] = useQueryState("to", parseAsIsoDateTime)

  const [expandId, setExpandId] = useQueryState("expand", parseAsString)
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
  const deltaLabel = range.preset
    ? `vs previous ${range.preset}`
    : "vs previous period"
  const rangeLabel = humanize(range).toLowerCase()
  const activeChips = FILTER_DIMS.flatMap(({ key, dim }) =>
    values[key].map((v) => ({ key, dim, value: v }))
  )

  /* ---------- layout store + editing ---------- */
  const lay = useAnalyticsLayout()
  const widgets = lay.layout.widgets
  const modKey = useModKey()
  const isLgUp = useIsLgUp()

  const [editing, setEditing] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // Derived, not synced: a deleted/discarded widget can't stay selected.
  const selected = widgets.some((w) => w.id === selectedId) ? selectedId : null

  const startEditing = () => {
    setExpandId(null) // focus mode and edit mode are mutually exclusive
    setEditing(true)
  }
  const stopEditing = () => {
    setEditing(false)
    setSelectedId(null)
  }

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

  // Focus mode starts at the top; exiting returns to the saved scroll depth.
  const scrollDepth = React.useRef(0)
  const prevExpand = React.useRef<string | null>(expandId)
  const handleExpand = (id: string | null) => {
    if (id && !expandId) {
      scrollDepth.current =
        document.querySelector("[data-dashboard-scroller]")?.scrollTop ?? 0
    }
    setExpandId(id)
  }
  React.useLayoutEffect(() => {
    const el = document.querySelector("[data-dashboard-scroller]")
    const prevVal = prevExpand.current
    prevExpand.current = expandId
    if (!el || prevVal === expandId) return
    if (expandId && !prevVal) el.scrollTop = 0
    else if (!expandId && prevVal) el.scrollTop = scrollDepth.current
  }, [expandId])

  // Chart rows toggle: clicking an unfiltered value narrows to it, clicking
  // a value that's already the active filter releases it.
  const toggleFilter = (key: keyof typeof setters) => (value: string) => {
    const cur = values[key]
    const next = cur.includes(value)
      ? cur.filter((v) => v !== value)
      : [...cur, value]
    setters[key](next.length ? next : null)
  }

  /* ---------- widget rendering ---------- */
  const renderWidget = (w: Widget) => {
    switch (w.kind) {
      case "stat":
        return (
          <div className="relative h-full">
            <StatWidget
              config={w.config}
              h={w.grid.h}
              stats={s}
              prevStats={prev}
              rangeLabel={rangeLabel}
              deltaLabel={deltaLabel}
            />
            {editing && (
              <WidgetRemoveButton
                title={STAT_META[w.config.metric].label}
                onRemove={() => lay.removeWidget(w.id)}
              />
            )}
          </div>
        )
      case "timeseries":
        return (
          <TimeseriesWidget
            config={w.config}
            loading={stats.isPending}
            stats={s}
            editing={editing}
            expanded={expandId === w.id}
            onExpandedChange={(v) => handleExpand(v ? w.id : null)}
            onConfigChange={(p) =>
              lay.updateWidgetConfig(w.id, p, { stage: editing })
            }
            onRangeSelect={(rFrom, rTo) => applyRange({ from: rFrom, to: rTo })}
            onRemove={() => lay.removeWidget(w.id)}
          />
        )
      case "breakdown": {
        const meta = DIMENSION_META[w.config.dimension]
        return (
          <BreakdownWidget
            config={w.config}
            w={w.grid.w}
            h={w.grid.h}
            rows={s ? dimensionRowsOf(s, w.config.dimension) : []}
            loading={stats.isPending}
            editing={editing}
            expanded={expandId === w.id}
            onExpandedChange={(v) => handleExpand(v ? w.id : null)}
            onConfigChange={(p) =>
              lay.updateWidgetConfig(w.id, p, { stage: editing })
            }
            onSelect={toggleFilter(meta.filterKey)}
            onRemove={() => lay.removeWidget(w.id)}
          />
        )
      }
    }
  }

  const mobileWidgets = expandId
    ? widgets.filter((w) => w.id === expandId)
    : widgets

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toolbar: time range + dimension filters + layout editing */}
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
          {isLgUp &&
            (editing ? (
              <Button size="sm" onClick={stopEditing}>
                Done
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <LayoutGrid data-icon="inline-start" />
                Edit layout
              </Button>
            ))}
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
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* The dashboard itself */}
      {widgets.length === 0 ? (
        <div className="border-border/60 bg-card mt-5 rounded-2xl border">
          <div className="pattern-dots m-4 flex h-56 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
              this dashboard is empty
            </span>
            {isLgUp && (
              <Button size="sm" onClick={startEditing}>
                <Plus data-icon="inline-start" />
                Add widgets
              </Button>
            )}
          </div>
        </div>
      ) : isLgUp ? (
        <div className="mt-5 pb-8">
          <WidgetGrid
            widgets={widgets}
            editing={editing}
            selectedId={editing ? selected : null}
            expandId={expandId}
            onSelect={setSelectedId}
            onGridChange={lay.applyGridChange}
            renderWidget={renderWidget}
          />
        </div>
      ) : (
        /* Mobile: read-only single-column stack in reading order. */
        <div className="mt-5 flex flex-col gap-6 pb-8">
          {mobileWidgets.map((w) => (
            <div
              key={w.id}
              style={
                w.kind === "stat" || expandId === w.id
                  ? undefined
                  : { height: heightPx(w.grid.h) }
              }
            >
              {renderWidget(w)}
            </div>
          ))}
        </div>
      )}

      {/* Layout save bar: exists only while edits are staged — same
          transient-pill grammar as the links bulk bar. */}
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
