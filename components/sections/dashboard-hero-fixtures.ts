import type { DimensionRow, TimeBucket } from "@/lib/api"

/**
 * Static fixtures for the landing's dashboard preview. Same wire types the
 * real dashboard components consume, hardcoded so the preview renders with
 * zero fetching. Series are seeded-deterministic (identical on server and
 * client); only bucket timestamps derive from "today", floored to the day
 * so SSR and hydration agree.
 */

const DAY = 86_400_000

/** Start of the local day — the anchor for all series buckets. */
const anchor = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Daily series with weekly rhythm and a gentle drift — the mid-hundreds
    wave of the analytics screenshot, no spike theatrics. */
function buildDaily(
  days: number,
  endMs: number,
  seed: number,
  base: number
): TimeBucket[] {
  const rand = mulberry32(seed)
  const out: TimeBucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const t = endMs - i * DAY
    const dow = new Date(t).getDay()
    const weekend = dow === 0 || dow === 6 ? 0.68 : 1
    const wave = 1 + 0.22 * Math.sin(((days - i) / days) * Math.PI * 4.2)
    const v = base * weekend * wave * (0.88 + rand() * 0.24)
    const clicks = Math.round(v)
    out.push({
      bucket: new Date(t).toISOString(),
      clicks,
      unique_clicks: Math.round(clicks * (0.64 + rand() * 0.12)),
    })
  }
  return out
}

/** ~30 days for CLICKS OVER TIME. */
export const clickSeries: TimeBucket[] = buildDaily(30, anchor, 0x5eed1, 335)

/** Stat-tile faces — display-ready strings so nothing recomputes. */
export const kpis = {
  uniqueVisitors: "7,272",
  uniqueDelta: 1.7,
  totalClicks: "10.4K",
  totalDelta: 1.6,
  uniqueRate: "69.8%",
  avgRedirectMs: "38",
} as const

/** TOP REFERRERS rows — the product's DimensionRow wire shape, so the
    real row anatomy (favicon, bar, count) renders unchanged. */
export const referrerRows: DimensionRow[] = [
  { value: "direct", clicks: 2163, unique_clicks: 1490, percentage: 30.1 },
  { value: "google.com", clicks: 1900, unique_clicks: 1315, percentage: 26.4 },
  { value: "github.com", clicks: 986, unique_clicks: 702, percentage: 13.7 },
  { value: "x.com", clicks: 772, unique_clicks: 548, percentage: 10.7 },
  { value: "chatgpt.com", clicks: 462, unique_clicks: 331, percentage: 6.4 },
  { value: "reddit.com", clicks: 416, unique_clicks: 296, percentage: 5.8 },
  {
    value: "news.ycombinator.com",
    clicks: 322,
    unique_clicks: 240,
    percentage: 4.5,
  },
]

/** COUNTRIES choropleth rows (alpha-2 codes, brand-tint ramp). */
export const countryRows: DimensionRow[] = [
  { value: "US", clicks: 2860, unique_clicks: 1980, percentage: 27.5 },
  { value: "IN", clicks: 2140, unique_clicks: 1522, percentage: 20.6 },
  { value: "GB", clicks: 842, unique_clicks: 601, percentage: 8.1 },
  { value: "DE", clicks: 664, unique_clicks: 468, percentage: 6.4 },
  { value: "CA", clicks: 588, unique_clicks: 414, percentage: 5.7 },
  { value: "FR", clicks: 512, unique_clicks: 366, percentage: 4.9 },
  { value: "BR", clicks: 448, unique_clicks: 322, percentage: 4.3 },
  { value: "ES", clicks: 331, unique_clicks: 240, percentage: 3.2 },
  { value: "TR", clicks: 286, unique_clicks: 204, percentage: 2.8 },
  { value: "MY", clicks: 232, unique_clicks: 168, percentage: 2.2 },
  { value: "ID", clicks: 204, unique_clicks: 148, percentage: 2.0 },
  { value: "AU", clicks: 188, unique_clicks: 133, percentage: 1.8 },
]
