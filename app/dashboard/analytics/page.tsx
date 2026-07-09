"use client"

import * as React from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { AnimatePresence } from "motion/react"
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
import { getStats, type StatsDimension } from "@/lib/api"
import type { Widget } from "@/lib/analytics-layout"
import type { WidgetStatsCtx } from "@/hooks/use-widget-stats"
import { FilterChip } from "@/components/dashboard/filter-chip"
import { Button } from "@/components/ui/button"
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
import { onAnalyticsEditMode } from "@/components/dashboard/analytics/edit-mode"
import { EditBar } from "@/components/dashboard/analytics/edit-bar"
import { MobileStack, WidgetGrid } from "@/components/dashboard/analytics/widget-grid"
import { WidgetCell } from "@/components/dashboard/analytics/widget-cell"
import { WIDGET_CATALOG } from "@/components/dashboard/analytics/widget-meta"

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
  const isLgUp = useIsLgUp()

  const [editing, setEditing] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // Derived, never synced: a deleted/undone widget can't stay selected.
  const selected = widgets.find((w) => w.id === selectedId) ?? null

  const startEditing = React.useCallback(() => {
    setExpandId(null) // focus mode and edit mode are mutually exclusive
    setEditing(true)
  }, [setExpandId])
  const stopEditing = () => {
    setEditing(false)
    setSelectedId(null)
  }

  // Command-palette entry point ("Edit dashboard layout").
  React.useEffect(() => onAnalyticsEditMode(startEditing), [startEditing])

  // Edit-mode keyboard: undo/redo, delete, nudge, resize, deselect/exit.
  const { undo, redo, removeWidget, applyGridChange: gridChange } = lay
  React.useEffect(() => {
    if (!editing) return
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const dialogOpen = document.querySelector(
        "[role=dialog][data-state=open], [role=alertdialog][data-state=open]"
      )
      if (dialogOpen) return
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        if (selectedId) setSelectedId(null)
        else stopEditing()
        return
      }
      if (!selectedId) return
      const sel = widgets.find((w) => w.id === selectedId)
      if (!sel) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeWidget(selectedId)
        return
      }
      if (!e.key.startsWith("Arrow")) return
      e.preventDefault()
      const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0
      const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0
      gridChange(
        widgets.map((w) =>
          w.id !== selectedId
            ? { i: w.id, ...w.grid }
            : e.shiftKey
              ? { i: w.id, ...w.grid, w: w.grid.w + dx, h: w.grid.h + dy }
              : { i: w.id, ...w.grid, x: w.grid.x + dx, y: w.grid.y + dy }
        )
      )
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // Click-away deselect: the whole page is the canvas, not just the grid.
  // Anything that isn't a widget, the bar, or an open overlay clears the
  // selection and returns the bar to its board state. Click (not
  // pointerdown) so the rename input's blur commits before it unmounts.
  React.useEffect(() => {
    if (!editing) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      // A detached target means the click already re-rendered its owner
      // away (e.g. the bar morphing states) — that's an inside click.
      if (!t || !t.isConnected) return
      if (
        t.closest(
          "[data-widget-id], [data-edit-bar], [data-radix-popper-content-wrapper], [role=dialog], [role=alertdialog], [data-sonner-toaster]"
        )
      )
        return
      setSelectedId(null)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [editing])

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
  // Per-widget data context: unscoped widgets read the shared queries,
  // scoped widgets fetch through their own lens (use-widget-stats).
  const widgetCtx: WidgetStatsCtx = {
    range,
    links,
    filters,
    refreshEvery,
    shared: { stats: s, prev, loading: stats.isPending },
  }
  const renderWidget = (w: Widget) => (
    <WidgetCell
      widget={w}
      ctx={widgetCtx}
      editing={editing}
      expanded={expandId === w.id}
      rangeLabel={rangeLabel}
      deltaLabel={deltaLabel}
      onExpandedChange={
        editing ? undefined : (v) => handleExpand(v ? w.id : null)
      }
      onConfigChange={(p) => lay.updateWidgetConfig(w.id, p)}
      onRemove={() => lay.removeWidget(w.id)}
      onRangeSelect={(rFrom, rTo) => applyRange({ from: rFrom, to: rTo })}
      onToggleFilter={(key, v) => toggleFilter(key)(v)}
    />
  )


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
          {isLgUp && !editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <LayoutGrid data-icon="inline-start" />
              Edit layout
            </Button>
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
            selectedId={editing ? (selected?.id ?? null) : null}
            expandId={expandId}
            onSelect={setSelectedId}
            onGridChange={lay.applyGridChange}
            renderWidget={renderWidget}
          />
        </div>
      ) : (
        <MobileStack
          widgets={widgets}
          expandId={expandId}
          renderWidget={renderWidget}
        />
      )}

      {/* The dynamic edit bar: board ops at rest, widget ops on selection. */}
      <AnimatePresence>
        {editing && isLgUp && (
          <EditBar
            key="edit-bar"
            layout={lay.layout}
            selected={selected}
            range={range}
            cellCtx={widgetCtx}
            rangeLabel={rangeLabel}
            deltaLabel={deltaLabel}
            canUndo={lay.canUndo}
            canRedo={lay.canRedo}
            onUndo={lay.undo}
            onRedo={lay.redo}
            onAdd={(entryKey) => {
              const entry = WIDGET_CATALOG.find((e) => e.key === entryKey)
              if (entry) setSelectedId(lay.addWidget(entry.kind, entry.seed))
            }}
            onAddCustom={(kind, seed) => setSelectedId(lay.addWidget(kind, seed))}
            onDuplicate={(id) => setSelectedId(lay.duplicateWidget(id))}
            onRemove={lay.removeWidget}
            onResetWidget={lay.resetWidget}
            onConfigChange={lay.updateWidgetConfig}
            onResetAll={lay.resetAll}
            onReplaceLayout={(doc) => {
              const ok =
                typeof doc === "object" &&
                doc !== null &&
                (doc as { version?: unknown }).version === 1 &&
                Array.isArray((doc as { widgets?: unknown }).widgets)
              if (ok) lay.replaceLayout(doc)
              return ok
            }}
            onDeselect={() => setSelectedId(null)}
            onDone={stopEditing}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
