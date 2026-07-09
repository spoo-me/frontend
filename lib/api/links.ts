import { authedFetch, jsonInit, parse } from "./client"

export type ShortUrl = {
  alias: string
  short_url: string
  long_url: string
  owner_id: string | null
  created_at: number
  status: string
  private_stats: boolean | null
}

export type UrlStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "BLOCKED"

/** Planned capabilities, shared by create and edit. */
export type GeoRule = { country: string; url: string }
/** Each variant receives its weight % of traffic; the original destination
    keeps the remainder. Weights sum to at most 100. */
export type AbVariant = { url: string; weight: number }
export type MetaTags = {
  title?: string
  description?: string
  image?: string
  /** theme-color: Discord tints the embed accent with it. */
  color?: string
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
  geo_rules?: GeoRule[] | null
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
  /** Planned capabilities — typed now so the UI is contract-ready; the
      backend accepts-and-ignores until each ships. */
  geo_rules?: GeoRule[]
  ab_variants?: AbVariant[]
  meta_tags?: MetaTags
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
  geo_rules: GeoRule[] | null
  ab_variants: AbVariant[] | null
  meta_tags: MetaTags | null
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
