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
/** Stat tile faces: plain number, rolling odometer digits, or (percentage
    metrics only) a quiet gauge arc. Absent = number. */
export type StatViz = "number" | "gauge" | "odometer"
export type TimeseriesViz =
  | "area"
  | "line"
  | "step"
  | "bars"
  | "cumulative"
  | "calendar"
  | "table"
export type BreakdownViz =
  | "bars"
  | "columns"
  | "donut"
  | "pie"
  | "treemap"
  | "radial"
  | "radar"
  | "bubbles"
  | "scatter"
  | "map"
  | "table"

export const BREAKDOWN_DIMENSIONS = [
  "short_code",
  "referrer",
  "country",
  "city",
  "browser",
  "os",
] as const
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number]

/** Chart ink presets — applied to the visualization only, never card chrome.
    Values resolve to per-theme CSS variables (globals.css). Spectrum order. */
export const ACCENTS = [
  "violet",
  "indigo",
  "blue",
  "sky",
  "teal",
  "emerald",
  "lime",
  "amber",
  "orange",
  "rose",
  "fuchsia",
  "neutral",
] as const
export type Accent = (typeof ACCENTS)[number]

/** Dimensions a widget can be scoped to — the same six the global filter
    chips speak. `short_code` merges against the toolbar's link filter. */
export const SCOPE_DIMENSIONS = [
  "short_code",
  "referrer",
  "country",
  "browser",
  "os",
  "city",
] as const
export type ScopeDimension = (typeof SCOPE_DIMENSIONS)[number]
/** A widget's own lens: values OR within a dimension, AND across dimensions,
    AND with the board's global filters.

    CONSTRAINT (one-release dual-read): stored layouts may carry the link
    scope under `url_id` (link ids, the target key) or the legacy
    `short_code` (aliases). Read both, prefer `url_id`; legacy `short_code`
    keeps riding the server's plain short_code filter so old /me/layouts
    docs keep rendering. Drop the legacy key one release after this ships. */
export type WidgetScope = Partial<Record<ScopeDimension | "url_id", string[]>>

type WidgetExtras = {
  /** Custom display name; absent = the catalog title. */
  title?: string
  /** Chart ink; absent = violet (the brand default). */
  accent?: Accent
  /** Per-widget filters; absent = the widget reads the board's shared lens. */
  scope?: WidgetScope
}

export type StatConfig = { metric: StatMetric; viz?: StatViz } & WidgetExtras
export type TimeseriesConfig = {
  viz: TimeseriesViz
  metric: SeriesMetric
  /** Overlay the equal-length window before the range as a ghost line. */
  compare?: "previous"
} & WidgetExtras
export type BreakdownConfig = {
  dimension: BreakdownDimension
  viz: BreakdownViz
  metric: SeriesMetric
} & WidgetExtras

export type WidgetGridRect = { x: number; y: number; w: number; h: number }
export type Widget =
  | { id: string; kind: "stat"; grid: WidgetGridRect; config: StatConfig }
  | {
      id: string
      kind: "timeseries"
      grid: WidgetGridRect
      config: TimeseriesConfig
    }
  | {
      id: string
      kind: "breakdown"
      grid: WidgetGridRect
      config: BreakdownConfig
    }

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
// Vertical columns: width decides how many categories fit legibly.
export const breakdownColumnCount = (w: number) =>
  w >= 8 ? 10 : w >= 5 ? 8 : 5
// Treemap density scales with AREA — a wider or taller map fits more tiles.
export const treemapSegments = (w: number, h: number) =>
  Math.min(24, Math.max(5, Math.round((w * h) / 3.5)))
// Scatter points are cheap; scale generously with area.
export const scatterPointLimit = (w: number, h: number) =>
  Math.min(60, Math.max(12, Math.round(w * h * 0.9)))
// Bubble packing gets crowded past ~30; scale with area below that.
export const bubbleLimit = (w: number, h: number) =>
  Math.min(30, Math.max(8, Math.round((w * h) / 1.5)))
