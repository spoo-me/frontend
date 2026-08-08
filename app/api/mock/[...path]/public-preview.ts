import { NextResponse } from "next/server"

import { PUBLIC_EXTRAS } from "./public-extras"
import { buildLinks, type MockLink } from "./seed"

/**
 * Mock for the proposed public preview endpoint
 * (GET /api/v1/public/preview/{code}).
 *
 * Status-agnostic resolution like the legacy Jinja preview — blocked/
 * expired/inactive links still answer (seed's `legacy`/`webinar`/`survey`
 * cover those), only missing codes 404. But the DESTINATION (and geo
 * rules) ride the wire only while the link is active and unlocked:
 * password, expiry, pause and block all withhold it. Owner-set meta never
 * rides this wire — the preview shows resolved facts only. The seeded
 * workspace is all v2; the shared PUBLIC_EXTRAS carry v1, emoji and the
 * edge states (one list with the stats mock — the two surfaces can never
 * disagree).
 */

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
