import { apiFetch, authedFetch, jsonInit, parse } from "./client"

export type ShortUrl = {
  id: string
  alias: string
  short_url: string
  long_url: string
  owner_id: string | null
  created_at: number
  status: string
  private_stats: boolean | null
  geo_rules?: GeoRules | null
  meta_tags?: MetaTags | null
  /** One-time bearer proof of creation, anonymous creates only. Shown
      exactly once; store it or lose the ability to claim the link. */
  claim_token?: string | null
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
/** Decoded byte cap for data-URI image uploads (server settings
    meta_image.upload_max_bytes — 512KB decoded ≈ 683KB on the wire). */
export const META_IMAGE_MAX_BYTES = 512_000

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
 * explicit. Errors: 400 validation_error (non-https url), 422 unfetchable,
 * 504 upstream_timeout, 429 rate_limit_exceeded (60/min authed, 15/min
 * anonymous — never poll this).
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
  /** Raw <title> text, before og/twitter fallbacks. */
  html_title: string | null
  /** Plain <meta name=description>, unnormalized. */
  html_description: string | null
  /** Best declared icon (or /favicon.ico); absolute https URL. */
  favicon: string | null
  og: Record<string, string>
  twitter: Record<string, string>
  fetched_at: string
}

/** Auth optional (anonymous callers get a tighter 15/min per-IP limit);
    the backend accepts https destinations only. */
export function fetchUrlMetadata(url: string) {
  return authedFetch(`/api/v1/metadata?url=${encodeURIComponent(url)}`, {
    method: "GET",
  }).then((r) => parse<UrlMetadata>(r))
}

/**
 * GET /api/v1/expand — a URL's redirect chain, every hop in order.
 * `blocklist_match` is the only safety claim: some hop matches the abuse
 * blocklist spoo.me enforces at link creation. Errors mirror /metadata:
 * 400 validation_error, 422 unfetchable, 504 upstream_timeout, 429.
 */
export type ExpandedUrl = {
  url: string
  final_url: string
  final_status: number | null
  /** Chain stopped at the redirect cap. */
  truncated: boolean
  hops: Array<{ url: string; status: number | null; https: boolean }>
  blocklist_match: boolean
  fetched_at: string
}

/** Auth optional; accepts http and https inputs (chains bounce through
    http trackers — the UI flags those hops). */
export function expandUrl(url: string) {
  return authedFetch(`/api/v1/expand?url=${encodeURIComponent(url)}`, {
    method: "GET",
  }).then((r) => parse<ExpandedUrl>(r))
}

/**
 * Why an alias is unavailable (services/url_service.py). `format` and
 * `length` are DTO-shape problems; `emoji_policy` and `reserved` are service
 * policy; `taken` is a collision. `reserved` only ever applies to alnum
 * aliases.
 */
export type CheckAliasReason =
  | "format"
  | "length"
  | "emoji_policy"
  | "reserved"
  | "taken"

/**
 * The authoritative alias validator. Scoped per domain: the same alias can be
 * free on a custom domain and taken on spoo.me, so the domain rides both the
 * request and (caller-side) the verdict cache key. Public, no auth.
 */
export function checkAlias(alias: string, domain?: string) {
  const q = new URLSearchParams({ alias })
  if (domain) q.set("domain", domain)
  return apiFetch(`/api/v1/shorten/check-alias?${q}`).then((r) =>
    parse<{ available: boolean; reason: CheckAliasReason | null }>(r)
  )
}

/**
 * One accepted emoji, as served by GET /api/v1/emoji-set. `c` is the raw
 * canonical character (VS16 stripped), `n` a searchable human name, `gen`
 * whether it is in the auto-gen pool. `g` (category group) and `k` (extra
 * keywords) MAY be present — treat both as optional and code defensively.
 */
export type EmojiItem = {
  c: string
  n: string
  gen: boolean
  g?: string
  k?: string[]
}

/**
 * The accepted emoji set, derived once per backend deploy and served with a
 * long immutable cache (public, no auth). This is the ONLY source for the
 * picker's list and search metadata — the acceptance policy and emoji names
 * are never replicated client-side from a third-party dataset.
 */
export type EmojiSet = {
  accept_max_version: number
  generate_max_version: number
  max_graphemes: number
  emoji: EmojiItem[]
}

/** Hard client cache: the set is immutable per deploy, so one in-flight
    promise is shared for the tab's lifetime. A failed fetch (e.g. the
    endpoint has not deployed yet) is not memoized, so callers may retry and
    degrade to type-and-validate meanwhile. */