// Radar spokes: readable between 5 and 8.
export const radarSpokes = (w: number) => (w >= 6 ? 8 : 6)

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
  config: Widget["config"]
) => ({ id, kind, grid, config }) as Widget

export function defaultLayout(): AnalyticsLayout {
  return {
    version: 1,
    widgets: [
      seed(
        "w_total",
        "stat",
        { x: 0, y: 0, w: 3, h: 2 },
        { metric: "total_clicks" }
      ),
      seed(
        "w_unique",
        "stat",
        { x: 3, y: 0, w: 3, h: 2 },
        { metric: "unique_clicks" }
      ),
      seed(
        "w_rate",
        "stat",
        { x: 6, y: 0, w: 3, h: 2 },
        { metric: "unique_rate" }
      ),
      seed(
        "w_cpv",
        "stat",
        { x: 9, y: 0, w: 3, h: 2 },
        { metric: "clicks_per_visitor" }
      ),
      seed(
        "w_time",
        "timeseries",
        { x: 0, y: 2, w: 12, h: 5 },
        { viz: "area", metric: "total" }
      ),
      seed(
        "w_country",
        "breakdown",
        { x: 0, y: 7, w: 6, h: 6 },
        { dimension: "country", viz: "map", metric: "total" }
      ),
      seed(
        "w_city",
        "breakdown",
        { x: 6, y: 7, w: 6, h: 6 },
        { dimension: "city", viz: "bars", metric: "total" }
      ),
      seed(
        "w_links",
        "breakdown",
        { x: 0, y: 13, w: 6, h: 6 },
        { dimension: "short_code", viz: "table", metric: "total" }
      ),
      seed(
        "w_ref",
        "breakdown",
        { x: 6, y: 13, w: 6, h: 6 },
        { dimension: "referrer", viz: "bars", metric: "total" }
      ),
      seed(
        "w_browser",
        "breakdown",
        { x: 0, y: 19, w: 6, h: 6 },
        { dimension: "browser", viz: "bars", metric: "total" }
      ),
      seed(
        "w_os",
        "breakdown",
        { x: 6, y: 19, w: 6, h: 6 },
        { dimension: "os", viz: "bars", metric: "total" }
      ),
    ],
  }
}

/** Frozen module constant — the stable reference `useSyncExternalStore` needs
    as its server snapshot. Never mutate; use `defaultLayout()` for copies. */
export const DEFAULT_LAYOUT: AnalyticsLayout = Object.freeze(
  defaultLayout()
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
const TIMESERIES_VIZ: readonly TimeseriesViz[] = [
  "area",
  "line",
  "step",
  "bars",
  "cumulative",
  "calendar",
  "table",
]
const BREAKDOWN_VIZ: readonly BreakdownViz[] = [
  "bars",
  "columns",
  "donut",
  "pie",
  "treemap",
  "radial",
  "radar",
  "bubbles",
  "scatter",
  "map",
  "table",
]
const STAT_VIZ: readonly StatViz[] = ["number", "gauge", "odometer"]

function pick<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}

/** Every key a stored scope may carry — the six pickable dimensions plus
    `url_id` (see the WidgetScope dual-read constraint). */
const SCOPE_KEYS = [...SCOPE_DIMENSIONS, "url_id"] as const

/** Clamp anything scope-shaped into a valid WidgetScope, or drop it. */
function normalizeScope(raw: unknown): WidgetScope | undefined {
  if (!isRecord(raw)) return undefined
  const scope: WidgetScope = {}
  for (const dim of SCOPE_KEYS) {
    const values = raw[dim]
    if (!Array.isArray(values)) continue
    const clean = [
      ...new Set(
        values
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim().slice(0, 80))
          .filter(Boolean)
      ),
    ].slice(0, 10)
    if (clean.length) scope[dim] = clean
  }
  return Object.keys(scope).length ? scope : undefined
}

