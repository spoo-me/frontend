import { authedFetch, jsonInit, parse } from "./client"

export type ShortUrl = {
  alias: string
  short_url: string
  long_url: string
  owner_id: string | null
  created_at: number
  status: string
  private_stats: boolean | null
  geo_rules?: GeoRules | null
  meta_tags?: MetaTags | null
}

export type UrlStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "BLOCKED"

/**
 * Per-country destination overrides (backend PR #230). The wire is a FLAT
 * MAP of UPPERCASE ISO 3166-1 alpha-2 code → destination URL — not an array.
 * Visitors from a listed country get their URL; everyone else gets long_url.
 * Echoed on create/update/list responses. PATCH semantics: omit = unchanged,
 * null or {} = clear all, map = full replace.
 */
export type GeoRules = Record<string, string>

/** Server caps mirrored client-side (PR #230 validators) so saves can't
    400 blind: settings.geo_rules_max_countries and the long_url bound. */
export const GEO_RULES_MAX_COUNTRIES = 50
export const GEO_RULE_URL_MAX_LENGTH = 8192
/** Each variant receives its weight % of traffic; the original destination
    keeps the remainder. Weights sum to at most 100. */
export type AbVariant = { url: string; weight: number }
/* Custom social previews (backend PR #231). Client-side mirrors of the
   server's meta_tags DTO limits so editors reject what the API would 422. */
export const META_TITLE_MAX = 120
export const META_DESCRIPTION_MAX = 240
export const META_IMAGE_URL_MAX = 2048

/** meta_tags as SENT on shorten/PATCH. Whole-object replace; `title` is
    mandatory whenever the object is set (a card without one renders broken
    everywhere). `image` is an https URL (max 2048 chars, `.svg` rejected)
    or a `data:image/png|jpeg|webp;base64,` URI up to 512KB decoded — the
    backend re-hosts uploads on its CDN. Setting requires a verified account
    with the custom_meta_tags flag (403 otherwise); PATCH `null` clears and
    is never gated. */
export type MetaTagsInput = {
  title: string
  description?: string | null
  image?: string | null
  /** theme-color, `#RRGGBB`: Discord tints the embed accent with it. */
  color?: string | null
}

/** meta_tags as ECHOED on create/update/list responses — every field
    serialized, nulls explicit. Data-URI uploads come back as CDN https
    URLs; `warnings` are non-fatal platform-cliff notes (e.g. an image
    WhatsApp may drop) that appear after async image validation. */
export type MetaTags = {
  title: string
  description: string | null
  image: string | null
  color: string | null
  warnings: string[] | null
}

export type UrlListItem = {
  id: string
  alias: string | null
  long_url: string | null
  status: UrlStatus | null
  created_at: string | null
  expire_after: number | null
  max_clicks: number | null
  private_stats: boolean | null
  block_bots: boolean | null
  password_set: boolean
  /** Plaintext password for the owner, when the backend exposes it. */
  password?: string | null
  total_clicks: number | null
  last_click: string | null
  domain: string | null
  geo_rules?: GeoRules | null
  ab_variants?: AbVariant[] | null
  meta_tags?: MetaTags | null
}

