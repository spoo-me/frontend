import { authedFetch, parse } from "./client"

export type StatsDimension =
  | "time"
  | "browser"
  | "os"
  | "country"
  | "city"
  | "referrer"
  | "short_code"
  /** v1 legacy only: known-bot hits on the public stats payload. */
  | "bots"

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
    avg_redirection_time: number | null
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

/* ---------- the wire shape (real backend) ----------
   GET /api/v1/stats returns one array PER metric PER dimension
   ("clicks_by_browser", "unique_clicks_by_browser", ...) whose entries are
   keyed by the dimension name ({browser: "Chrome", clicks: 42,
   clicks_percentage: 61.3}); time values are display-formatted strings in
   the requested timezone ("2026-07-09 14:00" / "2026-07-09" / "2026-07" /
   "2026-W27"), and time_bucket_info carries strftime formats plus
   interval_minutes. This module adapts all of that into the merged
   TimeBucket/DimensionRow shape the dashboard consumes; nothing outside
   this file knows the wire format. */

type WireEntry = Record<string, unknown>

export type StatsWire = {
  summary?: {
    total_clicks?: number
    unique_clicks?: number
    first_click?: string | null
    last_click?: string | null
    avg_redirection_time?: number | null
  }
  metrics?: Record<string, WireEntry[]>
  computed_metrics?: StatsResponse["computed_metrics"]
  time_range?: { start_date?: string; end_date?: string }
  time_bucket_info?: {
    strategy?: string
    interval_minutes?: number
    display_format?: string
    timezone?: string
  }
  generated_at?: string
}

/** Display-formatted bucket labels → ISO. Labels arrive in the requested
    (local) timezone without an offset, so Date parses them as local time,
    which is exactly right. */
function bucketToIso(label: string): string {
  let candidate = label
  const weekly = /^(\d{4})-W(\d{1,2})$/.exec(label)
  if (weekly) {
    const d = new Date(Number(weekly[1]), 0, 1 + Number(weekly[2]) * 7)
    return d.toISOString()
  }
  if (/^\d{4}-\d{2}$/.test(label)) candidate = `${label}-01T00:00:00`
  else if (/^\d{4}-\d{2}-\d{2}$/.test(label)) candidate = `${label}T00:00:00`
  else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(label))
    candidate = `${label.replace(" ", "T")}:00`
  const d = new Date(candidate)
  return Number.isNaN(d.getTime()) ? label : d.toISOString()
}

/** Merge clicks_by_{dim} and unique_clicks_by_{dim} on the dimension value,
    preserving the clicks array's order (backend sorts it). */
function zipDim(
  metrics: Record<string, WireEntry[]>,
  dim: string
): Array<{
  value: string
  clicks: number
  unique_clicks: number
  percentage: number
}> {
  const clicks = metrics[`clicks_by_${dim}`] ?? []
  const unique = metrics[`unique_clicks_by_${dim}`] ?? []
  const uniqueByValue = new Map(
    unique.map((e) => [String(e[dim]), Number(e["unique_clicks"] ?? 0)])
  )
  const seen = new Set<string>()
  const out = clicks.map((e) => {
    const value = String(e[dim])
    seen.add(value)
    return {
      value,
      clicks: Number(e["clicks"] ?? 0),
      unique_clicks: uniqueByValue.get(value) ?? 0,
      percentage: Number(e["clicks_percentage"] ?? 0),
    }
  })
  // Values with unique clicks but zero clicks shouldn't exist, but a
  // metric-mismatch shouldn't silently drop rows either.
  for (const e of unique) {
    const value = String(e[dim])
    if (!seen.has(value))
      out.push({
        value,
        clicks: 0,
        unique_clicks: Number(e["unique_clicks"] ?? 0),
        percentage: 0,
      })
  }
  return out
}

