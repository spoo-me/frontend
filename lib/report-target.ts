/**
 * Report-target parsing — pure client-side logic, no wire coupling
 * (transport and wire types live in lib/api/reports.ts).
 *
 * BEST-EFFORT MIRROR of the backend's normalize_report_target, here for
 * preview UX only (the bulk table's parse states, and the
 * walkthrough mock) — the backend is authoritative on the wire, and the
 * raw input always travels so its verdict wins. The happy paths agree:
 * `abc123`, `spoo.me/abc123`, `https://spoo.me/abc123?x=1` and
 * `go.customer.com/deal` normalize to {domain, code} — domain null for
 * the system default, lowercased fqdn otherwise; query/fragment
 * stripped; the code percent-decoded (emoji aliases). Anything that
 * doesn't parse as a bare code or a single-segment URL is treated as the
 * wire's per-item `invalid_input`.
 *
 * Known divergences on exotic inputs (deliberately unfixed — real codes
 * have no dots, so severity is low): bare host-like strings ("abc.de")
 * read as a domain with no code here, internal whitespace rejects the
 * whole line, and SYSTEM_DOMAINS is hardcoded to spoo.me, which is
 * wrong on self-hosted deployments.
 */

export type ReportTarget = { domain: string | null; code: string }

const SYSTEM_DOMAINS = new Set(["spoo.me", "www.spoo.me"])

const pctDecode = (v: string) => {
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

export function normalizeReportTarget(raw: string): ReportTarget | null {
  const v = raw.trim()
  if (!v || /\s/.test(v)) return null

  // Bare code: no path, no domain dot — v2 charset or a v1/emoji alias.
  if (!v.includes("/") && !v.includes(".")) {
    const code = pctDecode(v)
    return code ? { domain: null, code } : null
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v)
  let url: URL
  try {
    url = new URL(hasScheme ? v : `https://${v}`)
  } catch {
    return null
  }
  if (!/^https?:$/.test(url.protocol)) return null

  // A short link is exactly {domain}/{code} — anything deeper isn't ours.
  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length !== 1) return null
  const code = pctDecode(segments[0])
  if (!code) return null

  const host = url.hostname.toLowerCase()
  return { domain: SYSTEM_DOMAINS.has(host) ? null : host, code }
}

/** Stable dedupe key for a normalized (domain, code) pair. "/" can't
    collide: domains never contain one and a code is a single path
    segment, so `{domain}/{code}` is unique and reads like the link. */
export function reportTargetKey(t: ReportTarget): string {
  return `${t.domain ?? ""}/${t.code}`
}

/** Display form: `spoo.me/code` for the system domain, `{fqdn}/code` else. */
export function reportTargetLabel(t: ReportTarget): string {
  return `${t.domain ?? "spoo.me"}/${t.code}`
}
