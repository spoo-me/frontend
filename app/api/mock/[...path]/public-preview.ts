import { NextResponse } from "next/server"

import { buildLinks, type MockLink } from "./seed"

/**
 * Mock for the proposed public preview endpoint
 * (GET /api/v1/public/preview/{code} — thoughts/link-preview-page.md §6).
 *
 * Status-agnostic resolution like the legacy Jinja preview — blocked/
 * expired/inactive links still answer (seed's `legacy`/`webinar`/`survey`
 * cover those), only missing codes 404. But the DESTINATION (and geo
 * rules) ride the wire only while the link is active and unlocked:
 * password, expiry, pause and block all withhold it. Owner-set meta never
 * rides this wire — the preview shows resolved facts only. The seeded workspace is all v2, so a
 * couple of module-local extras (one v1 link, one emoji alias) keep both
 * generations testable without touching seed.ts.
 */

const PUBLIC_EXTRAS: Array<{ link: MockLink; generation: "v1" | "v2" }> = [
  // very long querystring-heavy destination: wrap behavior check
  {
    generation: "v2",
    link: {
      id: "url_public_v2_longy",
      alias: "longy",
      long_url:
        "https://www.example-analytics-platform.com/campaigns/q3-2026/landing/variant-b/signup-flow/step-1?utm_source=newsletter&utm_medium=email&utm_campaign=summer_launch_2026_wave_3&utm_content=cta_button_primary&utm_term=short+links+analytics&ref=spoo&session_hint=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&fbclid=IwAR2xkP9qLmNoPqRsTuVwXyZ0123456789abcdefghij&gclid=Cj0KCQjw_example_EAIaIQobChMI",
      domain: null,
      status: "ACTIVE",
      created_at: "2026-06-20T10:00:00.000Z",
      expire_after: null,
      max_clicks: null,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 96,
      last_click: "2026-07-11T12:00:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
  // password AND expired at once: the status box wins, no password box
  {
    generation: "v2",
    link: {
      id: "url_public_v2_archive",
      alias: "archive",
      long_url: "https://docs.google.com/presentation/d/old-board-deck",
      domain: null,
      status: "EXPIRED",
      created_at: "2026-01-10T09:00:00.000Z",
      expire_after: 1750000000,
      max_clicks: null,
      password_set: true,
      password: "attic-lantern-08",
      private_stats: false,
      block_bots: false,
      total_clicks: 75,
      last_click: "2026-06-15T00:00:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
  // v1 doc missing creation-date (ancient links): identity line omits it
  {
    generation: "v1",
    link: {
      id: "url_public_v1_nodate",
      alias: "nodate",
      long_url: "https://github.com/spoo-me/url-shortener/issues/1",
      domain: null,
      status: "ACTIVE",
      created_at: null as unknown as string,
      expire_after: null,
      max_clicks: null,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 58,
      last_click: "2026-07-05T00:00:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
  // v2, expired via max-clicks: the backend folds exhaustion into EXPIRED
  // (repositories/url_repository.py expire_if_max_clicks), so this reads
  // exactly like a time-expired link on the wire.
  {
    generation: "v2",
    link: {
      id: "url_public_v2_maxed",
      alias: "maxed",
      long_url: "https://spoo.me/i/beta-invite-wave-3",
      domain: null,
      status: "EXPIRED",
      created_at: "2026-05-02T11:00:00.000Z",
      expire_after: null,
      max_clicks: 500,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 500,
      last_click: "2026-06-30T21:14:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
  // v1, password-protected (plaintext-password generation)
  {
    generation: "v1",
    link: {
      id: "url_public_v1_winter",
      alias: "winter",
      long_url: "https://docs.google.com/document/d/winter-campaign-brief",
      domain: null,
      status: "ACTIVE",
      created_at: "2023-12-01T08:00:00.000Z",
      expire_after: null,
      max_clicks: null,
      password_set: true,
      password: "frost-ledger-19",
      private_stats: false,
      block_bots: false,
      total_clicks: 260,
      last_click: "2026-07-01T10:00:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
  // v1, expired (v1 derives expiry from expiration-time/max-clicks)
  {
    generation: "v1",
    link: {
      id: "url_public_v1_sale24",
      alias: "sale24",
      long_url: "https://shop.spoo.me/collections/summer-sale-2024",
      domain: null,
      status: "EXPIRED",
      created_at: "2024-06-01T00:00:00.000Z",
      expire_after: 1725148800,
      max_clicks: null,
      password_set: false,
      password: null,
      private_stats: false,
      block_bots: false,
      total_clicks: 3120,
      last_click: "2024-08-31T23:50:00.000Z",
      geo_rules: null,
      ab_variants: null,
      meta_tags: null,
      weight: 1,
    },
  },
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
  // Resolution is domain-scoped like the real backend
  // (find_by_alias(code, system_default_domain)): the main-domain preview
  // never resolves custom-tenant links. Tenant previews are a known gap.
  const found = all.find((e) => e.link.domain === null && e.link.alias === code)
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

  // The destination is visible ONLY while the link is active: passwords
  // protect it, and expired/paused/blocked links stop revealing it the
  // moment the redirect does (time-sensitive links stay dead, blocked
  // destinations stay unreachable).
  if (link.password_set || link.status !== "ACTIVE")
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
