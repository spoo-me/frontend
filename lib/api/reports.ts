import { jsonInit, parse, SpooApiError } from "./client"

/**
 * Abuse-report intake + contact — the frozen wire contract from
 * thoughts/report-contact-intake-trd.md (POST /api/v1/reports and
 * POST /api/v1/contact). The backend implements the same document; the
 * mock in app/api/mock mirrors it byte-for-byte.
 *
 * Report semantics the UI relies on:
 *  - items are judged PER ITEM: bad codes don't sink the batch. The 200
 *    carries accepted count + a rejected array of {index, input, code}.
 *  - request-level failures stay whole-request, code "validation_error"
 *    either way: DTO-shape errors (bad enum, bad email, missing fields)
 *    are 422 like the rest of the API; semantic gates (empty items,
 *    over the item cap, missing captcha token) are 400 per the TRD.
 *    Failed captcha (anonymous only) → 403.
 *  - caps are submission-wide: 25 items anonymous, 100 authenticated.
 *  - captcha_token is required for anonymous submissions only when the
 *    backend has hCaptcha configured; unset deployments skip it.
 */

export const REPORT_REASONS = [
  "phishing",
  "malware",
  "spam",
  "illegal_content",
  "other",
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

/** How the link reached the reporter — the 451 page's delivery-vector hint. */
export const REPORT_VECTORS = [
  "sms",
  "email",
  "dm",
  "social",
  "web",
  "other",
] as const
export type ReportVector = (typeof REPORT_VECTORS)[number]

export const REPORT_DETAILS_MAX = 2000
export const REPORT_ITEM_CAP_ANON = 25
export const REPORT_ITEM_CAP_AUTHED = 100

export type ReportItemInput = {
  /** Bare code or full short URL, custom domains included. */
  code_or_url: string
  reason: ReportReason
  details?: string
  vector?: ReportVector
}

export type ReportRejectionCode =
  | "invalid_input"
  | "not_found"
  | "duplicate_in_batch"

export type ReportRejection = {
  index: number
  input: string
  code: ReportRejectionCode
}

export type ReportSubmissionInput = {
  items: ReportItemInput[]
  reporter_email?: string
  reporter_org?: string
  captcha_token?: string
}

export type ReportSubmissionResult = {
  /** Opaque reference id of the submission record. */
  submission_id: string
  accepted: number
  rejected: ReportRejection[]
}

export async function submitReports(
  input: ReportSubmissionInput
): Promise<ReportSubmissionResult> {
  const res = await fetch("/api/v1/reports", jsonInit("POST", input))
  return parse<ReportSubmissionResult>(res)
}

export type ContactInput = {
  email: string
  message: string
  captcha_token?: string
}

export async function sendContactMessage(
  input: ContactInput
): Promise<{ ok: true }> {
  const res = await fetch("/api/v1/contact", jsonInit("POST", input))
  return parse<{ ok: true }>(res)
}

/* ── code_or_url normalization mirror ───────────────────────────────────
 *
 * BEST-EFFORT MIRROR of the backend's normalize_report_target (TRD §2),
 * here for preview UX only (the bulk table's parse states, and the
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

/* ── submission error ladder ────────────────────────────────────────────
 *
 * Both intake forms fail the same ways: an abandoned captcha challenge,
 * a rejected token, an unconfigured webhook, a rate limit, or no network.
 * One ladder owns the mapping; the surfaces pass their own copy.
 */

/** Thrown by the captcha hook when a challenge is dismissed or times
    out client-side (no token ever existed — distinct from a 403). */
export class CaptchaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CaptchaError"
  }
}

export type IntakeErrorCopy = {
  /** Challenge dismissed or timed out before a token existed. */
  captchaIncomplete: string
  /** Backend 403: the token didn't verify. */
  captchaRejected: string
  /** 503 not_configured: the receiving webhook is unset server-side. */
  notConfigured: string
  rateLimited: string
  network: string
}

export function intakeErrorText(err: unknown, copy: IntakeErrorCopy): string {
  if (err instanceof CaptchaError) return copy.captchaIncomplete
  if (err instanceof SpooApiError) {
    if (err.code === "not_configured") return copy.notConfigured
    if (err.isRateLimit) return copy.rateLimited
    if (err.status === 403) return copy.captchaRejected
    // Validation errors carry actionable server copy; show it verbatim.
    return err.message
  }
  return copy.network
}
