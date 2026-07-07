import { authedFetch, parse } from "./client"

export type StatsDimension =
  | "time"
  | "browser"
  | "os"
  | "country"
  | "city"
  | "referrer"
  | "short_code"

export type TimeBucket = {
  bucket: string
  clicks: number
  unique_clicks: number
}

export type DimensionRow = {
  value: string
  clicks: number
  unique_clicks: number
  percentage: number
}

export type StatsResponse = {
  summary: {
    total_clicks: number
    unique_clicks: number
    first_click: string | null
    last_click: string | null
    avg_redirection_time: number
  }
  /** Keyed "clicks_by_{dimension}"; time series under "clicks_by_time". */
  metrics: Record<string, Array<TimeBucket | DimensionRow>> | null
  /** Null when the range has no clicks (real backend behavior). */
  computed_metrics: {
    unique_click_rate: number
    repeat_click_rate: number
    average_clicks_per_visitor: number
  } | null
  time_range: { start: string; end: string }
  time_bucket_info: { strategy: "hourly" | "daily"; bucket_ms: number }
  generated_at: string
}

export type StatsParams = {
  startDate?: Date
  endDate?: Date
  groupBy: StatsDimension[]
  shortCodes?: string[]
  /** Per-dimension value filters, e.g. { country: ["US","IN"] }. */
  filters?: Partial<Record<Exclude<StatsDimension, "time">, string[]>>
  timezone?: string
}

export function getStats(params: StatsParams) {
  const q = new URLSearchParams()
  q.set("group_by", params.groupBy.join(","))
  if (params.startDate) q.set("start_date", params.startDate.toISOString())
  if (params.endDate) q.set("end_date", params.endDate.toISOString())
  if (params.shortCodes?.length) q.set("short_code", params.shortCodes.join(","))
  if (params.filters && Object.keys(params.filters).length)
    q.set("filters", JSON.stringify(params.filters))
  q.set(
    "timezone",
    params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  )
  return authedFetch(`/api/v1/stats?${q}`, { method: "GET" }).then((r) =>
    parse<StatsResponse>(r),
  )
}

export const timeSeriesOf = (stats: StatsResponse) =>
  (stats.metrics?.["clicks_by_time"] ?? []) as TimeBucket[]

export const dimensionRowsOf = (stats: StatsResponse, dim: StatsDimension) =>
  (stats.metrics?.[`clicks_by_${dim}`] ?? []) as DimensionRow[]
