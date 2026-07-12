import fs from "node:fs"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { getAlpha2Codes } from "i18n-iso-countries"

import { LONG_URL_MAX_LENGTH, validDestinationUrl } from "@/lib/validation"
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
  passwordSet: boolean
  /** Linked OAuth providers — mirrors AuthProviderInfo + the provider's pfp. */
  providers: Array<{
    provider: "google" | "github" | "discord"
    email: string
    linked_at: string | null
    /** Picture URL the provider gave us (feeds /dashboard/profile-pictures). */
    picture: string | null
  }>
  /** Active profile picture — mirrors UserPfp on the session. */
  pfp: { url: string; source: string } | null
  onboarding: {
    step: string | null
    path: "links" | "api" | null
  }
  onboardedAt: string | null
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
  passwordSet: true,
  providers: [
    {
      provider: "github",
      email: "you@example.com",
      linked_at: "2026-05-14T09:12:00+00:00",
      picture: "/api/mock/avatar/github",
    },
    {
      provider: "google",
      email: "you@gmail.com",
      linked_at: "2026-06-02T18:40:00+00:00",
      picture: "/api/mock/avatar/google",
    },
  ],
  pfp: null,
  onboarding: { step: null, path: null },
  onboardedAt: null,
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

/* Stand-in for the DB-backed blocked-URL regex list (real backend:
   blocked_url repository, checked after validate_url). These patterns
   exist so the 400 "URL is blocked" state is testable on :3001. */
const BLOCKED_URL_PATTERNS = ["malware", "phishing"]
const urlIsBlocked = (url: string) =>
  BLOCKED_URL_PATTERNS.some((p) => new RegExp(p).test(url))

/** The real backend's long_url validation, byte-for-byte: the pydantic DTO
    caps (422, schemas/dto/requests/url.py) then validate_url + blocklist
    (400, services/url_service.py). `required` = create; PATCH treats
    undefined/null as "keep". */
function longUrlFail(raw: unknown, required: boolean): NextResponse | null {
  if (raw === undefined)
    return required
      ? fail(422, "validation_error", "long_url: Field required", "long_url")
      : null
  if (raw === null)
    return required
      ? fail(
          422,
          "validation_error",
          "long_url: Input should be a valid string",
          "long_url"
        )
      : null
  if (typeof raw !== "string")
    return fail(
      422,
      "validation_error",
      "long_url: Input should be a valid string",
      "long_url"
    )
  if (raw.length > LONG_URL_MAX_LENGTH)
    return fail(
      422,
      "validation_error",
      `long_url: String should have at most ${LONG_URL_MAX_LENGTH} characters`,
      "long_url"
    )
  if (!validDestinationUrl(raw))
    return fail(
      400,
      "validation_error",
      "URL is not allowed or invalid",
      "long_url"
    )
  if (urlIsBlocked(raw))
    return fail(400, "validation_error", "URL is blocked", "long_url")
  return null
}