export function adaptStats(wire: StatsWire): StatsResponse {
  const metrics = wire.metrics ?? {}
  const tbi = wire.time_bucket_info
  const intervalMin =
    tbi?.interval_minutes ?? (tbi?.display_format?.includes("%H") ? 60 : 1440)
  const hourly = intervalMin < 1440

  const dims = new Set<string>()
  for (const key of Object.keys(metrics)) {
    const m = /^(?:clicks|unique_clicks)_by_(.+)$/.exec(key)
    if (m) dims.add(m[1])
  }

  const out: Record<string, Array<TimeBucket | DimensionRow>> = {}
  for (const dim of dims) {
    const rows = zipDim(metrics, dim)
    if (dim === "time") {
      let buckets: TimeBucket[] = rows
        .map((r) => ({
          bucket: bucketToIso(r.value),
          clicks: r.clicks,
          unique_clicks: r.unique_clicks,
        }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket))
      // Mongo only groups events that exist, so quiet buckets are simply
      // absent from the wire. Charts (and the ghost's index alignment)
      // assume a contiguous series — zero-fill the gaps across the range.
      const stepMs = intervalMin * 60_000
      const endMs = Date.parse(wire.time_range?.end_date ?? "")
      if (buckets.length && intervalMin <= 1440 && !Number.isNaN(endMs)) {
        const anchor = Date.parse(buckets[0].bucket)
        const byMs = new Map(buckets.map((b) => [Date.parse(b.bucket), b]))
        const filled: TimeBucket[] = []
        for (let t = anchor; t < endMs; t += stepMs) {
          filled.push(
            byMs.get(t) ?? {
              bucket: new Date(t).toISOString(),
              clicks: 0,
              unique_clicks: 0,
            }
          )
        }
        buckets = filled
      }
      out["clicks_by_time"] = buckets
    } else {
      out[`clicks_by_${dim}`] = rows
    }
  }

  const totalClicks = wire.summary?.total_clicks ?? 0
  const avg = wire.summary?.avg_redirection_time
  return {
    summary: {
      total_clicks: totalClicks,
      unique_clicks: wire.summary?.unique_clicks ?? 0,
      first_click: wire.summary?.first_click ?? null,
      last_click: wire.summary?.last_click ?? null,
      // The backend averages to 0 over an empty range; that's "no
      // measurement", not "instant".
      avg_redirection_time:
        avg == null || totalClicks === 0 ? null : Math.round(avg),
    },
    metrics: Object.keys(out).length ? out : null,
    computed_metrics: wire.computed_metrics ?? null,
    time_range: {
      start: wire.time_range?.start_date ?? "",
      end: wire.time_range?.end_date ?? "",
    },
    time_bucket_info: {
      strategy: hourly ? "hourly" : "daily",
      bucket_ms: intervalMin * 60_000,
    },
    generated_at: wire.generated_at ?? new Date().toISOString(),
  }
}

export function getStats(params: StatsParams) {
  const q = new URLSearchParams()
  q.set("group_by", params.groupBy.join(","))
  q.set("metrics", "clicks,unique_clicks")
  if (params.startDate) q.set("start_date", params.startDate.toISOString())
  if (params.endDate) q.set("end_date", params.endDate.toISOString())
  // Multi-link scoping goes through the filters JSON: the bare short_code
  // param is single-value (anon scope) on the real API.
  const filters: Record<string, string[]> = { ...params.filters }
  if (params.shortCodes?.length) filters.short_code = params.shortCodes
  if (Object.keys(filters).length) q.set("filters", JSON.stringify(filters))
  q.set(
    "timezone",
    params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  return authedFetch(`/api/v1/stats?${q}`, { method: "GET" }).then(async (r) =>
    adaptStats(await parse<StatsWire>(r))
  )
}

export const timeSeriesOf = (stats: StatsResponse) =>
  (stats.metrics?.["clicks_by_time"] ?? []) as TimeBucket[]

export const dimensionRowsOf = (stats: StatsResponse, dim: StatsDimension) =>
  (stats.metrics?.[`clicks_by_${dim}`] ?? []) as DimensionRow[]
