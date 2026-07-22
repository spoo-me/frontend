import { apiFetch, parse } from "./client"

/**
 * Public link preview — the contract behind /{code}+
 * (GET /api/v1/public/preview/{code}, thoughts/link-preview-page.md §6).
 *
 * Safety semantics the UI relies on:
 *  - status-agnostic resolution: expired/blocked/inactive links still
 *    answer, with their status stated. Only truly missing codes 404.
 *  - destination + geo rules ride the wire ONLY while the link is active
 *    and unlocked: password, expiry, pause and block all withhold them
 *    (the preview never reveals more than the redirect would)
 *  - never any stats payload; private_stats links preview like any other
 *  - deliberately no owner-set meta: the preview shows OUR resolved facts
 *    only, custom meta is sender-controlled content
 */

export type PreviewDestination = {
  url: string
  domain: string
  path: string
  is_https: boolean
}

export type PreviewGeoDestination = PreviewDestination & {
  /** ISO 3166-1 alpha-2, sorted — every rule is listed, nothing hidden. */
  countries: string[]
}

export type PublicPreview = {
  generation: "v1" | "v2"
  alias: string
  short_url: string
  status: "active" | "inactive" | "expired" | "blocked"
  created_at: string | null
  password_protected: boolean
  destination: PreviewDestination | null
  geo_destinations: PreviewGeoDestination[] | null
}

/**
 * `baseUrl` defaults to the same-origin proxy ("/api" → next.config
 * rewrites). Server components pass an absolute base instead.
 */
export async function getPublicPreview(
  code: string,
  baseUrl = "/api"
): Promise<PublicPreview> {
  const res = await apiFetch(
    `${baseUrl}/v1/public/preview/${encodeURIComponent(code)}`,
    { method: "GET", cache: "no-store" }
  )
  return parse<PublicPreview>(res)
}
