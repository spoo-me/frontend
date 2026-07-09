import fs from "node:fs"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"

import {
  buildDomains,
  buildGrants,
  buildKeys,
  buildLinks,
  generateStats,
  type MockDomain,
  type MockKey,
  type MockLink,
  type StatsDimension,
} from "./seed"

/**
 * Mock backend for design walkthroughs — enabled only when SPOO_MOCK=1
 * (npm run dev:mock). next.config.mjs points the same-origin proxy
 * (/auth/*, /oauth/*, /api/v1/*) here instead of the FastAPI backend, so
 * the real pages run the real flow against canned responses.
 *
 * Conventions:
 *  - any email/password signs in; signup walks the OTP beat (any 6 digits)
 *  - the workspace is a deterministic seeded dataset (see seed.ts)
 *  - aliases "spring", "ga" are taken (plus everything in the seed)
 *  - state is per dev-server process; restart to reset, or GET /api/mock/reset
 */

const MOCK = process.env.SPOO_MOCK === "1"

type MockState = {
  email: string
  userName: string | null
  verified: boolean
  onboarding: {
    step: string | null
    path: "links" | "api" | null
    completed: boolean
  }
  links: MockLink[]
  domains: MockDomain[]
  keys: MockKey[]
  grants: ReturnType<typeof buildGrants>
  /** Per-page dashboard layout overrides, stored opaquely (client owns schema). */
  layouts: Record<string, unknown>
}

/* Layouts survive dev-server restarts on disk — the rest of the mock is
   cheap to reseed, but wiping a hand-arranged dashboard on every file edit
   makes the feature feel broken. Gitignored. */
const LAYOUTS_FILE = path.join(process.cwd(), ".mock-layouts.json")
function readLayoutsFile(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(LAYOUTS_FILE, "utf8"))
  } catch {
    return {}
  }
}
function writeLayoutsFile(layouts: Record<string, unknown>) {
  try {
    fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(layouts, null, 2))
  } catch {
    /* best effort */
  }
}

const initial = (): MockState => ({
  email: "you@example.com",
  userName: "Aditya",
  verified: true,
  onboarding: { step: "completed", path: "links", completed: true },
  links: buildLinks(),
  domains: buildDomains(),
  keys: buildKeys(),
  grants: buildGrants(),
  layouts: readLayoutsFile(),
})

// Survives HMR within one dev-server process.
const g = globalThis as typeof globalThis & { __spooMock?: MockState }
g.__spooMock ??= initial()
const state = () => g.__spooMock!

const EXTRA_TAKEN = new Set(["spring", "ga"])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init)
}

function fail(status: number, code: string, error: string, field?: string) {
  return json({ error, code, ...(field ? { field } : {}) }, { status })
}

function user() {
  const s = state()
  return {
    id: "usr_mock_1",
    email: s.email,
    email_verified: s.verified,
    user_name: s.userName,
    plan: "free",
    password_set: true,
    auth_providers: [{ provider: "github", email: s.email, linked_at: null }],
    pfp: null,
  }
}