function normalizeConfig(kind: WidgetKind, raw: unknown): Widget["config"] {
  const cfg = isRecord(raw) ? raw : {}
  const extras: WidgetExtras = {}
  if (typeof cfg.title === "string" && cfg.title.trim())
    extras.title = cfg.title.trim().slice(0, 40)
  if (ACCENTS.includes(cfg.accent as Accent) && cfg.accent !== "violet")
    extras.accent = cfg.accent as Accent
  const scope = normalizeScope(cfg.scope)
  if (scope) extras.scope = scope
  if (kind === "stat") {
    const metric = pick(cfg.metric, STAT_METRICS, "total_clicks")
    let viz = pick(cfg.viz, STAT_VIZ, "number")
    // A gauge needs a bounded scale; only the percentage metric has one.
    if (viz === "gauge" && metric !== "unique_rate") viz = "number"
    return { metric, ...(viz !== "number" ? { viz } : {}), ...extras }
  }
  if (kind === "timeseries")
    return {
      viz: pick(cfg.viz, TIMESERIES_VIZ, "area"),
      metric: pick(cfg.metric, SERIES_METRICS, "total"),
      ...(cfg.compare === "previous" ? { compare: "previous" as const } : {}),
      ...extras,
    }
  const dimension = pick(cfg.dimension, BREAKDOWN_DIMENSIONS, "referrer")
  let viz = pick(cfg.viz, BREAKDOWN_VIZ, "bars")
  if (viz === "map" && dimension !== "country") viz = "bars"
  return {
    dimension,
    viz,
    metric: pick(cfg.metric, SERIES_METRICS, "total"),
    ...extras,
  }
}

/** Re-run positions through the exact algorithm the grid renders with, then
    order the array by reading position — array order IS the mobile stack. */