export type UrlListResponse = {
  items: UrlListItem[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

/**
 * GET /api/v1/metadata response (backend PR #231) — the destination's
 * CURRENT tags, fetched server-side (SSRF-guarded, cached ~1h). The
 * `title`/`description`/`image`/`color`/`site_name` fields are normalized
 * best-picks (og → twitter → html fallbacks) ready to prefill `meta_tags`;
 * `og`/`twitter` carry the raw tag families. Every field serialized, nulls
 * explicit. Errors: 400 validation_error (non-https url), 401 unauthed,
 * 422 unfetchable, 504 upstream_timeout, 429 rate_limit_exceeded
 * (20/min, 500/day — never poll this).
 */
export type UrlMetadata = {
  url: string
  final_url: string
  title: string | null
  description: string | null
  /** Absolute https URL (resolved against final_url). */
  image: string | null
  /** theme-color, normalized #RRGGBB. */
  color: string | null
  site_name: string | null
  og: Record<string, string>
  twitter: Record<string, string>
  fetched_at: string
}

/** Auth-required; the backend accepts https destinations only. */
export function fetchUrlMetadata(url: string) {
  return authedFetch(`/api/v1/metadata?url=${encodeURIComponent(url)}`, {
    method: "GET",
  }).then((r) => parse<UrlMetadata>(r))
}

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
  expire_after?: number
  domain?: string
  block_bots?: boolean
  private_stats?: boolean
  /** Live on the backend (PR #230); flag-gated — 403 when geo_targeting is
      off for the account, 401 for anonymous callers. */
  geo_rules?: GeoRules
  /** Planned capability — typed now so the UI is contract-ready; the
      backend accepts-and-ignores until it ships. */
  ab_variants?: AbVariant[]
  /** Live on the backend (PR #231); requires a verified account with the
      custom_meta_tags flag — 403 otherwise. */
  meta_tags?: MetaTagsInput
}) {
  return authedFetch("/api/v1/shorten", jsonInit("POST", input)).then((r) =>
    parse<ShortUrl>(r),
  )
}

/** Server-side list filter — serialized as the `filter` JSON query param. */
export type UrlListFilter = {
  status?: UrlStatus
  search?: string
  passwordSet?: boolean
  maxClicksSet?: boolean
  createdAfter?: string
  createdBefore?: string
}

export type ListUrlsParams = {
  page?: number
  pageSize?: number
  sortBy?: "created_at" | "last_click" | "total_clicks"
  sortOrder?: "asc" | "desc"
  filter?: UrlListFilter
  domain?: string
}

export function listUrls(params?: ListUrlsParams) {
  const q = new URLSearchParams()
  if (params?.page) q.set("page", String(params.page))
  if (params?.pageSize) q.set("pageSize", String(params.pageSize))
  if (params?.sortBy) q.set("sortBy", params.sortBy)
  if (params?.sortOrder) q.set("sortOrder", params.sortOrder)
  if (params?.domain) q.set("domain", params.domain)
  if (params?.filter && Object.keys(params.filter).length)
    q.set("filter", JSON.stringify(params.filter))
  const qs = q.size ? `?${q}` : ""
  return authedFetch(`/api/v1/urls${qs}`, { method: "GET" }).then((r) =>
    parse<UrlListResponse>(r),
  )
}

/**
 * PATCH-able link properties. Removal is a first-class verb: password /
 * max_clicks / expire_after accept null to clear (SPEC §5 removal semantics).
 */
export type UpdateUrlInput = Partial<{
  long_url: string
  alias: string
  password: string | null
  block_bots: boolean
  max_clicks: number | null
  expire_after: number | null
  private_stats: boolean
  status: "ACTIVE" | "INACTIVE"
  domain: string | null
  /** Full replace; null or {} clears every rule (clearing is never gated). */
  geo_rules: GeoRules | null
  ab_variants: AbVariant[] | null
  /** Whole-object replace; null clears (clearing is never gated). */
  meta_tags: MetaTagsInput | null
}>

export function updateUrl(urlId: string, input: UpdateUrlInput) {
  return authedFetch(
    `/api/v1/urls/${encodeURIComponent(urlId)}`,
    jsonInit("PATCH", input),
  ).then((r) => parse<UrlListItem>(r))
}

export function setUrlStatus(urlId: string, status: "ACTIVE" | "INACTIVE") {
  return authedFetch(
    `/api/v1/urls/${encodeURIComponent(urlId)}/status`,
    jsonInit("PATCH", { status }),
  ).then((r) => parse<UrlListItem>(r))
}

export async function deleteUrl(urlId: string) {
  const res = await authedFetch(`/api/v1/urls/${encodeURIComponent(urlId)}`, {
    method: "DELETE",
  })
  if (!res.ok) await parse(res) // throws SpooApiError
}
