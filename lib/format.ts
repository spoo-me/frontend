/** Formatting rules from DIRECTION.md — one implementation, used everywhere. */

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const plain = new Intl.NumberFormat("en")

export function formatCount(n: number | null | undefined): string {
  if (n == null) return "–"
  return n >= 10_000 ? compact.format(n) : plain.format(n)
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "–"
  return `${n % 1 === 0 ? n : n.toFixed(1)}%`
}

const absDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
})
const absDateShort = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
})

/**
 * Relative for recent, absolute for history (ref 04 rule): under 48h reads
 * "12 minutes ago"; older reads "Mar 3, 2026" (year dropped if current).
 */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "never"
  const then = new Date(iso)
  const diffMs = Date.now() - then.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (hours < 48) return "yesterday"
  return then.getFullYear() === new Date().getFullYear()
    ? absDateShort.format(then)
    : absDate.format(then)
}

export function formatDate(iso: string | number | null | undefined): string {
  if (iso == null) return "–"
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso)
  return absDate.format(d)
}

/** Strip protocol + trailing slash for quiet destination display. */
export function displayUrl(url: string | null | undefined): string {
  if (!url) return ""
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function domainOf(url: string | null | undefined): string {
  if (!url) return ""
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
