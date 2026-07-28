/**
 * Transport layer for the spoo.me FastAPI backend, reached through the
 * same-origin proxy in next.config.mjs (/auth, /oauth, /api/v1 → SPOO_API_URL).
 *
 * Auth is cookie-borne (HttpOnly access + refresh JWT pair) — every call is
 * same-origin so cookies ride along automatically. On a 401 we run ONE
 * shared POST /auth/refresh (single-flight: concurrent 401s await the same
 * promise — the backend rotates refresh tokens, so parallel refreshes would
 * invalidate each other) and retry the original request once.
 */

/** Structured error body every backend endpoint returns. */
type ErrorBody = {
  error?: string
  code?: string
  field?: string
  details?: { missing_requirements?: string[] } & Record<string, unknown>
}

export class SpooApiError extends Error {
  status: number
  code: string
  field?: string
  details?: ErrorBody["details"]

  constructor(status: number, body: ErrorBody | null) {
    super(body?.error ?? `Request failed (${status})`)
    this.name = "SpooApiError"
    this.status = status
    // /auth/refresh returns UPPERCASE codes, everything else lowercase —
    // normalize so callers can match one literal.
    this.code = (body?.code ?? "unknown_error").toLowerCase()
    this.field = body?.field
    this.details = body?.details
  }

  get isRateLimit() {
    return this.status === 429
  }
  get needsVerification() {
    return this.code === "email_not_verified"
  }
}

export async function parse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T
  const body = (await res.json().catch(() => null)) as ErrorBody | null
  throw new SpooApiError(res.status, body)
}

export function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
}

/**
 * Which app surface this request originates from, for the X-Spoo-Client
 * attribution header. Browser-side it's inferred from the current route:
 * /dashboard and /onboarding are the signed-in app, everything else is the
 * public landing surface. Server-side callers are the public pages
 * (/stats/{code}, /{code}+), so no window means "landing".
 */
function clientTag(): "dashboard" | "landing" {
  if (typeof window === "undefined") return "landing"
  const path = window.location.pathname
  return /^\/(dashboard|onboarding)(\/|$)/.test(path) ? "dashboard" : "landing"
}

/**
 * fetch with the X-Spoo-Client attribution header stamped on. Every call to
 * the spoo.me backend goes through here (directly or via authedFetch) —
 * never use it for third-party hosts, the header is ours alone.
 */
export function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("X-Spoo-Client", clientTag())
  return fetch(path, { ...init, headers })
}

/** Single-flight refresh: all concurrent 401 handlers share one attempt. */
let refreshInFlight: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= apiFetch("/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

/** Fetch that transparently refreshes the access token once on 401. */
export async function authedFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const res = await apiFetch(path, init)
  if (res.status !== 401) return res
  const refreshed = await refreshSession()
  if (!refreshed) return res
  return apiFetch(path, init)
}
