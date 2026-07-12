import {
  Activity,
  ArrowUp01,
  Bubbles,
  Building2,
  CalendarDays,
  ChartArea,
  ChartBar,
  ChartColumn,
  ChartLine,
  ChartPie,
  ChartScatter,
  Compass,
  Donut,
  Gauge,
  Globe2,
  Hash,
  Layers,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  MonitorSmartphone,
  MousePointerClick,
  Radar,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react"

import type {
  Accent,
  BreakdownDimension,
  BreakdownViz,
  SeriesMetric,
  StatMetric,
  StatViz,
  TimeseriesViz,
  Widget,
  WidgetConfigPatch,
  WidgetKind,
} from "@/lib/analytics-layout"

/** Presentational metadata per breakdown dimension. */
export const DIMENSION_META: Record<
  BreakdownDimension,
  {
    title: string
    icon: React.ElementType
    filterKey: "link" | "referrer" | "country" | "browser" | "os" | "city"
  }
> = {
  short_code: { title: "Top links", icon: Link2, filterKey: "link" },
  referrer: { title: "Referrers", icon: Globe2, filterKey: "referrer" },
  country: { title: "Countries", icon: MapPin, filterKey: "country" },
  city: { title: "Cities", icon: Building2, filterKey: "city" },
  browser: { title: "Browsers", icon: Compass, filterKey: "browser" },
  os: { title: "Operating systems", icon: MonitorSmartphone, filterKey: "os" },
}

/** Stat tiles: label + the quiet footer note (KpiCard grammar) + the
    header help-tooltip copy (what the number actually counts). */
export const STAT_META: Record<
  StatMetric,
  { label: string; footer?: string; hint: string }
> = {
  total_clicks: {
    label: "Total clicks",
    hint: "Every redirect served, repeats included.",
  },
  unique_clicks: {
    label: "Unique visitors",
    hint: "Distinct visitors, de-duplicated.",
  },
  unique_rate: {
    label: "Unique rate",
    footer: "unique / total",
    hint: "Share of clicks from first-time visitors.",
  },
  clicks_per_visitor: {
    label: "Clicks per visitor",
    footer: "repeat behavior",
    hint: "Average redirects per distinct visitor.",
  },
}

/** Add-widget palette entries. */
export const KIND_META: Record<
  WidgetKind,
  { label: string; hint: string; icon: React.ElementType }
> = {
  stat: {
    label: "Stat",
    hint: "One number with its trend",
    icon: Gauge,
  },
  timeseries: {
    label: "Time series",
    hint: "Clicks over the selected range",
    icon: ChartArea,
  },
  breakdown: {
    label: "Breakdown",
    hint: "Top values for any dimension",
    icon: ChartLine,
  },
}

/** The catalog name for a widget's identity (ignores any custom title). */
export function catalogTitle(w: Widget): string {
  if (w.kind === "stat") return STAT_META[w.config.metric].label
  if (w.kind === "timeseries") return "Clicks over time"
  return DIMENSION_META[w.config.dimension].title
}

/** A widget's display name: custom title override or the catalog name. */
export function widgetTitle(w: Widget): string {
  return w.config.title ?? catalogTitle(w)
}

export function widgetIcon(w: Widget): React.ElementType {
  if (w.kind === "breakdown") return DIMENSION_META[w.config.dimension].icon
  return KIND_META[w.kind].icon
}

/**
 * The metric catalog: every block the dashboard can hold. "Add widget" is a
 * checklist over this list — blocks are metrics, not blank charts.
 */
export type CatalogEntry = {
  key: string
  kind: WidgetKind
  group: "Summary" | "Charts"
  label: string
  icon: React.ElementType
  seed?: WidgetConfigPatch
}

export const WIDGET_CATALOG: CatalogEntry[] = [
  ...(Object.keys(STAT_META) as StatMetric[]).map((m) => ({
    key: `stat:${m}`,
    kind: "stat" as const,
    group: "Summary" as const,
    label: STAT_META[m].label,
    icon: Gauge,
    seed: { metric: m },
  })),
  {
    key: "timeseries",
    kind: "timeseries",
    group: "Charts",
    label: "Clicks over time",
    icon: ChartArea,
  },
  ...(Object.keys(DIMENSION_META) as BreakdownDimension[]).map((d) => ({
    key: `breakdown:${d}`,
    kind: "breakdown" as const,
    group: "Charts" as const,
    label: DIMENSION_META[d].title,
    icon: DIMENSION_META[d].icon,
    seed: {
      dimension: d,
      viz: (d === "country" ? "map" : "bars") as WidgetConfigPatch["viz"],
    },
  })),
]

/** The widget on the board matching a catalog identity, if any. */
export function catalogMatch(
  widgets: Widget[],
  entry: CatalogEntry
): Widget | undefined {
  return widgets.find((w) => {
    if (w.kind !== entry.kind) return false
    if (w.kind === "stat") return w.config.metric === entry.seed?.metric
    if (w.kind === "breakdown")
      return w.config.dimension === entry.seed?.dimension
    return true // timeseries
  })
}

/** The viz registries: one list per kind, shared by the edit bar's
    default-view dropdown and the constructor's chart tiles. */
export const TS_VIZ: Array<{
  value: TimeseriesViz
  icon: React.ElementType
  label: string
}> = [
  { value: "area", icon: ChartArea, label: "Area" },
  { value: "line", icon: ChartLine, label: "Line" },
  { value: "step", icon: Activity, label: "Step" },
  { value: "bars", icon: ChartColumn, label: "Bars" },
  { value: "cumulative", icon: TrendingUp, label: "Cumulative" },
  { value: "calendar", icon: CalendarDays, label: "Calendar" },
  { value: "table", icon: Table2, label: "Table" },
]
export const BD_VIZ: Array<{
  value: BreakdownViz
  icon: React.ElementType
  label: string
}> = [
  { value: "bars", icon: ChartBar, label: "Bars" },
  { value: "columns", icon: ChartColumn, label: "Columns" },
  { value: "donut", icon: Donut, label: "Donut" },
  { value: "pie", icon: ChartPie, label: "Pie" },
  { value: "treemap", icon: LayoutDashboard, label: "Treemap" },
  { value: "radial", icon: LoaderCircle, label: "Radial" },
  { value: "radar", icon: Radar, label: "Radar" },
  { value: "bubbles", icon: Bubbles, label: "Bubbles" },
  { value: "scatter", icon: ChartScatter, label: "Scatter" },
  { value: "map", icon: MapIcon, label: "Map" },
  { value: "table", icon: Table2, label: "Table" },
]
/** Stat tile faces; gauge is gated to percentage metrics by the callers. */
export const STAT_VIZ_META: Array<{
  value: StatViz
  icon: React.ElementType
  label: string
}> = [
  { value: "number", icon: Hash, label: "Number" },
  { value: "gauge", icon: Gauge, label: "Gauge" },
  { value: "odometer", icon: ArrowUp01, label: "Odometer" },
]
export const SERIES_METRIC_META: Array<{
  value: SeriesMetric
  icon: React.ElementType
  label: string
}> = [
  { value: "total", icon: MousePointerClick, label: "Total clicks" },
  { value: "unique", icon: Users, label: "Unique visitors" },
  { value: "both", icon: Layers, label: "Both" },
]

/** Chart ink presets resolve to per-theme CSS variables (globals.css). */
export const ACCENT_VARS: Record<Accent, string> = {
  violet: "var(--chart-violet)",
  indigo: "var(--chart-indigo)",
  blue: "var(--chart-blue)",
  sky: "var(--chart-sky)",
  teal: "var(--chart-teal)",
  emerald: "var(--chart-emerald)",
  lime: "var(--chart-lime)",
  amber: "var(--chart-amber)",
  orange: "var(--chart-orange)",
  rose: "var(--chart-rose)",
  fuchsia: "var(--chart-fuchsia)",
  neutral: "var(--chart-neutral)",
}
