import { apiFetch, jsonInit, parse } from "./client"
import { adaptStats, type StatsResponse, type StatsWire } from "./stats"

/**
 * Public per-link stats — the contract behind /stats/{code}
 * (GET|POST /api/v1/public/stats/{code}).
 *
 * Privacy semantics the UI relies on:
 *  - missing codes and private_stats links answer with the SAME 404 (no
 *    oracle distinguishing "private" from "absent")
 *  - password-protected links answer 401 `password_required` until the
 *    password arrives in a POST body; wrong password is 401
 *    `invalid_password`. The password never rides a URL.
 */

export type PublicLinkGeneration = "v1" | "v2"

export type PublicLinkFacts = {
  alias: string
  short_url: string
  /** Withheld (null) unless the link is active — same rule as the
      preview's destination: the page never reveals more than the
      redirect would. Owner sessions still get it. */
  long_url: string | null
  created_at: string | null
  status: "active" | "inactive" | "expired" | "blocked"
  max_clicks: number | null
  block_bots: boolean
  password_protected: boolean
}

export type PublicStats = {
  generation: PublicLinkGeneration
  link: PublicLinkFacts
  stats: StatsResponse
}

type PublicStatsWire = Omit<PublicStats, "stats"> & { stats: StatsWire }

export type PublicStatsParams = {
  startDate?: Date
  endDate?: Date
  /** Explicit opt-in only — the public page never sends one (see below). */
  timezone?: string
  /** Sent in a POST body; presence switches the request method. */
  password?: string
}

/**
 * `baseUrl` defaults to the same-origin proxy ("/api" → next.config
 * rewrites). Server components pass an absolute base instead (the mock
 * route in walkthrough mode, SPOO_API_URL otherwise).
 */
export async function getPublicStats(
  code: string,
  params: PublicStatsParams = {},
  baseUrl = "/api"
): Promise<PublicStats> {
  const q = new URLSearchParams()
  if (params.startDate) q.set("start_date", params.startDate.toISOString())
  if (params.endDate) q.set("end_date", params.endDate.toISOString())
  // No timezone by default: the SSR fetch and every client refetch must
  // bucket identically (the API's default), or the server-seeded range
  // re-buckets the moment the browser's timezone gets a say.
  if (params.timezone) q.set("timezone", params.timezone)
  const url = `${baseUrl}/v1/public/stats/${encodeURIComponent(code)}?${q}`
  const res = await apiFetch(url, {
    ...(params.password
      ? jsonInit("POST", { password: params.password })
      : { method: "GET" }),
    cache: "no-store",
  })
  const wire = await parse<PublicStatsWire>(res)
  return { ...wire, stats: adaptStats(wire.stats) }
}
