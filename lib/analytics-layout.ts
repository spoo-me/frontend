/**
 * The analytics dashboard layout document. A dashboard is a list of WIDGETS —
 * each one a data source + visualization + rectangle on a 12-column grid.
 * One canonical default lives here in code (never materialized per user);
 * user docs are sparse overrides and `normalizeLayout` is the compatibility
 * seam: anything unrecognized resets to default, values clamp to sanctioned
 * sets, and positions are pre-compacted through the same algorithm the grid
 * renders with, so the stored doc always equals what the user sees.
 *
 * Pure data module: no React, no UI imports. Grid math comes from
 * react-grid-layout/core, which is framework-free.
 */

import {
  bottom,
  correctBounds,
  verticalCompactor,
  type LayoutItem,
} from "react-grid-layout/core"

export type WidgetKind = "stat" | "timeseries" | "breakdown"

export type StatMetric =
  | "total_clicks"
  | "unique_clicks"
  | "unique_rate"
  | "clicks_per_visitor"
export type SeriesMetric = "total" | "unique" | "both"
export type TimeseriesViz = "area" | "line" | "bars" | "table"
export type BreakdownViz = "bars" | "donut" | "table" | "map"

export const BREAKDOWN_DIMENSIONS = [
  "short_code",
  "referrer",
  "country",
  "city",
  "browser",
  "os",
] as const
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number]

export type StatConfig = { metric: StatMetric }
export type TimeseriesConfig = { viz: TimeseriesViz; metric: SeriesMetric }
export type BreakdownConfig = {
  dimension: BreakdownDimension
  viz: BreakdownViz
  metric: SeriesMetric
}

export type WidgetGridRect = { x: number; y: number; w: number; h: number }
export type Widget =
  | { id: string; kind: "stat"; grid: WidgetGridRect; config: StatConfig }
  | { id: string; kind: "timeseries"; grid: WidgetGridRect; config: TimeseriesConfig }
  | { id: string; kind: "breakdown"; grid: WidgetGridRect; config: BreakdownConfig }

export type AnalyticsLayout = { version: 1; widgets: Widget[] }

export const MAX_WIDGETS = 30

/* ---------- grid geometry ---------- */

// rowHeight 44 / margin 24 keeps the horizontal geometry pixel-identical to
// the old fixed page (12 cols in max-w-6xl -> 74px columns, 6w = 564px) and
// makes the default sizes land on today's card heights.
export const GRID = {
  cols: 12,
  rowHeight: 44,
  marginX: 24,
  marginY: 24,
} as const

/** Rendered pixel height of an h-unit-tall widget: 68h - 24. */
export const heightPx = (h: number) =>
  h * GRID.rowHeight + (h - 1) * GRID.marginY

/* ---------- size -> data density ----------
   More space means more data, not stretched pixels. All are pure functions
   of grid units so density is knowable without measuring the DOM. */

// Bar rows are 36px + 4px gap; widget chrome = 4 (shell) + 36 (header) + 16 (p-2).
export const breakdownBarLimit = (h: number) =>
  Math.max(1, Math.floor((heightPx(h) - 56 + 4) / 40))
// Visible table rows before scroll: chrome = 40 (shell+header) + 32 (thead).
export const breakdownTableRows = (h: number) =>
  Math.max(1, Math.floor((heightPx(h) - 72) / 36))
export const donutSegments = (h: number) => (heightPx(h) - 56 < 260 ? 4 : 6)
export const donutLegend = (w: number) => w >= 5
export const statSparkline = (h: number) => h >= 3
export const breakdownTableFullCols = (w: number) => w >= 5

/* ---------- per-kind spec ---------- */

export const WIDGET_SPEC: Record<
  WidgetKind,
  {
    minW: number
    minH: number
    defaultW: number
    defaultH: number
    defaultConfig: Widget["config"]
  }
> = {
  stat: {
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2,
    defaultConfig: { metric: "total_clicks" },
  },
  timeseries: {
    minW: 4,
    minH: 3,
    defaultW: 12,
    defaultH: 5,
    defaultConfig: { viz: "area", metric: "total" },
  },
  breakdown: {
    minW: 3,
    minH: 3,
    defaultW: 6,
    defaultH: 6,
    defaultConfig: { dimension: "referrer", viz: "bars", metric: "total" },
  },
}

export const newWidgetId = () => `w_${Math.random().toString(36).slice(2, 8)}`

/* ---------- default dashboard ---------- */