function withSession(res: NextResponse) {
  for (const name of ["access_token", "refresh_token"] as const) {
    res.cookies.set(name, `mock_${name}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  }
  return res
}

function clearSession(res: NextResponse) {
  res.cookies.delete("access_token")
  res.cookies.delete("refresh_token")
  return res
}

function slug() {
  return Math.random().toString(36).slice(2, 7)
}

function linkItem(l: MockLink) {
  return {
    id: l.id,
    alias: l.alias,
    long_url: l.long_url,
    status: l.status,
    created_at: l.created_at,
    expire_after: l.expire_after,
    max_clicks: l.max_clicks,
    private_stats: l.private_stats,
    block_bots: l.block_bots,
    password_set: l.password_set,
    password: l.password,
    total_clicks: l.total_clicks,
    last_click: l.last_click,
    domain: l.domain,
    geo_rules: l.geo_rules,
    ab_variants: l.ab_variants,
    meta_tags: l.meta_tags,
  }
}

function parseGeoRules(v: unknown) {
  if (!Array.isArray(v)) return null
  const rules = v
    .filter(
      (r): r is { country: string; url: string } =>
        !!r &&
        typeof r === "object" &&
        /^[A-Z]{2}$/.test(String((r as { country?: unknown }).country)) &&
        /^https?:\/\//.test(String((r as { url?: unknown }).url)),
    )
    .map((r) => ({ country: r.country, url: r.url }))
  return rules.length ? rules : null
}

function parseVariants(v: unknown) {
  if (!Array.isArray(v)) return null
  const variants = v
    .filter(
      (x): x is { url: string; weight: number } =>
        !!x &&
        typeof x === "object" &&
        /^https?:\/\//.test(String((x as { url?: unknown }).url)) &&
        Number((x as { weight?: unknown }).weight) > 0,
    )
    .map((x) => ({ url: x.url, weight: Number(x.weight) }))
  return variants.length ? variants : null
}

function parseMetaTags(v: unknown) {
  if (!v || typeof v !== "object") return null
  const m = v as Record<string, unknown>
  const out: { title?: string; description?: string; image?: string; color?: string } = {}
  if (typeof m.title === "string" && m.title) out.title = m.title
  if (typeof m.description === "string" && m.description) out.description = m.description
  if (typeof m.image === "string" && m.image) out.image = m.image
  if (typeof m.color === "string" && /^#[0-9a-f]{6}$/i.test(m.color)) out.color = m.color
  return Object.keys(out).length ? out : null
}

function aliasTaken(alias: string) {
  const a = alias.toLowerCase()
  return EXTRA_TAKEN.has(a) || state().links.some((l) => l.alias.toLowerCase() === a)
}

async function handle(req: NextRequest, path: string[]) {
  if (!MOCK)
    return fail(404, "mock_disabled", "Mock API is disabled (set SPOO_MOCK=1)")

  const route = `${req.method} /${path.join("/")}`
  const body =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? await req.json().catch(() => ({}))
      : ({} as Record<string, unknown>)
  const params = req.nextUrl.searchParams

  // Latency theater — enough to exercise loading states, not annoy.
  await sleep(200 + Math.random() * 250)

  const s = state()

  switch (route) {
    /* ---------- housekeeping ---------- */
    case "GET /reset": {
      try {
        fs.rmSync(LAYOUTS_FILE, { force: true })
      } catch {
        /* best effort */
      }
      // ?mode=fresh = a brand-new account with zero data everywhere, but
      // onboarding done so the dashboard renders (empty-state testing).
      const fresh = params.get("mode") === "fresh"
      g.__spooMock = fresh
        ? { ...initial(), links: [], domains: [], keys: [], grants: [] }
        : initial()
      return json({ success: true, note: fresh ? "mock reset (fresh account)" : "mock state reset" })
    }

    /* ---------- auth ---------- */
    case "POST /auth/register": {
      g.__spooMock = {
        ...initial(),
        email: String(body.email ?? "you@example.com"),
        userName: body.user_name ? String(body.user_name) : null,
        verified: false, // signup walks the OTP beat
        links: [],
        onboarding: { step: null, path: null, completed: false },
      }
      return withSession(
        json({
          access_token: "mock_access",
          user: user(),
          requires_verification: true,
          verification_sent: true,
        }),
      )
    }
    case "POST /auth/login": {
      g.__spooMock = {
        ...initial(),
        email: String(body.email ?? "you@example.com"),
      }
      return withSession(json({ access_token: "mock_access", user: user() }))
    }
    case "POST /auth/logout":
      return clearSession(json({ success: true }))
    case "GET /auth/me": {
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "not_authenticated", "Not signed in")
      return json({ user: user() })
    }
    case "POST /auth/refresh":
      return withSession(json({ success: true }))
    case "POST /auth/send-verification":
      return json({ success: true, expires_in: 600 })
    case "POST /auth/verify-email": {
      const code = String(body.code ?? "")
      if (!/^\d{6}$/.test(code))
        return fail(400, "invalid_code", "That code doesn't look right", "code")
      s.verified = true
      return json({ success: true, email_verified: true })
    }
    case "POST /auth/request-password-reset":
      return json({ success: true })
    case "POST /auth/reset-password":
      return json({ success: true })
    case "POST /auth/device/revoke": {
      const id = String(body.grant_id ?? "")
      s.grants = s.grants.filter((gr) => gr.id !== id)
      return json({ success: true })
    }

    /* ---------- onboarding cache ---------- */
    case "GET /auth/onboarding":
      return json(s.onboarding)
    case "PUT /auth/onboarding": {
      const step = String(body.step ?? "")
      if (step === "completed") {
        s.onboarding = { ...s.onboarding, step: "completed", completed: true }
      } else {
        s.onboarding = {
          step,
          path: (body.path === undefined ? s.onboarding.path : body.path) as
            | "links"
            | "api"
            | null,
          completed: false,
        }
      }
      return json(s.onboarding)
    }

    /* ---------- shorten ---------- */
    case "GET /v1/shorten/check-alias": {
      const alias = params.get("alias") ?? ""
      const taken = aliasTaken(alias)
      return json({ available: !taken, reason: taken ? "taken" : null })
    }
    case "POST /v1/shorten": {
      const longUrl = String(body.long_url ?? "")
      if (!/^https?:\/\//.test(longUrl))
        return fail(422, "invalid_url", "Enter a valid http(s) URL", "long_url")
      const alias = body.alias ? String(body.alias) : slug()
      if (body.alias && !/^[a-zA-Z0-9_-]{3,16}$/.test(alias))
        return fail(
          422,
          "invalid_alias",
          "3–16 characters: letters, numbers, - and _",
          "alias",
        )
      if (aliasTaken(alias))
        return fail(409, "alias_taken", "That alias is already taken", "alias")
      const domain = body.domain ? String(body.domain) : null
      if (domain && !s.domains.some((d) => d.fqdn === domain && d.status === "ACTIVE"))
        return fail(422, "domain_not_active", "That domain isn't active", "domain")
      const link: MockLink = {
        id: `url_${slug()}`,
        alias,
        long_url: longUrl,
        domain,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        expire_after:
          typeof body.expire_after === "number" ? body.expire_after : null,
        max_clicks: typeof body.max_clicks === "number" ? body.max_clicks : null,
        password_set: typeof body.password === "string" && body.password.length > 0,
        password:
          typeof body.password === "string" && body.password.length > 0
            ? String(body.password)
            : null,
        private_stats: Boolean(body.private_stats),
        block_bots: Boolean(body.block_bots),
        total_clicks: 0,
        last_click: null,
        geo_rules: parseGeoRules(body.geo_rules),
        ab_variants: parseVariants(body.ab_variants),
        meta_tags: parseMetaTags(body.meta_tags),
        weight: 1,
      }
      s.links.unshift(link)
      return json({
        alias,
        short_url: `https://${domain ?? "spoo.me"}/${alias}`,
        long_url: longUrl,
        owner_id: "usr_mock_1",
        created_at: Math.floor(Date.now() / 1000),
        status: "active",
        private_stats: link.private_stats,
      })
    }

    /* ---------- urls list + management ---------- */
    case "GET /v1/urls": {
      let items = [...s.links]
      const domain = params.get("domain")
      if (domain) items = items.filter((l) => l.domain === domain)
      const rawFilter = params.get("filter") ?? params.get("filterBy")
      if (rawFilter) {
        try {
          const f = JSON.parse(rawFilter) as {
            status?: string
            search?: string
            passwordSet?: boolean
            maxClicksSet?: boolean
            createdAfter?: string
            createdBefore?: string
          }
          if (f.status)
            items = items.filter(
              (l) => l.status.toLowerCase() === String(f.status).toLowerCase(),
            )
          if (typeof f.passwordSet === "boolean")
            items = items.filter((l) => l.password_set === f.passwordSet)
          if (typeof f.maxClicksSet === "boolean")
            items = items.filter((l) => (l.max_clicks !== null) === f.maxClicksSet)
          if (f.createdAfter)
            items = items.filter((l) => l.created_at >= String(f.createdAfter))
          if (f.createdBefore)
            items = items.filter((l) => l.created_at <= String(f.createdBefore))
          if (f.search) {
            const q = String(f.search).toLowerCase()
            items = items.filter(
              (l) =>
                l.alias.toLowerCase().includes(q) ||
                l.long_url.toLowerCase().includes(q),
            )
          }
        } catch {
          return fail(422, "invalid_filter", "filter must be JSON", "filter")
        }
      }
      const sortBy = (params.get("sortBy") ?? "created_at") as
        | "created_at"
        | "last_click"
        | "total_clicks"
      const dir = ["asc", "1"].includes(params.get("sortOrder") ?? "desc") ? 1 : -1
      items.sort((a, b) => {
        const av = a[sortBy] ?? ""
        const bv = b[sortBy] ?? ""
        return av === bv ? 0 : av > bv ? dir : -dir
      })
      const page = Math.max(1, Number(params.get("page") ?? 1))
      const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20)))
      const startIdx = (page - 1) * pageSize
      return json({
        items: items.slice(startIdx, startIdx + pageSize).map(linkItem),
        page,
        pageSize,
        total: items.length,
        hasNext: startIdx + pageSize < items.length,
      })
    }
  }

  /* ---------- urls/{id} (+ /status) ---------- */
  if (path[0] === "v1" && path[1] === "urls" && path[2]) {
    const link = s.links.find((l) => l.id === path[2] || l.alias === path[2])
    if (!link) return fail(404, "not_found", "No such URL")

    if (req.method === "PATCH" && path[3] === "status") {
      const next = String(body.status ?? "").toUpperCase()
      if (!["ACTIVE", "INACTIVE"].includes(next))
        return fail(422, "invalid_status", "status must be ACTIVE or INACTIVE", "status")
      link.status = next as MockLink["status"]
      return json(linkItem(link))
    }
    if (req.method === "PATCH") {
      if (typeof body.long_url === "string") {
        if (!/^https?:\/\//.test(body.long_url))
          return fail(422, "invalid_url", "Enter a valid http(s) URL", "long_url")
        link.long_url = body.long_url
      }
      if (typeof body.alias === "string" && body.alias !== link.alias) {
        if (!/^[a-zA-Z0-9_-]{3,16}$/.test(body.alias))
          return fail(422, "invalid_alias", "3–16 characters: letters, numbers, - and _", "alias")
        if (aliasTaken(body.alias))
          return fail(409, "alias_taken", "That alias is already taken", "alias")
        link.alias = body.alias
      }
      if ("password" in body) {
        link.password_set = typeof body.password === "string" && body.password.length > 0
        link.password = link.password_set ? String(body.password) : null
      }
      if ("max_clicks" in body)
        link.max_clicks =
          body.max_clicks === null || body.max_clicks === 0 ? null : Number(body.max_clicks)
      if ("expire_after" in body)
        link.expire_after = body.expire_after === null ? null : Number(body.expire_after)
      if ("private_stats" in body) link.private_stats = Boolean(body.private_stats)
      if ("block_bots" in body) link.block_bots = Boolean(body.block_bots)
      if ("domain" in body) link.domain = body.domain === null ? null : String(body.domain)
      if ("geo_rules" in body)
        link.geo_rules = body.geo_rules === null ? null : parseGeoRules(body.geo_rules)
      if ("ab_variants" in body)
        link.ab_variants =
          body.ab_variants === null ? null : parseVariants(body.ab_variants)
      if ("meta_tags" in body)
        link.meta_tags = body.meta_tags === null ? null : parseMetaTags(body.meta_tags)
      if ("status" in body) {
        const next = String(body.status).toUpperCase()
        if (["ACTIVE", "INACTIVE"].includes(next))
          link.status = next as MockLink["status"]
      }
      return json(linkItem(link))
    }
    if (req.method === "DELETE") {
      s.links = s.links.filter((l) => l !== link)
      return new NextResponse(null, { status: 204 })
    }
  }

  /* ---------- stats + export ---------- */
  if (route === "GET /v1/stats") {
    const endMs = params.get("end_date")
      ? Date.parse(params.get("end_date")!)
      : Date.now()
    const startMs = params.get("start_date")
      ? Date.parse(params.get("start_date")!)
      : endMs - 30 * 86_400_000
    const groupBy = (params.get("group_by")?.split(",") ?? ["time"]) as StatsDimension[]
    const shortCodes = params.get("short_code")?.split(",").filter(Boolean) ?? null
    let filters: Partial<Record<string, string[]>> | undefined
    const rawFilters = params.get("filters")
    if (rawFilters) {
      try {
        const parsed = JSON.parse(rawFilters) as Record<string, string[]>
        filters = parsed
      } catch {
        return fail(422, "invalid_filters", "filters must be JSON", "filters")
      }
    }
    for (const dim of ["browser", "os", "country", "city", "referrer"] as const) {
      const v = params.get(dim)
      if (v) filters = { ...filters, [dim]: v.split(",") }
    }
    return json(generateStats(s.links, { startMs, endMs, shortCodes, filters, groupBy }))
  }

  /* ---------- api keys ----------
     Wire shape mirrors the REAL backend's ApiKeyResponse exactly: envelope
     key `keys`, Unix-second timestamps, NO last_used_at (not served yet).
     The frontend normalizes; keeping the mock honest prevents drift. */
  const keyToWire = (k: MockKey) => ({
    id: k.id,
    name: k.name,
    description: k.description,
    scopes: k.scopes,
    created_at: k.created_at
      ? Math.floor(new Date(k.created_at).getTime() / 1000)
      : null,
    expires_at: k.expires_at
      ? Math.floor(new Date(k.expires_at).getTime() / 1000)
      : null,
    revoked: k.revoked,
    token_prefix: k.token_prefix,
  })
  if (route === "GET /v1/keys")
    return json({ keys: s.keys.map(keyToWire) })
  if (route === "POST /v1/keys") {
    const name = String(body.name ?? "").trim()
    if (!name) return fail(422, "invalid_name", "Give the key a name", "name")
    const token = `spk_live_${slug()}${slug()}${slug()}${slug()}`
    const key: MockKey = {
      id: `key_${slug()}`,
      name,
      description: body.description ? String(body.description) : null,
      token_prefix: token.slice(0, 12),
      scopes: Array.isArray(body.scopes) ? (body.scopes as string[]) : [],
      created_at: new Date().toISOString(),
      expires_at: body.expires_at ? String(body.expires_at) : null,
      last_used_at: null,
      revoked: false,
    }
    s.keys.unshift(key)
    return json({ ...keyToWire(key), token }, { status: 201 })
  }
  if (path[0] === "v1" && path[1] === "keys" && path[2] && req.method === "DELETE") {
    const key = s.keys.find((k) => k.id === path[2])
    if (!key) return fail(404, "not_found", "No such key")
    const revoke = params.get("revoke") === "true"
    if (revoke) key.revoked = true
    else s.keys = s.keys.filter((k) => k !== key)
    return json({ success: true, action: revoke ? "revoked" : "deleted" })
  }

  /* ---------- custom domains ---------- */
  if (route === "GET /v1/custom-domains")
    return json({
      items: s.domains,
      page: 1,
      pageSize: 20,
      total: s.domains.length,
      hasNext: false,
    })
  if (route === "POST /v1/custom-domains") {
    const fqdn = String(body.fqdn ?? "").toLowerCase()
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(fqdn))
      return fail(422, "invalid_fqdn", "Enter a valid domain name", "fqdn")
    if (s.domains.some((d) => d.fqdn === fqdn))
      return fail(409, "domain_exists", "That domain is already registered", "fqdn")
    const dom: MockDomain = {
      id: `dom_${slug()}`,
      fqdn,
      status: "PENDING",
      created_at: new Date().toISOString(),
      last_verified_at: null,
      last_verification_error: null,
      cf_status: null,
      cf_ssl_status: null,
      root_redirect: null,
      not_found_redirect: null,
      custom_robots_txt: null,
      dns_records: [
        { type: "CNAME", name: fqdn, value: "edge.spoo.me", purpose: "routing" },
        {
          type: "TXT",
          name: `_spoo-verify.${fqdn}`,
          value: `spoo-verify=${slug()}${slug()}`,
          purpose: "ownership",
        },
      ],
      setup_notes: ["DNS can take up to an hour to propagate."],
    }
    s.domains.unshift(dom)
    return json(dom)
  }
  if (path[0] === "v1" && path[1] === "custom-domains" && path[2]) {
    const dom = s.domains.find((d) => d.id === path[2])
    if (!dom) return fail(404, "not_found", "No such domain")
    if (req.method === "GET") return json(dom)
    if (req.method === "POST" && path[3] === "verify") {
      // Walk the machine one step per verify call: PENDING → VERIFYING → ACTIVE.
      if (dom.status === "PENDING") {
        dom.status = "VERIFYING"
        dom.cf_status = "pending"
        dom.cf_ssl_status = "pending_validation"
        dom.last_verification_error =
          "CNAME record not found yet. DNS may still be propagating"
      } else if (dom.status === "VERIFYING") {
        dom.status = "ACTIVE"
        dom.cf_status = "active"
        dom.cf_ssl_status = "active"
        dom.last_verified_at = new Date().toISOString()
        dom.last_verification_error = null
        dom.setup_notes = []
      }
      return json(dom)
    }
    if (req.method === "PATCH") {
      if ("root_redirect" in body)
        dom.root_redirect = body.root_redirect === null ? null : String(body.root_redirect)
      if ("not_found_redirect" in body)
        dom.not_found_redirect =
          body.not_found_redirect === null ? null : String(body.not_found_redirect)
      if ("custom_robots_txt" in body)
        dom.custom_robots_txt =
          body.custom_robots_txt === null ? null : String(body.custom_robots_txt)
      return json(dom)
    }
    if (req.method === "DELETE") {
      dom.status = "REVOKED"
      if (params.get("cascade") === "true")
        s.links = s.links.filter((l) => l.domain !== dom.fqdn)
      return json(dom)
    }
  }

  /* ---------- connected apps (device grants) ---------- */
  if (route === "GET /v1/apps") return json({ items: s.grants })

  /* ---------- per-user page layouts (sparse overrides; absent = default) ---------- */
  if (path[0] === "v1" && path[1] === "me" && path[2] === "layouts" && path[3]) {
    const key = path[3]
    if (req.method === "GET") return json({ layout: s.layouts[key] ?? null })
    if (req.method === "PUT") {
      if (!body.layout || typeof body.layout !== "object")
        return fail(422, "invalid_layout", "layout must be an object", "layout")
      s.layouts[key] = body.layout
      writeLayoutsFile(s.layouts)
      return json({ layout: s.layouts[key] })
    }
    if (req.method === "DELETE") {
      delete s.layouts[key]
      writeLayoutsFile(s.layouts)
      return new NextResponse(null, { status: 204 })
    }
  }

  /* ---------- oauth: one hop, straight back signed-in ---------- */
  if (path[0] === "oauth") {
    g.__spooMock = {
      ...initial(),
      email: `you@${path[1] ?? "oauth"}.dev`,
    }
    return withSession(
      NextResponse.redirect(new URL("/onboarding", req.url), { status: 302 }),
    )
  }

  return fail(404, "mock_unimplemented", `No mock for ${route}`)
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
