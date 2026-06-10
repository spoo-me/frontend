/**
 * Client for the spoo.me FastAPI backend, reached through the same-origin
 * proxy in next.config.mjs (/auth, /oauth, /api/v1 → SPOO_API_URL).
 *
 * Auth is cookie-borne (HttpOnly access + refresh JWT pair) — every call
 * is same-origin so cookies ride along automatically. On a 401 we try one
 * POST /auth/refresh and retry, matching the legacy frontend's contract.
 */

export type AuthProvider = {
  provider: "google" | "github" | "discord"
  email: string | null
  linked_at: string | null
}

export type AuthUser = {
  id: string
  email: string
  email_verified: boolean
  user_name: string | null
  plan: string
  password_set: boolean
  auth_providers: AuthProvider[]
  pfp: { url: string; source: string } | null
}

export type ShortUrl = {
  alias: string
  short_url: string
  long_url: string
  owner_id: string | null
  created_at: number
  status: string
  private_stats: boolean | null
}

export type UrlListItem = {
  id: string
  alias: string | null
  long_url: string | null
  status: string | null
  created_at: string | null
  expire_after: number | null
  max_clicks: number | null
  private_stats: boolean | null
  block_bots: boolean | null
  password_set: boolean
  total_clicks: number | null
  last_click: string | null
  domain: string | null
}

export type UrlListResponse = {
  items: UrlListItem[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export type ApiKeyCreated = {
  id: string
  name: string
  scopes: string[]
  token_prefix: string | null
  /** Full token — only returned once, at creation. */
  token: string
}

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

async function parse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T
  const body = (await res.json().catch(() => null)) as ErrorBody | null
  throw new SpooApiError(res.status, body)
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
}

/** Fetch that transparently refreshes the access token once on 401. */
async function authedFetch(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(path, init)
  if (res.status !== 401) return res
  const refreshed = await fetch("/auth/refresh", { method: "POST" })
  if (!refreshed.ok) return res
  return fetch(path, init)
}

/* ------------------------------- auth ---------------------------------- */

export function register(input: {
  email: string
  password: string
  user_name?: string
}) {
  return fetch("/auth/register", jsonInit("POST", input)).then((r) =>
    parse<{
      access_token: string
      user: AuthUser
      requires_verification: boolean
      verification_sent: boolean
    }>(r),
  )
}

export function login(input: { email: string; password: string }) {
  return fetch("/auth/login", jsonInit("POST", input)).then((r) =>
    parse<{ access_token: string; user: AuthUser }>(r),
  )
}

export function logout() {
  return fetch("/auth/logout", { method: "POST" }).then((r) =>
    parse<{ success: boolean }>(r),
  )
}

export function me() {
  return authedFetch("/auth/me", { method: "GET" }).then((r) =>
    parse<{ user: AuthUser }>(r),
  )
}

export function sendVerification() {
  return authedFetch("/auth/send-verification", { method: "POST" }).then((r) =>
    parse<{ success: boolean; expires_in: number }>(r),
  )
}

export function verifyEmail(code: string) {
  return authedFetch("/auth/verify-email", jsonInit("POST", { code })).then(
    (r) => parse<{ success: boolean; email_verified: boolean }>(r),
  )
}

export function requestPasswordReset(email: string) {
  return fetch("/auth/request-password-reset", jsonInit("POST", { email })).then(
    (r) => parse<{ success: boolean }>(r),
  )
}

export function resetPassword(input: {
  email: string
  code: string
  password: string
}) {
  return fetch("/auth/reset-password", jsonInit("POST", input)).then((r) =>
    parse<{ success: boolean }>(r),
  )
}

/* ------------------------------ api v1 --------------------------------- */

export function checkAlias(alias: string) {
  return fetch(
    `/api/v1/shorten/check-alias?alias=${encodeURIComponent(alias)}`,
  ).then((r) => parse<{ available: boolean; reason: string | null }>(r))
}

export function shorten(input: {
  long_url: string
  alias?: string
  password?: string
  max_clicks?: number
  expire_after?: string
}) {
  return authedFetch("/api/v1/shorten", jsonInit("POST", input)).then((r) =>
    parse<ShortUrl>(r),
  )
}

export function listUrls(params?: { page?: number; pageSize?: number }) {
  const q = new URLSearchParams()
  if (params?.page) q.set("page", String(params.page))
  if (params?.pageSize) q.set("pageSize", String(params.pageSize))
  const qs = q.size ? `?${q}` : ""
  return authedFetch(`/api/v1/urls${qs}`, { method: "GET" }).then((r) =>
    parse<UrlListResponse>(r),
  )
}

export function createApiKey(input: {
  name: string
  description?: string
  scopes: string[]
}) {
  return authedFetch("/api/v1/keys", jsonInit("POST", input)).then((r) =>
    parse<ApiKeyCreated>(r),
  )
}

/* ---------------------------- validation ------------------------------- */

/**
 * Mirror of the backend password policy (shared/validators.py) so the
 * signup form can show live feedback before the server ever sees it.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase", test: (p: string) => /[a-z]/.test(p) },
  { id: "digit", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "One symbol",
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(p),
  },
] as const

export function passwordSatisfies(password: string) {
  return PASSWORD_RULES.every((r) => r.test(password))
}

/** Only allow same-app relative redirect targets (no `//evil.com`). */
export function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\"))
    return null
  return raw
}