const seed = (
  id: string,
  kind: WidgetKind,
  grid: WidgetGridRect,
  config: Widget["config"],
) => ({ id, kind, grid, config }) as Widget

export function defaultLayout(): AnalyticsLayout {
  return {
    version: 1,
    widgets: [
      seed("w_total", "stat", { x: 0, y: 0, w: 3, h: 2 }, { metric: "total_clicks" }),
      seed("w_unique", "stat", { x: 3, y: 0, w: 3, h: 2 }, { metric: "unique_clicks" }),
      seed("w_rate", "stat", { x: 6, y: 0, w: 3, h: 2 }, { metric: "unique_rate" }),
      seed("w_cpv", "stat", { x: 9, y: 0, w: 3, h: 2 }, { metric: "clicks_per_visitor" }),
      seed("w_time", "timeseries", { x: 0, y: 2, w: 12, h: 5 }, { viz: "area", metric: "total" }),
      seed("w_country", "breakdown", { x: 0, y: 7, w: 6, h: 6 }, { dimension: "country", viz: "map", metric: "total" }),
      seed("w_city", "breakdown", { x: 6, y: 7, w: 6, h: 6 }, { dimension: "city", viz: "bars", metric: "total" }),
      seed("w_links", "breakdown", { x: 0, y: 13, w: 6, h: 6 }, { dimension: "short_code", viz: "bars", metric: "total" }),
      seed("w_ref", "breakdown", { x: 6, y: 13, w: 6, h: 6 }, { dimension: "referrer", viz: "bars", metric: "total" }),
      seed("w_browser", "breakdown", { x: 0, y: 19, w: 6, h: 6 }, { dimension: "browser", viz: "bars", metric: "total" }),
      seed("w_os", "breakdown", { x: 6, y: 19, w: 6, h: 6 }, { dimension: "os", viz: "bars", metric: "total" }),
    ],
  }
}

/** Frozen module constant — the stable reference `useSyncExternalStore` needs
    as its server snapshot. Never mutate; use `defaultLayout()` for copies. */
export const DEFAULT_LAYOUT: AnalyticsLayout = Object.freeze(
  defaultLayout(),
) as AnalyticsLayout

/* ---------- normalization ---------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

const SERIES_METRICS: readonly SeriesMetric[] = ["total", "unique", "both"]
const STAT_METRICS: readonly StatMetric[] = [
  "total_clicks",
  "unique_clicks",
  "unique_rate",
  "clicks_per_visitor",
]
const TIMESERIES_VIZ: readonly TimeseriesViz[] = ["area", "line", "bars", "table"]
const BREAKDOWN_VIZ: readonly BreakdownViz[] = ["bars", "donut", "table", "map"]

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}

function normalizeConfig(kind: WidgetKind, raw: unknown): Widget["config"] {
  const cfg = isRecord(raw) ? raw : {}
  if (kind === "stat")
    return { metric: pick(cfg.metric, STAT_METRICS, "total_clicks") }
  if (kind === "timeseries")
    return {
      viz: pick(cfg.viz, TIMESERIES_VIZ, "area"),
      metric: pick(cfg.metric, SERIES_METRICS, "total"),
    }
  const dimension = pick(cfg.dimension, BREAKDOWN_DIMENSIONS, "referrer")
  let viz = pick(cfg.viz, BREAKDOWN_VIZ, "bars")
  if (viz === "map" && dimension !== "country") viz = "bars"
  return { dimension, viz, metric: pick(cfg.metric, SERIES_METRICS, "total") }
}

/** Re-run positions through the exact algorithm the grid renders with, then
    order the array by reading position — array order IS the mobile stack. */
function normalizeGrid(widgets: Widget[]): Widget[] {
  const items: LayoutItem[] = widgets.map((w) => ({ i: w.id, ...w.grid }))
  const compacted = verticalCompactor.compact(
    correctBounds(items, { cols: GRID.cols }),
    GRID.cols,
  )
  const byId = new Map(compacted.map((it) => [it.i, it]))
  return widgets
    .map((w) => {
      const it = byId.get(w.id)!
      return { ...w, grid: { x: it.x, y: it.y, w: it.w, h: it.h } }
    })
    .sort((a, b) => a.grid.y - b.grid.y || a.grid.x - b.grid.x)
}

const KINDS: readonly WidgetKind[] = ["stat", "timeseries", "breakdown"]

/** Parse anything (corrupted docs, future docs, the old blocks model) into a
    valid layout. Unrecognized shapes reset to the default dashboard. */
