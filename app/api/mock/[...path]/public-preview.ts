import { NextResponse } from "next/server"

import { buildLinks, type MockLink } from "./seed"

/**
 * Mock for the proposed public preview endpoint
 * (GET /api/v1/public/preview/{code} — thoughts/link-preview-page.md §6).
 *
 * Status-agnostic like the legacy Jinja preview: blocked/expired/inactive
 * links still answer (the seed's `legacy`/`webinar`/`survey` cover those
 * states), only missing codes 404. Password-protected links withhold the
 * destination and geo rules. Owner-set meta never rides this wire — the
 * preview shows resolved facts only. The seeded workspace is all v2, so a
 * couple of module-local extras (one v1 link, one emoji alias) keep both
 * generations testable without touching seed.ts.
 */

const PUBLIC_EXTRAS: Array<{ link: MockLink; generation: "v1" }> = [
  {
    generation: "v1",
    link: {
      id: "url_public_v1_spring",
      alias: "spring",
      long_url: "http://old.spoo.me/spring-sale-2024",
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

/** Mirrors the backend's _split_destination (routes/legacy/url_shortener.py). */
function splitDestination(url: string) {
  try {
    const u = new URL(url)
    let path = u.pathname + u.search + u.hash
    if (path === "/") path = ""
    return {
      url,
      domain: u.host,
      path,
      is_https: u.protocol === "https:",
    }
  } catch {
    return { url, domain: url.split("/")[0], path: "", is_https: false }
  }
}

export function handlePublicPreview(code: string): NextResponse {
  const all = [
    ...buildLinks().map((link) => ({ link, generation: "v2" as const })),
    ...PUBLIC_EXTRAS,
  ]
  const found = all.find((e) => e.link.alias === code)
  if (!found)
    return NextResponse.json(
      { error: "short_code not found", code: "not_found" },
      { status: 404 }
    )
  const { link, generation } = found

  const base = {
    generation,
    alias: link.alias,
    short_url: `https://${link.domain ?? "spoo.me"}/${link.alias}`,
    status: link.status.toLowerCase(),
    created_at: link.created_at,
    password_protected: link.password_set,
  }

  // The destination is the secret a link password protects — and the
  // owner-controlled geo rules stay hidden with it.
  if (link.password_set)
    return NextResponse.json({
      ...base,
      destination: null,
      geo_destinations: null,
    })

  // Geo-targeted links list EVERY destination, grouped by URL — the
  // preview is the anti-cloaking transparency surface.
  let geo_destinations = null
  if (link.geo_rules) {
    const grouped = new Map<string, string[]>()
    for (const [country, dest] of Object.entries(link.geo_rules)) {
      grouped.set(dest, [...(grouped.get(dest) ?? []), country])
    }
    geo_destinations = [...grouped.entries()].map(([dest, countries]) => ({
      countries: countries.sort(),
      ...splitDestination(dest),
    }))
  }

  return NextResponse.json({
    ...base,
    destination: splitDestination(link.long_url),
    geo_destinations,
  })
}
