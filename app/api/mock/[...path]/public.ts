import { NextResponse } from "next/server"

import {
  buildLinks,
  generateStats,
  type MockLink,
  type StatsDimension,
} from "./seed"

/**
 * Mock for the proposed public stats endpoint
 * (GET|POST /api/v1/public/stats/{code} — thoughts/public-stats-page.md §6).
 *
 * The real endpoint resolves BOTH url generations plus emoji aliases; the
 * seeded workspace is all v2, so this module carries a couple of
 * public-surface-only extras (one v1 link, one emoji alias) that never show
 * up in the dashboard's /v1/urls list. Semantics mirrored exactly:
 *  - private_stats → the same 404 a missing code gets (no oracle)
 *  - password-protected → 401 password_required / invalid_password; the
 *    password only ever arrives in a POST body
 *  - v1 payloads carry no city dimension but do carry bots; v2 the reverse
 */

/** v1/emoji sample records — public pages only, invisible to /v1/urls. */
const PUBLIC_EXTRAS: Array<{ link: MockLink; generation: "v1" }> = [
  {
    generation: "v1",
    link: {
      id: "url_public_v1_spring",
      alias: "spring",
      long_url: "https://github.com/spoo-me/url-shortener/tree/legacy",
      domain: null,
      status: "ACTIVE",
      created_at: "2024-04-18T09:30:00.000Z",
      expire_after: null,
      max_clicks: null,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 1840,
      last_click: "2026-07-10T18:22:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 2,
    },
  },
  {
    generation: "v1",
    link: {
      id: "url_public_emoji",
      alias: "🚀✨",
      long_url: "https://docs.spoo.me/emoji-urls",
      domain: null,
      status: "ACTIVE",
      created_at: "2025-01-05T14:00:00.000Z",
      expire_after: null,
      max_clicks: null,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 420,
      last_click: "2026-07-09T07:45:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
]

function publicLinks(): Array<{ link: MockLink; generation: "v1" | "v2" }> {
  return [
    ...buildLinks().map((link) => ({ link, generation: "v2" as const })),
    ...PUBLIC_EXTRAS,
  ]
}

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status })
}

/** Missing and private answer byte-identically — that's the contract. */
const notFound = () => fail(404, "not_found", "short_code not found")

/** Legacy links track known-bot hits; v2 skips bots entirely. */
const BOTS: Array<[string, number]> = [
  ["Googlebot", 6],
  ["Bingbot", 3],
  ["Twitterbot", 2],
  ["Discordbot", 2],
  ["facebookexternalhit", 1],
]

function botsWire(totalClicks: number) {
  const weightTotal = BOTS.reduce((a, [, w]) => a + w, 0)
  const botTotal = Math.max(Math.round(totalClicks * 0.06), BOTS.length)
  const rows = BOTS.map(([name, w]) => ({
    name,
    clicks: Math.max(1, Math.round((botTotal * w) / weightTotal)),
  }))
  const t = rows.reduce((a, r) => a + r.clicks, 0)
  return {
    clicks_by_bots: rows.map((r) => ({
      bots: r.name,
      clicks: r.clicks,
      clicks_percentage: Math.round((r.clicks / t) * 10000) / 100,
    })),
  }
}

function linkFacts(link: MockLink) {
  return {
    alias: link.alias,
    short_url: `https://${link.domain ?? "spoo.me"}/${link.alias}`,
    // Destination-only-while-active, like the preview page: an expired,
    // paused or blocked link's stats page must not out the destination.
    long_url: link.status === "ACTIVE" ? link.long_url : null,
    created_at: link.created_at,
    status: link.status.toLowerCase(),
    max_clicks: link.max_clicks,
    block_bots: link.block_bots,
    password_protected: link.password_set,
  }
}

export function handlePublicStats(
  code: string,
  method: string,
  body: Record<string, unknown>,
  params: URLSearchParams
): NextResponse {
  const all = publicLinks()
  // Resolution is domain-scoped like the real backend: the main-domain
  // stats page never resolves custom-tenant links (tenant surfaces are a
  // known gap, out of scope here).
  const found = all.find((e) => e.link.domain === null && e.link.alias === code)
  if (!found || found.link.private_stats) return notFound()
  const { link, generation } = found

  if (link.password_set) {
    const password = method === "POST" ? String(body.password ?? "") : ""
    if (!password)
      return fail(
        401,
        "password_required",
        "this link's stats are password protected"
      )
    if (password !== link.password)
      return fail(401, "invalid_password", "incorrect password")
  }

  const endMs = params.get("end_date")
    ? Date.parse(params.get("end_date")!)
    : Date.now()
  const startMs = params.get("start_date")
    ? Date.parse(params.get("start_date")!)
    : endMs - 30 * 86_400_000

  const groupBy: StatsDimension[] =
    generation === "v2"
      ? ["time", "browser", "os", "country", "city", "referrer"]
      : ["time", "browser", "os", "country", "referrer"]

  const stats = generateStats(
    all.map((e) => e.link),
    { startMs, endMs, shortCodes: [link.alias], groupBy }
  )
  if (generation === "v1")
    stats.metrics = {
      ...stats.metrics,
      ...botsWire(stats.summary.total_clicks),
    }

  return NextResponse.json({ generation, link: linkFacts(link), stats })
}
