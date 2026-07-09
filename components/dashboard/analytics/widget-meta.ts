import {
  Building2,
  ChartArea,
  ChartLine,
  Compass,
  Gauge,
  Globe2,
  Link2,
  MapPin,
  MonitorSmartphone,
} from "lucide-react"

import type {
  BreakdownDimension,
  StatMetric,
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

/** Stat tiles: label + the quiet footer note (KpiCard grammar). */
export const STAT_META: Record<StatMetric, { label: string; footer?: string }> = {
  total_clicks: { label: "Total clicks" },
  unique_clicks: { label: "Unique visitors" },
  unique_rate: { label: "Unique rate", footer: "unique / total" },
  clicks_per_visitor: { label: "Clicks per visitor", footer: "repeat behavior" },
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
