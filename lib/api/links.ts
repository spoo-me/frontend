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

export type ListUrlsParams = {
  page?: number
  pageSize?: number
  sortBy?: "created_at" | "last_click" | "total_clicks"
  sortOrder?: "asc" | "desc"
}

export function listUrls(params?: ListUrlsParams) {
  const q = new URLSearchParams()
  if (params?.page) q.set("page", String(params.page))
  if (params?.pageSize) q.set("pageSize", String(params.pageSize))
  if (params?.sortBy) q.set("sortBy", params.sortBy)
  if (params?.sortOrder) q.set("sortOrder", params.sortOrder)
  const qs = q.size ? `?${q}` : ""
  return authedFetch(`/api/v1/urls${qs}`, { method: "GET" }).then((r) =>
    parse<UrlListResponse>(r),
  )
}

export function deleteUrl(urlId: string) {
  return authedFetch(`/api/v1/urls/${encodeURIComponent(urlId)}`, {
    method: "DELETE",
  }).then((r) => parse<{ success: boolean }>(r))
}