export function normalizeLayout(input: unknown): AnalyticsLayout {
  if (!isRecord(input) || input.version !== 1 || !Array.isArray(input.widgets))
    return defaultLayout()

  const widgets: Widget[] = []
  const seen = new Set<string>()
  for (const raw of input.widgets) {
    if (widgets.length >= MAX_WIDGETS) break
    if (!isRecord(raw)) continue
    const kind = raw.kind as WidgetKind
    const id = raw.id
    if (!KINDS.includes(kind)) continue
    if (typeof id !== "string" || !id || seen.has(id)) continue
    seen.add(id)
    const spec = WIDGET_SPEC[kind]
    const g = isRecord(raw.grid) ? raw.grid : {}
    const w = Math.min(
      GRID.cols,
      Math.max(spec.minW, Math.round(Number(g.w) || spec.defaultW)),
    )
    const h = Math.max(spec.minH, Math.round(Number(g.h) || spec.defaultH))
    const x = Math.min(GRID.cols - w, Math.max(0, Math.round(Number(g.x) || 0)))
    const y = Math.max(0, Math.round(Number(g.y) || 0))
    widgets.push({
      id,
      kind,
      grid: { x, y, w, h },
      config: normalizeConfig(kind, raw.config),
    } as Widget)
  }
  if (widgets.length === 0) return defaultLayout()
  return { version: 1, widgets: normalizeGrid(widgets) }
}

/** Docs are only ever built by this module, so key order is deterministic
    and stringify-compare is exact. */
export function layoutsEqual(a: AnalyticsLayout, b: AnalyticsLayout): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/* ---------- pure ops (each returns a new, normalized doc) ---------- */

/** Apply the grid rectangles RGL reports after a drag/resize commit. */
export function applyGridChange(
  l: AnalyticsLayout,
  items: ReadonlyArray<{ i: string; x: number; y: number; w: number; h: number }>,
): AnalyticsLayout {
  const byId = new Map(items.map((it) => [it.i, it]))
  const widgets = l.widgets.map((w) => {
    const it = byId.get(w.id)
    return it ? { ...w, grid: { x: it.x, y: it.y, w: it.w, h: it.h } } : w
  })
  return { version: 1, widgets: normalizeGrid(widgets) }
}

/** New widget enters at the bottom; compaction pulls it into the first gap. */
export function withWidgetAdded(
  l: AnalyticsLayout,
  kind: WidgetKind,
  id: string,
): AnalyticsLayout {
  if (l.widgets.length >= MAX_WIDGETS) return l
  const spec = WIDGET_SPEC[kind]
  const y = bottom(l.widgets.map((w) => ({ i: w.id, ...w.grid })))
  const widget = {
    id,
    kind,
    grid: { x: 0, y, w: spec.defaultW, h: spec.defaultH },
    config: structuredClone(spec.defaultConfig),
  } as Widget
  return { version: 1, widgets: normalizeGrid([...l.widgets, widget]) }
}

export function withWidgetRemoved(l: AnalyticsLayout, id: string): AnalyticsLayout {
  const widgets = l.widgets.filter((w) => w.id !== id)
  if (widgets.length === l.widgets.length) return l
  return { version: 1, widgets: normalizeGrid(widgets) }
}

/** Duplicate lands directly below the source; neighbors compact around it. */
export function withWidgetDuplicated(
  l: AnalyticsLayout,
  sourceId: string,
  newId: string,
): AnalyticsLayout {
  if (l.widgets.length >= MAX_WIDGETS) return l
  const src = l.widgets.find((w) => w.id === sourceId)
  if (!src) return l
  const copy = {
    ...src,
    id: newId,
    grid: { ...src.grid, y: src.grid.y + src.grid.h },
    config: structuredClone(src.config),
  } as Widget
  return { version: 1, widgets: normalizeGrid([...l.widgets, copy]) }
}

/** Loose patch shape — `normalizeConfig` clamps whatever lands per kind. */
export type WidgetConfigPatch = Partial<{
  metric: StatMetric | SeriesMetric
  viz: TimeseriesViz | BreakdownViz
  dimension: BreakdownDimension
}>

export function withWidgetConfig(
  l: AnalyticsLayout,
  id: string,
  patch: WidgetConfigPatch,
): AnalyticsLayout {
  const widgets = l.widgets.map((w) => {
    if (w.id !== id) return w
    return {
      ...w,
      config: normalizeConfig(w.kind, { ...w.config, ...patch }),
    } as Widget
  })
  return { version: 1, widgets }
}