function user() {
  const s = state()
  return {
    id: "usr_mock_1",
    email: s.email,
    email_verified: s.verified,
    user_name: s.userName,
    plan: "free",
    onboarded_at: s.onboardedAt,
    password_set: s.passwordSet,
    auth_providers: s.providers.map((p) => ({
      provider: p.provider,
      email: p.email,
      linked_at: p.linked_at,
    })),
    pfp: s.pfp,
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

/* geo_rules mirrors backend PR #230 byte-for-byte: the wire is a FLAT MAP of
   ISO 3166-1 alpha-2 code → URL. DTO layer (pydantic, 422): keys uppercased,
   case-collisions rejected, URLs non-empty and ≤ 8192 chars. Service layer
   (ValidationError, 400 validation_error): ≤ 50 entries, real ISO codes,
   URL validity — with field paths like `geo_rules.IN`. Cleared rules are
   stored/echoed as null ({} never round-trips). */
const GEO_RULES_MAX_COUNTRIES = 50
const GEO_RULE_URL_MAX_LENGTH = 8192
const ISO_ALPHA2 = new Set(Object.keys(getAlpha2Codes()))

type GeoRulesResult =
  | { ok: Record<string, string> | null }
  | { err: NextResponse }

function normalizeGeoRules(v: unknown): GeoRulesResult {
  if (v === null || v === undefined) return { ok: null }
  if (typeof v !== "object" || Array.isArray(v))
    return {
      err: fail(
        422,
        "validation_error",
        "geo_rules: Input should be a valid dictionary",
        "geo_rules"
      ),
    }
  const normalized: Record<string, string> = {}
  for (const [key, url] of Object.entries(v as Record<string, unknown>)) {
    const code = key.trim().toUpperCase()
    if (code in normalized)
      return {
        err: fail(
          422,
          "validation_error",
          `geo_rules: Value error, duplicate country code after normalisation: '${code}'`,
          "geo_rules"
        ),
      }
    if (typeof url !== "string" || !url.trim())
      return {
        err: fail(
          422,
          "validation_error",
          `geo_rules: Value error, geo_rules['${code}'] must be a non-empty URL string`,
          "geo_rules"
        ),
      }
    if (url.length > GEO_RULE_URL_MAX_LENGTH)
      return {
        err: fail(
          422,
          "validation_error",
          `geo_rules: Value error, geo_rules['${code}'] URL exceeds ${GEO_RULE_URL_MAX_LENGTH} characters`,
          "geo_rules"
        ),
      }
    normalized[code] = url.trim()
  }
  // {} clears — stored as null, and never rejected (rollback path).
  if (!Object.keys(normalized).length) return { ok: null }
  if (Object.keys(normalized).length > GEO_RULES_MAX_COUNTRIES)
    return {
      err: fail(
        400,
        "validation_error",
        `geo_rules cannot exceed ${GEO_RULES_MAX_COUNTRIES} country entries`,
        "geo_rules"
      ),
    }
  for (const [code, url] of Object.entries(normalized)) {
    if (!ISO_ALPHA2.has(code))
      return {
        err: fail(
          400,
          "validation_error",
          `'${code}' is not a valid ISO 3166-1 alpha-2 country code`,
          `geo_rules.${code}`
        ),
      }
    if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(url))
      return {
        err: fail(
          400,
          "validation_error",
          "URL is not allowed or invalid",
          `geo_rules.${code}`
        ),
      }
  }
  return { ok: normalized }
}

function parseVariants(v: unknown) {
  if (!Array.isArray(v)) return null
  const variants = v
    .filter(
      (x): x is { url: string; weight: number } =>
        !!x &&
        typeof x === "object" &&
        /^https?:\/\//.test(String((x as { url?: unknown }).url)) &&
        Number((x as { weight?: unknown }).weight) > 0
    )
    .map((x) => ({ url: x.url, weight: Number(x.weight) }))
  return variants.length ? variants : null
}

/* meta_tags mirrors backend PR #231 byte-for-byte: whole-object replace,
   null clears (clearing is never gated). Setting is gated — verified
   account + custom_meta_tags flag, 403 `forbidden` otherwise (the mock
   account has the flag). DTO layer (pydantic, 422): title required 1–120
   after control-strip + trim, description ≤ 240, image https ≤ 2048 chars
   or a data:image/png|jpeg|webp;base64 URI ≤ 512KB decoded (re-hosted on
   the CDN — 400 validation_error on ingest failures), color #RRGGBB.
   Model layer rejects .svg paths (422, field `image`). The echo carries
   every field with explicit nulls plus `warnings` — platform-cliff notes
   that stay null until async image validation records dimensions. */
const META_TITLE_MAX = 120
const META_DESCRIPTION_MAX = 240
const META_IMAGE_URL_MAX = 2048
const META_IMAGE_MAX_BYTES = 512_000
const META_DATA_URI_RE =
  /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/

type WireMetaTags = {
  title: string
  description: string | null
  image: string | null
  color: string | null
  warnings: string[] | null
}
type MetaTagsResult = { ok: WireMetaTags | null } | { err: NextResponse }

function normalizeMetaTags(v: unknown): MetaTagsResult {
  if (v === null || v === undefined) return { ok: null }
  if (typeof v !== "object" || Array.isArray(v))
    return {
      err: fail(
        422,
        "validation_error",
        "meta_tags: Input should be a valid dictionary or object to extract fields from",
        "meta_tags"
      ),
    }
  const m = v as Record<string, unknown>
  // eslint-disable-next-line no-control-regex
  const strip = (t: string) => t.replace(/[\x00-\x1f\x7f]/g, "").trim()

  if (typeof m.title !== "string")
    return {
      err: fail(
        422,
        "validation_error",
        "meta_tags.title: Field required",
        "meta_tags.title"
      ),
    }
  const title = strip(m.title)
  if (!title)
    return {
      err: fail(
        422,
        "validation_error",
        "meta_tags.title: String should have at least 1 character",
        "meta_tags.title"
      ),
    }
  if (title.length > META_TITLE_MAX)
    return {
      err: fail(
        422,
        "validation_error",
        `meta_tags.title: String should have at most ${META_TITLE_MAX} characters`,
        "meta_tags.title"
      ),
    }

  let description: string | null = null
  if (m.description != null) {
    if (typeof m.description !== "string")
      return {
        err: fail(
          422,
          "validation_error",
          "meta_tags.description: Input should be a valid string",
          "meta_tags.description"
        ),
      }
    description = strip(m.description)
    if (description.length > META_DESCRIPTION_MAX)
      return {
        err: fail(
          422,
          "validation_error",
          `meta_tags.description: String should have at most ${META_DESCRIPTION_MAX} characters`,
          "meta_tags.description"
        ),
      }
  }

  let image: string | null = null
  if (m.image != null) {
    if (typeof m.image !== "string")
      return {
        err: fail(
          422,
          "validation_error",
          "meta_tags.image: Input should be a valid string",
          "meta_tags.image"
        ),
      }
    image = m.image
    if (image.startsWith("data:image/")) {
      // Ingest path: decoded, magic-byte checked, and stored on the CDN by
      // the real backend — the mock re-hosts to a deterministic fake URL.
      const dm = META_DATA_URI_RE.exec(image)
      if (!dm)
        return {
          err: fail(
            400,
            "validation_error",
            "image must be an https URL or a base64 data URI (image/png, image/jpeg, image/webp)",
            "meta_tags.image"
          ),
        }
      if (dm[2].length > (META_IMAGE_MAX_BYTES * 4) / 3 + 4)
        return {
          err: fail(
            400,
            "validation_error",
            `image exceeds ${META_IMAGE_MAX_BYTES} bytes`,
            "meta_tags.image"
          ),
        }
      const ext = dm[1] === "jpeg" ? "jpg" : dm[1]
      image = `https://cdn.spoo.me/og/usr_mock_1/${slug()}${slug()}.${ext}`
    } else {
      if (!image.startsWith("https://"))
        return {
          err: fail(
            422,
            "validation_error",
            "meta_tags.image: Value error, image must be an https:// URL or an image data URI",
            "meta_tags.image"
          ),
        }
      if (image.length > META_IMAGE_URL_MAX)
        return {
          err: fail(
            422,
            "validation_error",
            "meta_tags.image: Value error, image URL must be at most 2048 characters",
            "meta_tags.image"
          ),
        }
      let pathname = ""
      try {
        pathname = new URL(image).pathname
      } catch {
        /* the real backend only inspects the path — unparsable stays */
      }
      // Model-layer check — the real error's loc is bare `image`.
      if (pathname.toLowerCase().endsWith(".svg"))
        return {
          err: fail(
            422,
            "validation_error",
            "image: Value error, SVG images are not supported by preview crawlers",
            "image"
          ),
        }
    }
  }

  let color: string | null = null
  if (m.color != null) {
    if (typeof m.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(m.color))
      return {
        err: fail(
          422,
          "validation_error",
          "meta_tags.color: String should match pattern '^#[0-9a-fA-F]{6}$'",
          "meta_tags.color"
        ),
      }
    color = m.color
  }

  return { ok: { title, description, image, color, warnings: null } }
}

/* GET /v1/metadata mirrors backend PR #231 byte-for-byte: auth-required
   destination tag fetch (prefill companion to meta_tags). Wire: 200 with
   every field explicit (nulls included) + raw og/twitter families; 400
   validation_error for non-https urls; 422 unfetchable when the page
   can't be fetched; 504 upstream_timeout; 429 rate_limit_exceeded at
   20/min. Deterministic fakes: a couple of well-known hosts carry rich
   data, unknown hosts are sparse (title only), path containing "broken"
   is unfetchable, "blocked" is bot-walled (status 403 reason) and "slow"
   times out — so every UI state is testable. */
const META_RICH_HOSTS: Record<
  string,
  {
    title: string
    description: string
    image: string
    color: string | null
    site_name: string
  }
> = {
  "github.com": {
    title: "GitHub · Build and ship software on a single platform",
    description:
      "Join the world's most widely adopted AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
    image: "https://github.githubassets.com/assets/home24-5939032587c9.jpg",
    color: "#1e2327",
    site_name: "GitHub",
  },
  "vercel.com": {
    title:
      "Vercel: Build and deploy the best web experiences with the AI Cloud",
    description:
      "Vercel gives you the frameworks, workflows, and infrastructure to build a faster, more personalized web.",
    image: "https://assets.vercel.com/image/upload/front/vercel/dps.png",
    color: null,
    site_name: "Vercel",
  },
  "stripe.com": {
    title: "Stripe | Financial Infrastructure to Grow Your Revenue",
    description:
      "Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes. Accept payments, send payouts, and automate financial processes with a suite of APIs and no-code tools.",
    image:
      "https://images.stripeassets.com/fzn2n1nzq965/01hMKr6nEEGVfOuhsaMIXQ/c424849423b5f036a8892afa09ac38c7/OG_image.png",
    color: "#635bff",
    site_name: "Stripe",
  },
}

function mockMetadata(url: string): NextResponse {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return fail(
      422,
      "unfetchable",
      "destination is not a fetchable HTML page (invalid URL)"
    )
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase()
  const pathLower = u.pathname.toLowerCase()
  if (pathLower.includes("broken"))
    return fail(
      422,
      "unfetchable",
      "destination is not a fetchable HTML page (connection refused)"
    )
  // Bot-walled destination (Cloudflare challenge etc): the real fetcher
  // surfaces the upstream status in the reason (safe_fetch FetchHardError
  // "status 403") — same wire shape as every other unfetchable.
  if (pathLower.includes("blocked"))
    return fail(
      422,
      "unfetchable",
      "destination is not a fetchable HTML page (status 403)"
    )
  if (pathLower.includes("slow") || pathLower.includes("timeout"))
    return fail(504, "upstream_timeout", "destination did not respond in time")

  const segments = u.pathname.split("/").filter(Boolean)
  const fromPath = segments.length
    ? segments[segments.length - 1]
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  const rich = META_RICH_HOSTS[host]
  let title: string | null
  let description: string | null
  let image: string | null
  let color: string | null
  let site_name: string | null
  if (rich) {
    // GitHub is path-aware like the real thing: repo pages get the
    // dynamically generated opengraph card.
    if (host === "github.com" && segments.length >= 2) {
      title = `${segments[0]}/${segments[1]}: ${fromPath}`
      description = `Contribute to ${segments[0]}/${segments[1]} development by creating an account on GitHub.`
      image = `https://opengraph.githubassets.com/1/${segments[0]}/${segments[1]}`
    } else {
      title = fromPath ? `${fromPath} · ${rich.site_name}` : rich.title
      description = rich.description
      image = rich.image
    }
    color = rich.color
    site_name = rich.site_name
  } else {
    // Unknown hosts parse sparse: an html <title> fallback at best, no
    // social tags at all (og/twitter stay empty below).
    title = fromPath ? `${fromPath} | ${host}` : host
    description = null
    image = null
    color = null
    site_name = null
  }

  return json({
    url,
    final_url: url,
    title,
    description,
    image,
    color,
    site_name,
    og: rich
      ? {
          title: title ?? "",
          description: description ?? "",
          image: image ?? "",
          site_name: site_name ?? "",
          type: "website",
        }
      : {},
    twitter: rich ? { card: "summary_large_image", title: title ?? "" } : {},
    fetched_at: new Date().toISOString(),
  })
}

/** 20/min sliding window, shared across HMR like the rest of the state. */
const gm = globalThis as typeof globalThis & { __spooMetaHits?: number[] }

function aliasTaken(alias: string) {
  const a = alias.toLowerCase()
  return (
    EXTRA_TAKEN.has(a) || state().links.some((l) => l.alias.toLowerCase() === a)
  )
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
        ? {
            ...initial(),
            links: [],
            domains: [],
            keys: [],
            grants: [],
            providers: [],
            pfp: null,
          }
        : initial()
      return json({
        success: true,
        note: fresh ? "mock reset (fresh account)" : "mock state reset",
      })
    }

    /* ---------- auth ---------- */
    case "POST /auth/register": {
      g.__spooMock = {
        ...initial(),
        email: String(body.email ?? "you@example.com"),
        userName: body.user_name ? String(body.user_name) : null,
        verified: false, // signup walks the OTP beat
        links: [],
        providers: [], // email signup starts with no linked providers
        pfp: null,
        onboarding: { step: null, path: null },
        onboardedAt: null,
      }
      return withSession(
        json({
          access_token: "mock_access",
          user: user(),
          requires_verification: true,
          verification_sent: true,
        })
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
      // Mirror the real backend: no refresh cookie → no new session.
      // (Unconditionally re-minting cookies made sign-out impossible — the
      // first 401'd /auth/me would refresh itself straight back in.)
      if (!req.cookies.has("refresh_token"))
        return fail(401, "not_authenticated", "Not signed in")
      return withSession(json({ success: true }))
    case "POST /auth/onboarding/complete": {
      // First completion wins, pointer dropped — mirrors the real contract.
      if (!s.onboardedAt) s.onboardedAt = new Date().toISOString()
      s.onboarding = { step: null, path: null }
      return json({ success: true, onboarded_at: s.onboardedAt })
    }
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
      s.onboarding = {
        step: String(body.step ?? ""),
        path: (body.path === undefined ? s.onboarding.path : body.path) as
          | "links"
          | "api"
          | null,
      }
      return json(s.onboarding)
    }

    /* ---------- destination metadata (prefill) ---------- */
    case "GET /v1/metadata": {
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "authentication_error", "Authentication required")
      const url = params.get("url") ?? ""
      if (!url.startsWith("https://"))
        return fail(400, "validation_error", "url must be https", "url")
      const now = Date.now()
      gm.__spooMetaHits = (gm.__spooMetaHits ?? []).filter(
        (t) => now - t < 60_000
      )
      if (gm.__spooMetaHits.length >= 20)
        return fail(429, "rate_limit_exceeded", "Too many requests")
      gm.__spooMetaHits.push(now)
      return mockMetadata(url)
    }

    /* ---------- shorten ---------- */
    case "GET /v1/shorten/check-alias": {
      const alias = params.get("alias") ?? ""
      const taken = aliasTaken(alias)
      return json({ available: !taken, reason: taken ? "taken" : null })
    }
    case "POST /v1/shorten": {
      // The DTO accepts `url` as an alias for `long_url` (first alias wins).
      const rawLong = body.long_url !== undefined ? body.long_url : body.url
      const longUrlErr = longUrlFail(rawLong, true)
      if (longUrlErr) return longUrlErr
      const longUrl = String(rawLong)
      const alias = body.alias ? String(body.alias) : slug()
      if (body.alias && !/^[a-zA-Z0-9_-]{3,16}$/.test(alias))
        return fail(
          422,
          "invalid_alias",
          "3-16 characters: letters, numbers, - and _",
          "alias"
        )
      if (aliasTaken(alias))
        return fail(409, "alias_taken", "That alias is already taken", "alias")
      const domain = body.domain ? String(body.domain) : null
      if (
        domain &&
        !s.domains.some((d) => d.fqdn === domain && d.status === "active")
      )
        return fail(
          422,
          "domain_not_active",
          "That domain isn't active",
          "domain"
        )
      const geo = normalizeGeoRules(body.geo_rules)
      if ("err" in geo) return geo.err
      const meta = normalizeMetaTags(body.meta_tags)
      if ("err" in meta) return meta.err
      // Flag-gated + verified-account only (403 with a clear message —
      // the field rides a shared endpoint, nothing to hide). PR #231.
      if (meta.ok !== null && !s.verified)
        return fail(403, "forbidden", "meta_tags requires a verified account")
      const link: MockLink = {
        id: `url_${slug()}`,
        alias,
        long_url: longUrl,
        domain,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        expire_after:
          typeof body.expire_after === "number" ? body.expire_after : null,
        max_clicks:
          typeof body.max_clicks === "number" ? body.max_clicks : null,
        password_set:
          typeof body.password === "string" && body.password.length > 0,
        password:
          typeof body.password === "string" && body.password.length > 0
            ? String(body.password)
            : null,
        private_stats: Boolean(body.private_stats),
        block_bots: Boolean(body.block_bots),
        total_clicks: 0,
        last_click: null,
        geo_rules: geo.ok,
        ab_variants: parseVariants(body.ab_variants),
        meta_tags: meta.ok,
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
        // UrlResponse echoes the normalized map (or null) — PR #230.
        geo_rules: link.geo_rules,
        // UrlResponse echoes the full object with explicit nulls — PR #231.
        meta_tags: link.meta_tags,
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
              (l) => l.status.toLowerCase() === String(f.status).toLowerCase()
            )
          if (typeof f.passwordSet === "boolean")
            items = items.filter((l) => l.password_set === f.passwordSet)
          if (typeof f.maxClicksSet === "boolean")
            items = items.filter(
              (l) => (l.max_clicks !== null) === f.maxClicksSet
            )
          if (f.createdAfter)
            items = items.filter((l) => l.created_at >= String(f.createdAfter))
          if (f.createdBefore)
            items = items.filter((l) => l.created_at <= String(f.createdBefore))
          if (f.search) {
            const q = String(f.search).toLowerCase()
            items = items.filter(
              (l) =>
                l.alias.toLowerCase().includes(q) ||
                l.long_url.toLowerCase().includes(q)
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
      const dir = ["asc", "1"].includes(params.get("sortOrder") ?? "desc")
        ? 1
        : -1
      items.sort((a, b) => {
        const av = a[sortBy] ?? ""
        const bv = b[sortBy] ?? ""
        return av === bv ? 0 : av > bv ? dir : -dir
      })
      const page = Math.max(1, Number(params.get("page") ?? 1))
      const pageSize = Math.min(
        100,
        Math.max(1, Number(params.get("pageSize") ?? 20))
      )
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
        return fail(
          422,
          "invalid_status",
          "status must be ACTIVE or INACTIVE",
          "status"
        )
      link.status = next as MockLink["status"]
      return json(linkItem(link))
    }
    if (req.method === "PATCH") {
      // Alias `url` accepted; null = keep; only a CHANGED value revalidates
      // (services/url_service.py _handle_long_url).
      const rawLong = body.long_url !== undefined ? body.long_url : body.url
      if (
        rawLong !== undefined &&
        rawLong !== null &&
        rawLong !== link.long_url
      ) {
        const longUrlErr = longUrlFail(rawLong, false)
        if (longUrlErr) return longUrlErr
        link.long_url = String(rawLong)
      }
      if (typeof body.alias === "string" && body.alias !== link.alias) {
        if (!/^[a-zA-Z0-9_-]{3,16}$/.test(body.alias))
          return fail(
            422,
            "invalid_alias",
            "3-16 characters: letters, numbers, - and _",
            "alias"
          )
        if (aliasTaken(body.alias))
          return fail(
            409,
            "alias_taken",
            "That alias is already taken",
            "alias"
          )
        link.alias = body.alias
      }
      if ("password" in body) {
        link.password_set =
          typeof body.password === "string" && body.password.length > 0
        link.password = link.password_set ? String(body.password) : null
      }
      if ("max_clicks" in body)
        link.max_clicks =
          body.max_clicks === null || body.max_clicks === 0
            ? null
            : Number(body.max_clicks)
      if ("expire_after" in body)
        link.expire_after =
          body.expire_after === null ? null : Number(body.expire_after)
      if ("private_stats" in body)
        link.private_stats = Boolean(body.private_stats)
      if ("block_bots" in body) link.block_bots = Boolean(body.block_bots)
      if ("domain" in body)
        link.domain = body.domain === null ? null : String(body.domain)
      if ("geo_rules" in body) {
        // PR #230 PATCH semantics: null/{} clears, a map replaces in full.
        const geo = normalizeGeoRules(body.geo_rules)
        if ("err" in geo) return geo.err
        link.geo_rules = geo.ok
      }
      if ("ab_variants" in body)
        link.ab_variants =
          body.ab_variants === null ? null : parseVariants(body.ab_variants)
      if ("meta_tags" in body) {
        // PR #231 PATCH semantics: null clears (never gated), an object
        // replaces in full (gated: verified account + flag).
        const meta = normalizeMetaTags(body.meta_tags)
        if ("err" in meta) return meta.err
        if (meta.ok !== null && !s.verified)
          return fail(403, "forbidden", "meta_tags requires a verified account")
        link.meta_tags = meta.ok
      }
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
    const groupBy = (params.get("group_by")?.split(",") ?? [
      "time",
    ]) as StatsDimension[]
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
    // Link scoping arrives via filters.short_code (real-API semantics);
    // the bare short_code param is single-value anon scope there.
    const shortCodes =
      (filters?.short_code as string[] | undefined) ??
      params.get("short_code")?.split(",").filter(Boolean) ??
      null
    if (filters?.short_code) delete filters.short_code
    for (const dim of [
      "browser",
      "os",
      "country",
      "city",
      "referrer",
    ] as const) {
      const v = params.get(dim)
      if (v) filters = { ...filters, [dim]: v.split(",") }
    }
    return json(
      generateStats(s.links, { startMs, endMs, shortCodes, filters, groupBy })
    )
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
  if (route === "GET /v1/keys") return json({ keys: s.keys.map(keyToWire) })
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
  if (
    path[0] === "v1" &&
    path[1] === "keys" &&
    path[2] &&
    req.method === "DELETE"
  ) {
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
      return fail(
        409,
        "domain_exists",
        "That domain is already registered",
        "fqdn"
      )
    // Same two records the real backend stamps at create: the routing CNAME
    // plus Cloudflare's ownership TXT. Purposes are the backend's strings.
    const dom: MockDomain = {
      id: `dom_${slug()}`,
      fqdn,
      status: "pending",
      verification_method: "cf_http_dcv",
      created_at: new Date().toISOString(),
      last_verified_at: null,
      last_verification_error: null,
      root_redirect: null,
      not_found_redirect: null,
      custom_robots_txt: null,
      dns_records: [
        {
          type: "CNAME",
          name: fqdn,
          value: "customers.spoo.me",
          purpose: "routes traffic to spoo.me",
        },
        {
          type: "TXT",
          name: `_cf-custom-hostname.${fqdn}`,
          value: crypto.randomUUID(),
          purpose: "proves domain ownership",
        },
      ],
      setup_notes: [],
    }
    s.domains.unshift(dom)
    return json(dom, { status: 201 })
  }
  if (path[0] === "v1" && path[1] === "custom-domains" && path[2]) {
    const dom = s.domains.find((d) => d.id === path[2])
    if (!dom) return fail(404, "not_found", "No such domain")
    if (req.method === "GET") return json(dom)
    if (req.method === "POST" && path[3] === "verify") {
      // Real state machine: verify goes PENDING → ACTIVE in one hop (the
      // backend never emits VERIFYING). Re-verifying ACTIVE just bumps
      // last_verified_at, mirroring the idempotent self-loop.
      if (dom.status === "pending" || dom.status === "active") {
        dom.status = "active"
        dom.last_verified_at = new Date().toISOString()
        dom.last_verification_error = null
      }
      return json(dom)
    }
    if (req.method === "PATCH") {
      if ("root_redirect" in body)
        dom.root_redirect =
          body.root_redirect === null ? null : String(body.root_redirect)
      if ("not_found_redirect" in body)
        dom.not_found_redirect =
          body.not_found_redirect === null
            ? null
            : String(body.not_found_redirect)
      if ("custom_robots_txt" in body)
        dom.custom_robots_txt =
          body.custom_robots_txt === null
            ? null
            : String(body.custom_robots_txt)
      return json(dom)
    }
    if (req.method === "DELETE") {
      // Real revoke returns a receipt, not the domain doc.
      dom.status = "revoked"
      const cascade = params.get("cascade") === "true"
      let urlsDeleted = 0
      if (cascade) {
        const before = s.links.length
        s.links = s.links.filter((l) => l.domain !== dom.fqdn)
        urlsDeleted = before - s.links.length
      }
      return json({
        id: dom.id,
        fqdn: dom.fqdn,
        cascade,
        urls_deleted: urlsDeleted,
      })
    }
  }

  /* ---------- connected apps (device grants) ---------- */
  if (route === "GET /v1/apps") return json({ items: s.grants })

  /* ---------- per-user page layouts (sparse overrides; absent = default) ---------- */
  /* ---------- feature availability: the walkthrough shows everything ---------- */
  if (
    path[0] === "v1" &&
    path[1] === "me" &&
    path[2] === "features" &&
    req.method === "GET"
  ) {
    return json({
      features: {
        custom_domains: "enabled",
        geo_targeting: "enabled",
        custom_meta_tags: "enabled",
        ab_testing: "enabled",
      },
    })
  }

  if (
    path[0] === "v1" &&
    path[1] === "me" &&
    path[2] === "layouts" &&
    path[3]
  ) {
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

  /* ---------- oauth provider management (fixed paths first, like the
     real router: /oauth/providers must not be captured by /{provider}) --- */

  // DELETE /oauth/providers/{name}/unlink — real errors byte-for-byte:
  // 400 when it's the only auth method, 404 when not linked. pfp survives
  // an unlink (the real service only $pulls the provider entry).
  if (
    path[0] === "oauth" &&
    path[1] === "providers" &&
    path[2] &&
    path[3] === "unlink" &&
    req.method === "DELETE"
  ) {
    const s = state()
    const name = path[2]
    const remaining = s.providers.filter((p) => p.provider !== name)
    if (!s.passwordSet && remaining.length === 0)
      return fail(
        400,
        "validation_error",
        "cannot unlink last authentication method"
      )
    if (remaining.length === s.providers.length)
      return fail(404, "not_found", "provider not found or already unlinked")
    s.providers = remaining
    return json({ success: true, message: `${name} unlinked successfully` })
  }

  // GET /oauth/{provider}/link — the real route 302s to the provider's
  // consent screen and its callback lands on the app. The mock collapses
  // the round trip: link instantly, bounce back to settings.
  if (
    path[0] === "oauth" &&
    path[1] &&
    path[2] === "link" &&
    req.method === "GET"
  ) {
    const s = state()
    const name = path[1] as MockState["providers"][number]["provider"]
    if (!["google", "github", "discord"].includes(name))
      return fail(404, "not_found", `'${name}' OAuth not configured`)
    if (!s.providers.some((p) => p.provider === name)) {
      s.providers.push({
        provider: name,
        email: name === "google" ? "you@gmail.com" : `you@${name}.dev`,
        linked_at: new Date().toISOString(),
        picture: `/api/mock/avatar/${name}`,
      })
    }
    return NextResponse.redirect(new URL("/dashboard/settings", req.url), {
      status: 302,
    })
  }

  /* ---------- profile pictures (real path: /dashboard/profile-pictures) -- */

  if (path[0] === "dashboard" && path[1] === "profile-pictures") {
    const s = state()
    if (req.method === "GET") {
      return json({
        pictures: s.providers
          .filter((p) => p.picture)
          .map((p) => ({
            id: `${p.provider}_mock_${p.provider}_uid`,
            url: p.picture!,
            source: p.provider,
            is_current: s.pfp?.url === p.picture,
          })),
      })
    }
    if (req.method === "POST") {
      const id = String(body.picture_id ?? "")
      const match = s.providers.find(
        (p) => p.picture && id.startsWith(`${p.provider}_`)
      )
      if (!match) return fail(404, "not_found", "picture not found")
      s.pfp = { url: match.picture!, source: match.provider }
      return json({ message: "Profile picture updated successfully" })
    }
  }

  // GET /api/mock/avatar/{provider} — generated stand-in for the distinct
  // pfp each provider would serve (direct path, no rewrite involved).
  if (path[0] === "avatar" && path[1]) {
    const hues: Record<string, string> = {
      github: "#24292f",
      google: "#886ee7",
      discord: "#5865f2",
    }
    const fill = hues[path[1]] ?? "#71717a"
    const letter = path[1].charAt(0).toUpperCase()
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${fill}"/><text x="32" y="41" text-anchor="middle" font-family="ui-monospace,monospace" font-size="28" fill="#fafafa">${letter}</text></svg>`
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    })
  }

  /* ---------- oauth sign-in: one hop, straight back signed-in ---------- */
  if (path[0] === "oauth") {
    const provider = (path[1] ??
      "github") as MockState["providers"][number]["provider"]
    g.__spooMock = {
      ...initial(),
      email: `you@${path[1] ?? "oauth"}.dev`,
      passwordSet: false, // pure OAuth account until they set one
      providers: [
        {
          provider,
          email: `you@${path[1] ?? "oauth"}.dev`,
          linked_at: new Date().toISOString(),
          picture: `/api/mock/avatar/${provider}`,
        },
      ],
      pfp: { url: `/api/mock/avatar/${provider}`, source: provider },
    }
    return withSession(
      NextResponse.redirect(new URL("/onboarding", req.url), { status: 302 })
    )
  }

  return fail(404, "mock_unimplemented", `No mock for ${route}`)
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return handle(req, (await ctx.params).path)
}
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return handle(req, (await ctx.params).path)
}
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return handle(req, (await ctx.params).path)
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return handle(req, (await ctx.params).path)
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return handle(req, (await ctx.params).path)
}