let emojiSetPromise: Promise<EmojiSet> | null = null
export function getEmojiSet(): Promise<EmojiSet> {
  if (!emojiSetPromise) {
    emojiSetPromise = apiFetch("/api/v1/emoji-set")
      .then((r) => parse<EmojiSet>(r))
      .catch((e) => {
        emojiSetPromise = null
        throw e
      })
  }
  return emojiSetPromise
}

export type ShortenInput = {
  long_url: string
  alias?: string
  /** Alias family. Typed for contract completeness: `emoji` with `alias`
      omitted asks the backend to auto-generate a 3-emoji alias. The composer
      does not set this today (it fills the field and lets the live check
      confirm); it is here for API-shaped callers. */
  alias_type?: "alphanumeric" | "emoji"
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
}

export function shorten(input: ShortenInput) {
  return authedFetch("/api/v1/shorten", jsonInit("POST", input)).then((r) =>
    parse<ShortUrl>(r)
  )
}

export type ClaimStatus = "claimed" | "already_yours" | "invalid"

export type ClaimOutcome = {
  results: { url_id: string; status: ClaimStatus }[]
  claimed: number
}

/** Attach anonymously-created links to the signed-in account. Per-item
    results, never a batch failure; tokens burn on success. */
export function claimLinks(claims: { url_id: string; token: string }[]) {
  return authedFetch("/api/v1/urls/claim", jsonInit("POST", { claims })).then(
    (r) => parse<ClaimOutcome>(r)
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
    parse<UrlListResponse>(r)
  )
}

/**
 * GET /api/v1/urls/{domain}/{alias} — one link by its natural key. The
 * domain segment is explicit: the backend resolves its own hostnames to
 * default-domain links, a custom domain resolves links on that domain.
 * Both segments percent-encoded (emoji aliases). 404 for missing or
 * foreign links; the response is one UrlListItem exactly as the list
 * endpoint serves it. (GET /api/v1/urls/{url_id} is the by-id sibling.)
 */
export function getUrl(domain: string, alias: string) {
  return authedFetch(
    `/api/v1/urls/${encodeURIComponent(domain)}/${encodeURIComponent(alias)}`,
    { method: "GET" }
  ).then((r) => parse<UrlListItem>(r))
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
    jsonInit("PATCH", input)
  ).then((r) => parse<UrlListItem>(r))
}

export function setUrlStatus(urlId: string, status: "ACTIVE" | "INACTIVE") {
  return authedFetch(
    `/api/v1/urls/${encodeURIComponent(urlId)}/status`,
    jsonInit("PATCH", { status })
  ).then((r) => parse<UrlListItem>(r))
}

export async function deleteUrl(urlId: string) {
  const res = await authedFetch(`/api/v1/urls/${encodeURIComponent(urlId)}`, {
    method: "DELETE",
  })
  if (!res.ok) await parse(res) // throws SpooApiError
}

/* ---------------------------------------------------------------------------
 * Bulk operations — POST /api/v1/urls/bulk/{delete,status,expiry}
 *
 * One request per user intent instead of a client-side fan-out over the
 * per-item routes. The batch always answers 200 with a summary plus one
 * result row per unique requested id (even all-failed — per-item failures
 * are answers, not errors). A 4xx is envelope rejection where NOTHING was
 * attempted (over-cap, invalid param, missing scope, rate limit, or — until
 * the backend bulk routes are deployed — a 404), and surfaces as a thrown
 * SpooApiError, never a false success.
 *
 * The server caps a request at BULK_MAX_IDS ids; larger selections are
 * chunked here and the per-chunk reports merged, so callers pass the whole
 * selection and get one combined report back.
 * ------------------------------------------------------------------------- */

/** Server cap per bulk request (schemas/dto/requests/bulk.py BULK_MAX_IDS). */
export const BULK_MAX_IDS = 100

/** Closed per-item error vocabulary shared with the single-item routes. */
export type BulkErrorCode =
  | "not_found"
  | "forbidden"
  | "conflict"
  | "validation_error"
  | "internal"
  | "not_attempted"

/** Per-item verdict. `errorCode` is the key to branch on; `error` is a
    display-safe but unstable message. Both null when `ok`. */
export type BulkResultRow = {
  id: string
  alias: string | null
  ok: boolean
  error_code: BulkErrorCode | null
  error: string | null
}

