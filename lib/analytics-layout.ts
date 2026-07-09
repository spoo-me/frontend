/**
 * The analytics dashboard layout document: one canonical default lives here
 * in code (never materialized per user), user docs are sparse overrides, and
 * `normalizeLayout` is the forward-compat seam — unknown blocks drop, missing
 * registry blocks re-appear with defaults, values clamp to sanctioned sets.
 * Pure data module: no React, no UI imports.
 */

export const BREAKDOWN_IDS = [
  "short_code",
  "referrer",
  "country",
  "city",
  "browser",
  "os",
] as const
export type BreakdownId = (typeof BREAKDOWN_IDS)[number]

/** Full-width singleton blocks: the KPI strip and the time chart. They
    reorder and hide like any card but their span is locked to the full row. */
export const FIXED_SPAN_IDS = ["kpis", "time"] as const
export type BlockId = BreakdownId | (typeof FIXED_SPAN_IDS)[number]
export type BlockType = "breakdown" | "kpis" | "timeseries"

export type HeroView = "chart" | "bars" | "table"
export type BlockView = "chart" | "table" | "map"
export type BlockMetric = "total" | "unique" | "both"
export type BlockSpan = 1 | 2

export type BlockConfig = { view: BlockView; metric: BlockMetric }
export type LayoutBlock = {
  id: BlockId
  type: BlockType
  span: BlockSpan
  hidden?: boolean
  // kpis/timeseries blocks carry the same config shape but ignore it (the
  // hero's view lives in `hero.view`); one shape keeps normalize simple.
  config: BlockConfig
}
export type AnalyticsLayout = {
  version: 1
  hero: { view: HeroView }
  blocks: LayoutBlock[]
}

const HERO_VIEWS: readonly HeroView[] = ["chart", "bars", "table"]
const METRICS: readonly BlockMetric[] = ["total", "unique", "both"]

const typeOf = (id: BlockId): BlockType =>
  id === "kpis" ? "kpis" : id === "time" ? "timeseries" : "breakdown"

const defaultView = (id: BlockId): BlockView =>
  id === "country" ? "map" : "chart"

const defaultBlock = (id: BlockId): LayoutBlock => ({
  id,
  type: typeOf(id),
  span: id === "kpis" || id === "time" ? 2 : 1,
  config: { view: defaultView(id), metric: "total" },
})

const ALL_IDS: readonly BlockId[] = [...FIXED_SPAN_IDS, ...BREAKDOWN_IDS]

export function defaultLayout(): AnalyticsLayout {
  return {
    version: 1,
    hero: { view: "chart" },
    blocks: ALL_IDS.map(defaultBlock),
  }
}

/** Frozen module constant — the stable reference `useSyncExternalStore` needs
    as its server snapshot. Never mutate; use `defaultLayout()` for copies. */
export const DEFAULT_LAYOUT: AnalyticsLayout = Object.freeze(
  defaultLayout(),
) as AnalyticsLayout

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/**
 * Parse anything (old docs, future docs, corrupted docs) into a valid v1
 * layout. A future writer bumps `version`; a v1 reader treats anything it
 * doesn't recognize as default rather than guessing.
 */
export function normalizeLayout(input: unknown): AnalyticsLayout {
  if (!isRecord(input) || input.version !== 1) return defaultLayout()

  const heroRaw = isRecord(input.hero) ? input.hero.view : undefined
  const hero: HeroView = HERO_VIEWS.includes(heroRaw as HeroView)
    ? (heroRaw as HeroView)
    : "chart"

  const blocks: LayoutBlock[] = []
  const seen = new Set<BlockId>()
  if (Array.isArray(input.blocks)) {
    for (const raw of input.blocks) {
      if (!isRecord(raw)) continue
      const id = raw.id as BlockId
      if (!ALL_IDS.includes(id) || raw.type !== typeOf(id) || seen.has(id))
        continue
      seen.add(id)
      const fixedSpan = id === "kpis" || id === "time"
      const cfg = isRecord(raw.config) ? raw.config : {}
      const allowedViews: BlockView[] =
        id === "country" ? ["chart", "table", "map"] : ["chart", "table"]
      blocks.push({
        id,
        type: typeOf(id),
        span: fixedSpan ? 2 : raw.span === 2 ? 2 : 1,
        ...(raw.hidden === true ? { hidden: true } : {}),
        config: {
          view: allowedViews.includes(cfg.view as BlockView)
            ? (cfg.view as BlockView)
            : defaultView(id),
          metric: METRICS.includes(cfg.metric as BlockMetric)
            ? (cfg.metric as BlockMetric)
            : "total",
        },
      })
    }
  }
  // Missing kpis/time (docs saved before they became blocks) lead the page,
  // matching where they always lived; missing breakdowns append at the end.
  for (const id of [...FIXED_SPAN_IDS].reverse())
    if (!seen.has(id)) blocks.unshift(defaultBlock(id))
  for (const id of BREAKDOWN_IDS) if (!seen.has(id)) blocks.push(defaultBlock(id))

  return { version: 1, hero: { view: hero }, blocks }
}

/** Docs are only ever built by this module, so key order is deterministic
    and stringify-compare is exact. */
export function layoutsEqual(a: AnalyticsLayout, b: AnalyticsLayout): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/* ---------- pure ops (each returns a new doc) ---------- */

/** Reorder among VISIBLE blocks; hidden blocks keep their array slots so
    re-showing a card restores it where the user left it. */
export function reorderVisible(
  l: AnalyticsLayout,
  activeId: string,
  overId: string,
): AnalyticsLayout {
  const vis = l.blocks.filter((b) => !b.hidden)
  const from = vis.findIndex((b) => b.id === activeId)
  const to = vis.findIndex((b) => b.id === overId)
  if (from < 0 || to < 0 || from === to) return l
  const moved = [...vis]
  const [item] = moved.splice(from, 1)
  moved.splice(to, 0, item)
  let i = 0
  return { ...l, blocks: l.blocks.map((b) => (b.hidden ? b : moved[i++])) }
}

function mapBlock(
  l: AnalyticsLayout,
  id: BlockId,
  fn: (b: LayoutBlock) => LayoutBlock,
): AnalyticsLayout {
  return { ...l, blocks: l.blocks.map((b) => (b.id === id ? fn(b) : b)) }
}

export function withSpan(
  l: AnalyticsLayout,
  id: BlockId,
  span: BlockSpan,
): AnalyticsLayout {
  return mapBlock(l, id, (b) => ({ ...b, span }))
}

export function withHidden(
  l: AnalyticsLayout,
  id: BlockId,
  hidden: boolean,
): AnalyticsLayout {
  return mapBlock(l, id, (b) => {
    if (hidden) return { ...b, hidden: true }
    const rest = { ...b }
    delete rest.hidden
    return rest
  })
}

export function withBlockReset(l: AnalyticsLayout, id: BlockId): AnalyticsLayout {
  return mapBlock(l, id, () => defaultBlock(id))
}

export function withBlockConfig(
  l: AnalyticsLayout,
  id: BlockId,
  patch: Partial<BlockConfig>,
): AnalyticsLayout {
  return mapBlock(l, id, (b) => ({ ...b, config: { ...b.config, ...patch } }))
}

export function withHeroView(l: AnalyticsLayout, view: HeroView): AnalyticsLayout {
  return { ...l, hero: { view } }
}