function normalizeGrid(widgets: Widget[]): Widget[] {
  const items: LayoutItem[] = widgets.map((w) => ({ i: w.id, ...w.grid }))
  const compacted = verticalCompactor.compact(
    correctBounds(items, { cols: GRID.cols }),
    GRID.cols
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
      Math.max(spec.minW, Math.round(Number(g.w) || spec.defaultW))
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

/** Apply grid rectangles from a drag/resize commit or keyboard nudge,
    clamped to each kind's minimums and the column bounds. */
export function applyGridChange(
  l: AnalyticsLayout,
  items: ReadonlyArray<{
    i: string
    x: number
    y: number
    w: number
    h: number
  }>
): AnalyticsLayout {
  const byId = new Map(items.map((it) => [it.i, it]))
  const widgets = l.widgets.map((widget) => {
    const it = byId.get(widget.id)
    if (!it) return widget
    const spec = WIDGET_SPEC[widget.kind]
    const w = Math.min(GRID.cols, Math.max(spec.minW, Math.round(it.w)))
    const h = Math.max(spec.minH, Math.round(it.h))
    const x = Math.min(GRID.cols - w, Math.max(0, Math.round(it.x)))
    const y = Math.max(0, Math.round(it.y))
    return { ...widget, grid: { x, y, w, h } }
  })
  return { version: 1, widgets: normalizeGrid(widgets) }
}

/** New widget enters at the bottom; compaction pulls it into the first gap.
    `seed` restores a specific identity (a stat's metric, a dimension). */
export function withWidgetAdded(
  l: AnalyticsLayout,
  kind: WidgetKind,
  id: string,
  seed?: WidgetConfigPatch
): AnalyticsLayout {
  if (l.widgets.length >= MAX_WIDGETS) return l
  const spec = WIDGET_SPEC[kind]
  const y = bottom(l.widgets.map((w) => ({ i: w.id, ...w.grid })))
  const config = normalizeConfig(kind, { ...spec.defaultConfig, ...seed })
  const widget = {
    id,
    kind,
    grid: { x: 0, y, w: spec.defaultW, h: spec.defaultH },
    config,
  } as Widget
  return { version: 1, widgets: normalizeGrid([...l.widgets, widget]) }
}

/** Back to catalog defaults for this widget's identity: default viz/metric,
    no title/accent overrides, default size. Position stays. */
export function withWidgetReset(
  l: AnalyticsLayout,
  id: string
): AnalyticsLayout {
  const widgets = l.widgets.map((w) => {
    if (w.id !== id) return w
    const spec = WIDGET_SPEC[w.kind]
    const identity =
      w.kind === "breakdown"
        ? {
            dimension: w.config.dimension,
            viz: w.config.dimension === "country" ? "map" : "bars",
          }
        : w.kind === "stat"
          ? { metric: w.config.metric }
          : {}
    return {
      ...w,
      grid: { ...w.grid, w: spec.defaultW, h: spec.defaultH },
      config: normalizeConfig(w.kind, { ...spec.defaultConfig, ...identity }),
    } as Widget
  })
  return { version: 1, widgets: normalizeGrid(widgets) }
}

export function withWidgetRemoved(
  l: AnalyticsLayout,
  id: string
): AnalyticsLayout {
  const widgets = l.widgets.filter((w) => w.id !== id)
  if (widgets.length === l.widgets.length) return l
  return { version: 1, widgets: normalizeGrid(widgets) }
}

/** Duplicate lands directly below the source; neighbors compact around it. */
export function withWidgetDuplicated(
  l: AnalyticsLayout,
  sourceId: string,
  newId: string
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

/** Loose patch shape — `normalizeConfig` clamps whatever lands per kind.
    Clearing overrides: pass `title: ""`, `accent: "violet"`, `scope: null`
    or `compare: null`. */
export type WidgetConfigPatch = Partial<{
  metric: StatMetric | SeriesMetric
  viz: TimeseriesViz | BreakdownViz | StatViz
  dimension: BreakdownDimension
  title: string
  accent: Accent
  scope: WidgetScope | null
  compare: "previous" | null
}>

export function withWidgetConfig(
  l: AnalyticsLayout,
  id: string,
  patch: WidgetConfigPatch
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

/* ---------- scope composition ---------- */

/** Compose the board's global lens with a widget's own scope: values OR
    within a dimension, AND across sources — both present means intersection.
    An empty intersection can't be expressed as a stats query (an empty list
    means "no filter"), so it returns "disjoint" and the caller renders the
    honest empty state without fetching. */
export function mergeScope(
  globalLinks: string[],
  globalFilters: Partial<
    Record<Exclude<ScopeDimension, "short_code">, string[]>
  >,
  scope: WidgetScope | undefined
):
  | {
      links: string[] | undefined
      urlIds: string[] | undefined
      filters: Record<string, string[]>
    }
  | "disjoint" {
  const both = (a?: string[], b?: string[]): string[] | undefined => {
    if (a?.length && b?.length) {
      const set = new Set(a)
      return b.filter((v) => set.has(v)) // may be [] = disjoint
    }
    return a?.length ? a : b?.length ? b : undefined
  }
  // Dual-read (see WidgetScope): a scope carrying url_id wins over its own
  // legacy short_code. The board's global link lens is alias-vocabulary, so
  // it can't intersect with ids client-side — both go on the wire and the
  // server ANDs the two filters.
  const urlIds = scope?.url_id?.length ? scope.url_id : undefined
  const links = both(globalLinks, urlIds ? undefined : scope?.short_code)
  if (links !== undefined && links.length === 0) return "disjoint"
  const filters: Record<string, string[]> = {}
  for (const dim of SCOPE_DIMENSIONS) {
    if (dim === "short_code") continue
    const merged = both(globalFilters[dim], scope?.[dim])
    if (merged !== undefined && merged.length === 0) return "disjoint"
    if (merged) filters[dim] = merged
  }
  return { links, urlIds, filters }
}