/** Envelope for every bulk URL operation — summary derived from the rows. */
export type BulkOperationResult = {
  summary: { total: number; succeeded: number; failed: number }
  results: BulkResultRow[]
}

/** Split a selection into cap-sized chunks (request order preserved). */
export function chunkIds(ids: string[], size = BULK_MAX_IDS): string[][] {
  if (size < 1) throw new Error("chunk size must be >= 1")
  const out: string[][] = []
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size))
  return out
}

/** Merge per-chunk reports into one, recomputing the summary from the rows
    (the report is the contract; the counts are derived, never tracked
    separately). Chunks carry disjoint ids, so rows simply concatenate. */
export function mergeBulkResults(
  parts: BulkOperationResult[]
): BulkOperationResult {
  const results = parts.flatMap((p) => p.results)
  const succeeded = results.reduce((n, r) => n + (r.ok ? 1 : 0), 0)
  return {
    results,
    summary: {
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
    },
  }
}

/** Fold delete's `not_found` verdicts into successes. Bulk delete treats an
    id that is already gone as success-equivalent (the link is deleted either
    way, per the endpoint contract), so a link removed in another tab or by a
    prior retry must not count as a failure. Without this the retry loop never
    converges and the gone id stays selected. Delete only: you cannot
    deactivate, move or expire a link that does not exist. */
export function reconcileDeletedNotFound(
  result: BulkOperationResult
): BulkOperationResult {
  return mergeBulkResults([
    {
      summary: result.summary,
      results: result.results.map((r) =>
        !r.ok && r.error_code === "not_found"
          ? { ...r, ok: true, error_code: null, error: null }
          : r
      ),
    },
  ])
}

/** Human-readable breakdown of the failed rows, grouped by cause — for an
    honest partial-success message ("2 blocked, 1 already on the target").
    Empty string when nothing failed. */
export function summarizeBulkFailures(rows: BulkResultRow[]): string {
  const labels: Record<BulkErrorCode, string> = {
    not_found: "missing",
    forbidden: "blocked",
    conflict: "alias already taken",
    validation_error: "invalid",
    internal: "errored",
    not_attempted: "not attempted",
  }
  const counts = new Map<string, number>()
  for (const r of rows) {
    if (r.ok) continue
    const label = labels[r.error_code ?? "internal"] ?? "failed"
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()].map(([label, n]) => `${n} ${label}`).join(", ")
}

async function bulkPost(
  op: "delete" | "status" | "expiry" | "domain",
  ids: string[],
  extra: Record<string, unknown>
): Promise<BulkOperationResult> {
  const parts: BulkOperationResult[] = []
  // Sequential: keeps within the per-request rate budget and gives
  // deterministic ordering; chunking past the cap is the rare case.
  //
  // Limitation: a throw on a later chunk (after earlier chunks applied)
  // rejects the whole call and discards the partial report. Unreachable
  // today since selections are page-bounded, so >1 chunk cannot occur;
  // when select-all-matching makes multi-chunk reachable, the clean shape
  // is to catch each chunk's error, emit `not_attempted` rows for the
  // remaining ids, and still return the merged report.
  for (const chunk of chunkIds(ids)) {
    const res = await authedFetch(
      `/api/v1/urls/bulk/${op}`,
      jsonInit("POST", { ids: chunk, ...extra })
    )
    parts.push(await parse<BulkOperationResult>(res))
  }
  return mergeBulkResults(parts)
}

export function bulkDeleteUrls(ids: string[]) {
  return bulkPost("delete", ids, {})
}

export function bulkSetUrlStatus(ids: string[], status: "ACTIVE" | "INACTIVE") {
  return bulkPost("status", ids, { status })
}

/** `expireAfter`: epoch seconds to set, or null to clear. */
export function bulkSetUrlExpiry(ids: string[], expireAfter: number | null) {
  return bulkPost("expiry", ids, { expire_after: expireAfter })
}

/**
 * Move a selection to a domain in one request. `domain` is the target
 * custom-domain fqdn, or "spoo.me"/null for the system default (the wire
 * expresses the default as null, not the fqdn). The whole batch shares one
 * target; an unowned or inactive custom domain rejects the request before
 * any item is touched (a thrown SpooApiError, not a per-item verdict).
 */
export function bulkMoveUrlDomain(ids: string[], domain: string | null) {
  return bulkPost("domain", ids, {
    domain: domain === "spoo.me" ? null : domain,
  })
}
