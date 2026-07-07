/**
 * Time-range model + the natural-language parser behind the ref-27 picker.
 * Grammar (case-insensitive):
 *   "3h" / "45m" / "7d" / "2w" / "3mo"          → [now - N, now]
 *   "last 7 days" / "last 30 minutes"           → same
 *   "now-3d"                                     → a point 3 days ago
 *   "now-3mo to now-2mo"                         → range between two points
 *   "jul 1" / "2026-07-01" / "jul 1 to jul 5"   → absolute date(s)
 *   "today" / "yesterday"                        → that day
 */

export type TimeRange = { from: Date; to: Date; preset?: string }

export const PRESETS: Array<{ token: string; label: string; ms: number }> = [
  { token: "1h", label: "Last 1 hour", ms: 3_600_000 },
  { token: "6h", label: "Last 6 hours", ms: 6 * 3_600_000 },
  { token: "24h", label: "Last 24 hours", ms: 24 * 3_600_000 },
  { token: "7d", label: "Last 7 days", ms: 7 * 86_400_000 },
  { token: "30d", label: "Last 30 days", ms: 30 * 86_400_000 },
  { token: "90d", label: "Last 90 days", ms: 90 * 86_400_000 },
]

export function presetRange(token: string): TimeRange | null {
  const p = PRESETS.find((x) => x.token === token)
  if (!p) return null
  const to = new Date()
  return { from: new Date(to.getTime() - p.ms), to, preset: token }
}

const UNIT_MS: Record<string, number> = {
  m: 60_000,
  min: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
  w: 7 * 86_400_000,
  week: 7 * 86_400_000,
  weeks: 7 * 86_400_000,
  mo: 30 * 86_400_000,
  month: 30 * 86_400_000,
  months: 30 * 86_400_000,
}

/** "now-3d", "now - 3 days" → Date | null */
function parsePoint(raw: string): Date | null {
  const v = raw.trim().toLowerCase()
  if (v === "now") return new Date()
  if (v === "today") return new Date(new Date().setHours(0, 0, 0, 0))
  if (v === "yesterday")
    return new Date(new Date(Date.now() - 86_400_000).setHours(0, 0, 0, 0))
  const rel = v.match(/^now\s*-\s*(\d+)\s*([a-z]+)$/)
  if (rel) {
    const ms = UNIT_MS[rel[2]]
    if (!ms) return null
    return new Date(Date.now() - Number(rel[1]) * ms)
  }
  const abs = new Date(raw)
  return isNaN(abs.getTime()) ? null : abs
}

export function parseExpression(raw: string): TimeRange | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null

  // "X to Y" — range between two points.
  const toSplit = v.split(/\s+to\s+/)
  if (toSplit.length === 2) {
    const from = parsePoint(toSplit[0])
    const to = parsePoint(toSplit[1])
    if (from && to && from < to) return { from, to }
    return null
  }

  // "last N unit" / bare "N unit" / "3h".
  const dur = v.match(/^(?:last\s+)?(\d+)\s*([a-z]+)$/)
  if (dur) {
    const ms = UNIT_MS[dur[2]]
    if (!ms) return null
    const to = new Date()
    return { from: new Date(to.getTime() - Number(dur[1]) * ms), to }
  }

  // "today" / "yesterday" as a full day.
  if (v === "today") {
    const from = new Date(new Date().setHours(0, 0, 0, 0))
    return { from, to: new Date() }
  }
  if (v === "yesterday") {
    const from = new Date(new Date(Date.now() - 86_400_000).setHours(0, 0, 0, 0))
    return { from, to: new Date(new Date().setHours(0, 0, 0, 0)) }
  }

  // Single absolute date → that whole day.
  const day = parsePoint(v)
  if (day) {
    const from = new Date(new Date(day).setHours(0, 0, 0, 0))
    const to = new Date(from.getTime() + 86_400_000)
    return { from, to: to > new Date() ? new Date() : to }
  }
  return null
}

const dayFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" })
const timeFmt = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function humanize(range: TimeRange): string {
  if (range.preset) {
    const p = PRESETS.find((x) => x.token === range.preset)
    if (p) return p.label
  }
  const sameDay = range.from.toDateString() === range.to.toDateString()
  if (sameDay)
    return `${dayFmt.format(range.from)}, ${timeFmt.format(range.from)} – ${timeFmt.format(range.to)}`
  return `${dayFmt.format(range.from)} – ${dayFmt.format(range.to)}`
}

export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
