import fs from "node:fs"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { getAlpha2Codes } from "i18n-iso-countries"

import { LONG_URL_MAX_LENGTH, validDestinationUrl } from "@/lib/validation"
import { handlePublicStats } from "./public"
import { handlePublicPreview } from "./public-preview"
import { handleContact, handleReports } from "./reports"
import { handleWebhooks } from "./webhooks"
import {
  buildDomains,
  buildGrants,
  buildKeys,
  buildLinks,
  buildWebhookDeliveries,
  buildWebhooks,
  generateStats,
  type MockDomain,
  type MockKey,
  type MockDelivery,
  type MockLink,
  type MockWebhook,
  type StatsDimension,
  buildTags,
  type MockTag,
} from "./seed"
import { TAG_ICON_KEYS } from "@/lib/api/tags"

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
    /** Picture URL the provider gave us (feeds /api/v1/me/profile-pictures). */
    picture: string | null
  }>
  /** Active profile picture — mirrors UserPfp on the session. */
  pfp: { url: string; source: string } | null
  onboarding: {
    step: string | null
    path: "links" | "api" | null
  }
  onboardedAt: string | null
  /** ISO purge deadline while a deletion is scheduled; null = active. */
  pendingDeletion: string | null
  links: MockLink[]
  tags: MockTag[]
  domains: MockDomain[]
  keys: MockKey[]
  webhooks: MockWebhook[]
  webhookDeliveries: MockDelivery[]
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
  userName: "zingzy",
  verified: true,
  passwordSet: true,
  pendingDeletion: null,
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
  // Seeded to a provider picture so remove-to-initials, the current-pick
  // ring, and re-choosing are all exercisable without setup.
  pfp: { url: "/api/mock/avatar/github", source: "github" },
  onboarding: { step: null, path: null },
  onboardedAt: null,
  links: buildLinks(),
  tags: buildTags(),
  domains: buildDomains(),
  keys: buildKeys(),
  webhooks: buildWebhooks(),
  webhookDeliveries: buildWebhookDeliveries(),
  grants: buildGrants(),
  layouts: readLayoutsFile(),
})

// Survives HMR within one dev-server process.
const g = globalThis as typeof globalThis & { __spooMock?: MockState }
g.__spooMock ??= initial()
const state = () => g.__spooMock!

const EXTRA_TAKEN = new Set(["spring", "ga"])

/** Hostnames the natural-key read resolves to default-domain links, on top
    of whatever host the dev server answers on (mirrors the backend, where
    every system-domain hostname resolves the default domain). */
const SYSTEM_HOSTS = new Set(["spoo.me", "www.spoo.me", "beta.spoo.me"])

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

/** The backend derives SCHEDULED from a future starts_at on an ACTIVE
    link; the stored status never changes. Mirror that here. */
function effectiveStatus(l: MockLink): MockLink["status"] | "SCHEDULED" {
  if (
    l.status === "ACTIVE" &&
    l.starts_at !== null &&
    l.starts_at > Math.floor(Date.now() / 1000)
  )
    return "SCHEDULED"
  return l.status
}

function linkItem(l: MockLink) {
  return {
    id: l.id,
    alias: l.alias,
    long_url: l.long_url,
    status: effectiveStatus(l),
    created_at: l.created_at,
    expire_after: l.expire_after,
    starts_at: l.starts_at,
    pre_start_url: l.pre_start_url,
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
    tags: l.tag_ids
      .map((id) => state().tags.find((t) => t.id === id))
      .filter((t): t is MockTag => !!t)
      .map(tagRef),
  }
}

function tagRef(t: MockTag) {
  return { id: t.id, name: t.name, color: t.color, icon: t.icon }
}

function tagItem(t: MockTag) {
  return {
    ...tagRef(t),
    link_count: state().links.filter((l) => l.tag_ids.includes(t.id)).length,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }
}

/* Tag names mirror shared/tags.py: trim, lowercase, collapse whitespace,
   letters/digits/marks plus space - _ . only, ≤ 32 chars. Tag ids on a link
   mirror the DTO: 24-hex, deduped, at most 10 (422), and every id must be
   one of the account's tags (400, like the service). */
const TAG_ALLOWED = /^[\p{L}\p{N}\p{M} ._-]+$/u
const TAG_COLORS = new Set([
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
])
function normalizeTagName(v: unknown): string | null {
  if (typeof v !== "string") return null
  const name = v
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
  if (!name || Array.from(name).length > 32 || !TAG_ALLOWED.test(name))
    return null
  return name
}
type TagsResult = { ok: string[] } | { err: NextResponse }
function normalizeTagIds(v: unknown, field = "tag_ids"): TagsResult {
  if (v === null || v === undefined) return { ok: [] }
  if (!Array.isArray(v))
    return {
      err: fail(
        422,
        "validation_error",
        `${field}: Input should be a valid list`,
        field
      ),
    }
  const out: string[] = []
  for (const raw of v) {
    if (typeof raw !== "string" || !/^[0-9a-f]{24}$|^tag_\w+$/.test(raw))
      return {
        err: fail(422, "validation_error", `'${raw}' is not a valid id`, field),
      }
    if (!out.includes(raw)) out.push(raw)
  }
  if (out.length > 10)
    return {
      err: fail(422, "validation_error", "at most 10 tags per link", field),
    }
  return { ok: out }
}
function assertOwnedTagIds(
  ids: string[],
  field = "tag_ids"
): NextResponse | null {
  const known = new Set(state().tags.map((t) => t.id))
  const missing = ids.filter((id) => !known.has(id))
  return missing.length
    ? fail(
        400,
        "validation_error",
        `unknown tag ids: ${missing.join(", ")}`,
        field
      )
    : null
}
function pickAutoColor(): string {
  const used = new Map<string, number>()
  for (const t of state().tags) used.set(t.color, (used.get(t.color) ?? 0) + 1)
  return (
    [...TAG_COLORS]
      .filter((c) => c !== "gray")
      .sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0] ?? "violet"
  )
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

/** Profile-picture upload cap — same R2_UPLOAD_MAX_BYTES as og:images. */
const PFP_UPLOAD_MAX_BYTES = 512_000
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
    html_title: title,
    html_description: description,
    favicon: `https://${host}/favicon.ico`,
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
const gm = globalThis as typeof globalThis & {
  __spooMetaHits?: number[]
  __spooMetaAnonHits?: number[]
}

function aliasTaken(alias: string) {
  const a = alias.toLowerCase()
  return (
    EXTRA_TAKEN.has(a) || state().links.some((l) => l.alias.toLowerCase() === a)
  )
}

/* ------------------------------------------------------------------ *
 * Emoji alias policy — DEV-ONLY coarse approximation.
 * The authoritative validator is shared/emoji_policy.py; this mirror only
 * needs to exercise the four emoji reasons on :3001, nothing more.
 * ------------------------------------------------------------------ */
const RESERVED_ALIASES = new Set([
  "api",
  "app",
  "admin",
  "dashboard",
  "login",
  "logout",
  "signup",
  "stats",
  "docs",
  "help",
  "about",
  "contact",
  "www",
  "spoo",
  "me",
])

function graphemesOf(s: string): string[] {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" })
  const out: string[] = []
  for (const { segment } of seg.segment(s)) out.push(segment)
  return out
}

/** Canonicalize like the client/backend before the membership check: drop
    VS16 and a trailing skin-tone modifier. */
function canonicalBase(g: string): string {
  let out = ""
  for (const ch of g) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp === 0xfe0f) continue // VS16
    if (cp >= 0x1f3fb && cp <= 0x1f3ff) continue // skin-tone modifier
    out += ch
  }
  return out
}

let _mockAccepted: Set<string> | null = null
function mockAcceptedSet(): Set<string> {
  if (!_mockAccepted) _mockAccepted = new Set(MOCK_EMOJI.map((e) => e.c))
  return _mockAccepted
}

/** Membership mirror of the real accept rule: a grapheme is accepted iff its
    canonical base is in the served set. This is faithful to the emoji-set
    endpoint (same source), so e.g. a VS16 text-style heart (not in the set) is
    rejected while a skin-toned base emoji is accepted. */
function emojiPolicyOk(alias: string): boolean {
  const accepted = mockAcceptedSet()
  for (const g of graphemesOf(alias)) {
    if (!accepted.has(canonicalBase(g))) return false
  }
  return true
}

type AliasVerdict = { available: boolean; reason: string | null }

function checkAliasVerdict(alias: string): AliasVerdict {
  if (!alias) return { available: false, reason: "format" }
  const isEmoji = /[^A-Za-z0-9_-]/.test(alias)
  if (!isEmoji) {
    if (alias.length < 3 || alias.length > 16)
      return { available: false, reason: "length" }
    if (RESERVED_ALIASES.has(alias.toLowerCase()))
      return { available: false, reason: "reserved" }
    return aliasTaken(alias)
      ? { available: false, reason: "taken" }
      : { available: true, reason: null }
  }
  const graphemes = graphemesOf(alias)
  // Mixed = a bare alnum grapheme sitting alongside emoji ("abc😀"). A keycap
  // ("1️⃣") is NOT bare alnum — it carries combiners — so it falls through to
  // the policy check and reports emoji_policy, matching the real backend.
  if (graphemes.some((g) => /^[A-Za-z0-9_-]+$/.test(g)))
    return { available: false, reason: "format" }
  if (graphemes.length > 15) return { available: false, reason: "length" }
  if (!emojiPolicyOk(alias)) return { available: false, reason: "emoji_policy" }
  return aliasTaken(alias)
    ? { available: false, reason: "taken" }
    : { available: true, reason: null }
}

function aliasFail(reason: string) {
  switch (reason) {
    case "taken":
      return fail(409, "alias_taken", "That alias is already taken", "alias")
    case "reserved":
      return fail(400, "invalid_alias", "That alias is reserved", "alias")
    case "emoji_policy":
      return fail(
        400,
        "invalid_alias",
        "Some of those emoji aren't accepted",
        "alias"
      )
    case "length":
      return fail(422, "invalid_alias", "Alias length is out of range", "alias")
    default:
      return fail(
        422,
        "invalid_alias",
        "Letters, numbers, - and _, or emoji. Not both.",
        "alias"
      )
  }
}

/** A small but real accepted set for GET /v1/emoji-set. `gen` marks the
    auto-gen subset; `g` categorizes for the picker's bonus tabs. */
const MOCK_EMOJI: Array<{ c: string; n: string; gen: boolean; g: string }> = [
  { c: "😀", n: "grinning face", gen: true, g: "smileys" },
  { c: "😃", n: "grinning face with big eyes", gen: true, g: "smileys" },
  { c: "😄", n: "grinning face with smiling eyes", gen: true, g: "smileys" },
  { c: "😁", n: "beaming face", gen: true, g: "smileys" },
  { c: "😆", n: "grinning squinting face", gen: false, g: "smileys" },
  { c: "😅", n: "grinning face with sweat", gen: true, g: "smileys" },
  { c: "😂", n: "face with tears of joy", gen: true, g: "smileys" },
  { c: "🙂", n: "slightly smiling face", gen: true, g: "smileys" },
  { c: "😊", n: "smiling face with smiling eyes", gen: true, g: "smileys" },
  { c: "😍", n: "smiling face with heart eyes", gen: true, g: "smileys" },
  { c: "😘", n: "face blowing a kiss", gen: false, g: "smileys" },
  { c: "😎", n: "smiling face with sunglasses", gen: true, g: "smileys" },
  { c: "🤩", n: "star struck", gen: true, g: "smileys" },
  { c: "🥳", n: "partying face", gen: true, g: "smileys" },
  { c: "🤔", n: "thinking face", gen: false, g: "smileys" },
  { c: "🤗", n: "hugging face", gen: false, g: "smileys" },
  { c: "😴", n: "sleeping face", gen: false, g: "smileys" },
  { c: "🤯", n: "exploding head", gen: false, g: "smileys" },
  { c: "🐶", n: "dog face", gen: true, g: "animals" },
  { c: "🐱", n: "cat face", gen: true, g: "animals" },
  { c: "🐭", n: "mouse face", gen: false, g: "animals" },
  { c: "🐹", n: "hamster", gen: false, g: "animals" },
  { c: "🐰", n: "rabbit face", gen: true, g: "animals" },
  { c: "🦊", n: "fox", gen: true, g: "animals" },
  { c: "🐻", n: "bear", gen: true, g: "animals" },
  { c: "🐼", n: "panda", gen: true, g: "animals" },
  { c: "🐨", n: "koala", gen: true, g: "animals" },
  { c: "🐯", n: "tiger face", gen: true, g: "animals" },
  { c: "🦁", n: "lion", gen: true, g: "animals" },
  { c: "🐮", n: "cow face", gen: false, g: "animals" },
  { c: "🐷", n: "pig face", gen: false, g: "animals" },
  { c: "🐸", n: "frog", gen: true, g: "animals" },
  { c: "🐵", n: "monkey face", gen: false, g: "animals" },
  { c: "🐔", n: "chicken", gen: false, g: "animals" },
  { c: "🐧", n: "penguin", gen: true, g: "animals" },
  { c: "🦄", n: "unicorn", gen: true, g: "animals" },
  { c: "🐝", n: "honeybee", gen: false, g: "animals" },
  { c: "🐢", n: "turtle", gen: true, g: "animals" },
  { c: "🐬", n: "dolphin", gen: true, g: "animals" },
  { c: "🐳", n: "spouting whale", gen: true, g: "animals" },
  { c: "🐙", n: "octopus", gen: true, g: "animals" },
  { c: "🍎", n: "red apple", gen: true, g: "food" },
  { c: "🍊", n: "tangerine orange", gen: true, g: "food" },
  { c: "🍋", n: "lemon", gen: true, g: "food" },
  { c: "🍌", n: "banana", gen: true, g: "food" },
  { c: "🍉", n: "watermelon", gen: true, g: "food" },
  { c: "🍇", n: "grapes", gen: true, g: "food" },
  { c: "🍓", n: "strawberry", gen: true, g: "food" },
  { c: "🍒", n: "cherries", gen: true, g: "food" },
  { c: "🍑", n: "peach", gen: false, g: "food" },
  { c: "🥝", n: "kiwi fruit", gen: false, g: "food" },
  { c: "🍔", n: "hamburger", gen: true, g: "food" },
  { c: "🍕", n: "pizza", gen: true, g: "food" },
  { c: "🌮", n: "taco", gen: true, g: "food" },
  { c: "🍿", n: "popcorn", gen: true, g: "food" },
  { c: "🍩", n: "doughnut", gen: true, g: "food" },
  { c: "🍪", n: "cookie", gen: true, g: "food" },
  { c: "🍰", n: "shortcake slice", gen: true, g: "food" },
  { c: "🌞", n: "sun with face", gen: true, g: "nature" },
  { c: "🌈", n: "rainbow", gen: true, g: "nature" },
  { c: "🌸", n: "cherry blossom", gen: true, g: "nature" },
  { c: "🌻", n: "sunflower", gen: true, g: "nature" },
  { c: "🌵", n: "cactus", gen: true, g: "nature" },
  { c: "🌴", n: "palm tree", gen: true, g: "nature" },
  { c: "🍀", n: "four leaf clover", gen: true, g: "nature" },
  { c: "🌊", n: "water wave", gen: true, g: "nature" },
  { c: "🔥", n: "fire flame", gen: true, g: "nature" },
  { c: "🎈", n: "balloon", gen: true, g: "objects" },
  { c: "🎁", n: "wrapped gift present", gen: true, g: "objects" },
  { c: "🎉", n: "party popper", gen: true, g: "objects" },
  { c: "🚀", n: "rocket", gen: true, g: "objects" },
  { c: "🎸", n: "guitar", gen: true, g: "objects" },
  { c: "🎨", n: "artist palette paint", gen: true, g: "objects" },
  { c: "💎", n: "gem stone diamond", gen: true, g: "objects" },
  { c: "🔑", n: "key", gen: true, g: "objects" },
  { c: "🎯", n: "bullseye direct hit target", gen: true, g: "objects" },
  { c: "⚽", n: "soccer football", gen: false, g: "objects" },
  { c: "🧩", n: "puzzle piece", gen: false, g: "objects" },
  { c: "📚", n: "books", gen: false, g: "objects" },
  // Skin-tone-capable base emoji: their base must be in the set so a toned
  // grapheme (e.g. 👍🏽) canonicalizes to an accepted base and is NOT flagged.
  { c: "👍", n: "thumbs up", gen: false, g: "people" },
  { c: "👋", n: "waving hand", gen: false, g: "people" },
  { c: "🙌", n: "raising hands", gen: false, g: "people" },
  { c: "👏", n: "clapping hands", gen: false, g: "people" },
  { c: "🙏", n: "folded hands please thanks", gen: false, g: "people" },
]

function pickEmojiAlias(n = 3): string {
  const gen = MOCK_EMOJI.filter((e) => e.gen)
  let out = ""
  for (let i = 0; i < n; i++)
    out += gen[Math.floor(Math.random() * gen.length)].c
  return out
}

async function handle(req: NextRequest, path: string[]) {
  if (!MOCK)
    return fail(404, "mock_disabled", "Mock API is disabled (set SPOO_MOCK=1)")

  const route = `${req.method} /${path.join("/")}`
  // DELETE /v1/me carries the re-auth proof in its body, so DELETE parses too.
  const hasBody =
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH" ||
    req.method === "DELETE"
  // Most of the backend speaks JSON; /auth/device/revoke also accepts a
  // legacy Form-encoded body (app_id only).
  const isForm = (req.headers.get("content-type") ?? "").includes(
    "application/x-www-form-urlencoded"
  )
  const body: Record<string, unknown> = hasBody
    ? isForm
      ? Object.fromEntries(new URLSearchParams(await req.text()))
      : await req.json().catch(() => ({}))
    : {}
  const params = req.nextUrl.searchParams

  // Latency theater — enough to exercise loading states, not annoy.
  await sleep(200 + Math.random() * 250)

  const s = state()

  if (path[0] === "v1" && path[1] === "webhooks") {
    const res = handleWebhooks(req, path, body, params, s)
    if (res) return res
  }

  switch (route) {
    /* ---------- anonymous shorten (legacy POST / on the backend) ---------- */
    case "POST /shorten": {
      const alias = String(body.alias ?? "").trim()
      if (alias === "taken")
        return fail(409, "alias_taken", "That alias is already taken.")
      const code =
        alias ||
        Math.random()
          .toString(36)
          .slice(2, 7)
          .replace(/[01lo]/g, "x")
      return json({ short_url: `https://spoo.me/${code}` })
    }

    /* ---------- housekeeping ---------- */
    case "GET /reset": {
      try {
        fs.rmSync(LAYOUTS_FILE, { force: true })
      } catch {
        /* best effort */
      }
      // ?mode=fresh = a brand-new account with zero data everywhere, but
      // onboarding done so the dashboard renders (empty-state testing).
      // ?mode=unverified = onboarded_at set but the email never verified.
      // Exercises the gate ordering in app/onboarding/layout.tsx: this state
      // must land on /onboarding/verify, not bounce between the gates.
      const mode = params.get("mode")
      const fresh = mode === "fresh"
      const ONBOARDED_AT = "2026-05-14T00:12:18+00:00"
      g.__spooMock = fresh
        ? {
            ...initial(),
            onboardedAt: ONBOARDED_AT,
            links: [],
            tags: [],
            domains: [],
            keys: [],
            webhooks: [],
            webhookDeliveries: [],
            grants: [],
            providers: [],
            pfp: null,
          }
        : mode === "unverified"
          ? {
              ...initial(),
              verified: false,
              onboardedAt: ONBOARDED_AT,
            }
          : initial()
      return json({
        success: true,
        note: fresh
          ? "mock reset (fresh account)"
          : mode === "unverified"
            ? "mock reset (onboarded but unverified email)"
            : "mock state reset",
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
        tags: [],
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
      // Mirrors the real gate: a pending-deletion account cannot mint tokens.
      if (s.pendingDeletion)
        return fail(
          403,
          "account_pending_deletion",
          "This account is scheduled for deletion"
        )
      // Adopt the email but keep the workspace: re-seeding here would undo
      // whatever /reset?mode=... just set up. Signup owns the new-account state.
      s.email = String(body.email ?? "you@example.com")
      return withSession(json({ access_token: "mock_access", user: user() }))
    }
    case "POST /auth/logout":
      return clearSession(json({ success: true }))
    case "GET /auth/me": {
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "not_authenticated", "Not signed in")
      return json({ user: user() })
    }
    case "PATCH /auth/me": {
      // UpdateProfileRequest: user_name is required but nullable — an
      // explicit null clears, an accidental {} must 422 (pydantic).
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "not_authenticated", "Not signed in")
      if (!("user_name" in body))
        return fail(
          422,
          "validation_error",
          "user_name: Field required",
          "user_name"
        )
      const raw = (body as Record<string, unknown>).user_name
      if (raw !== null) {
        if (typeof raw !== "string")
          return fail(
            422,
            "validation_error",
            "user_name: Input should be a valid string",
            "user_name"
          )
        if (raw.length < 1)
          return fail(
            422,
            "validation_error",
            "user_name: String should have at least 1 character",
            "user_name"
          )
        if (raw.length > 255)
          return fail(
            422,
            "validation_error",
            "user_name: String should have at most 255 characters",
            "user_name"
          )
      }
      // Same normalization as register: strip; whitespace-only clears.
      s.userName = raw === null ? null : String(raw).trim() || null
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
    case "DELETE /v1/me": {
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "not_authenticated", "Not signed in")
      if (s.pendingDeletion)
        return fail(409, "conflict", "Deletion is already scheduled")
      // Re-auth: password accounts prove with the password (literal "wrong"
      // rehearses the failure path), OAuth-only accounts type their email.
      if (s.passwordSet) {
        const pw = String(body.password ?? "")
        if (!pw || pw === "wrong")
          return fail(403, "forbidden", "re-authentication failed")
      } else if (String(body.confirm_email ?? "") !== s.email) {
        return fail(403, "forbidden", "re-authentication failed")
      }
      s.pendingDeletion = new Date(Date.now() + 7 * 86_400_000).toISOString()
      return json({ purge_after: s.pendingDeletion })
    }
    case "POST /auth/restore": {
      // One-shot token path ("restore-me" is the rehearsal token) or the
      // credential path; both collapse to one uniform 403 on any failure.
      const ok =
        s.pendingDeletion &&
        (String(body.restore_token ?? "") === "restore-me" ||
          (String(body.email ?? "") === s.email &&
            String(body.password ?? "").length > 0 &&
            String(body.password ?? "") !== "wrong"))
      if (!ok) return fail(403, "forbidden", "unable to restore account")
      s.pendingDeletion = null
      return json({ message: "account restored" })
    }
    case "POST /auth/device/revoke": {
      // Real wire (routes/auth/device.py): JSON {grant_id} and/or {app_id}
      // (Form-encoded app_id still accepted for the legacy dashboard),
      // CSRF-guarded by the exact header value X-Requested-With: fetch.
      if (req.headers.get("x-requested-with") !== "fetch")
        return json(
          { error: "invalid request", code: "forbidden" },
          { status: 403 }
        )
      const appId = String(body.app_id ?? "").trim()
      const grantId = String(body.grant_id ?? "").trim()
      if (!appId && !grantId)
        return json(
          { error: "app_id or grant_id is required", code: "validation_error" },
          { status: 400 }
        )
      const before = s.grants.length
      // app_id wins when both are present, mirroring the backend resolver.
      s.grants = s.grants.filter((gr) =>
        appId ? gr.app !== appId : gr.id !== grantId
      )
      if (s.grants.length === before)
        return json(
          { error: "no active grant found", code: "not_found" },
          { status: 404 }
        )
      return json({ success: true, message: "Access revoked" })
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

    /* ---------- destination metadata (prefill + preview checker) ---------- */
    case "GET /v1/metadata": {
      // Auth optional: signed-in callers get 60/min, anonymous 15/min per IP.
      const authed =
        req.cookies.has("access_token") || req.cookies.has("refresh_token")
      const url = params.get("url") ?? ""
      if (!url.startsWith("https://"))
        return fail(400, "validation_error", "url must be https", "url")
      const now = Date.now()
      const bucket = authed ? "__spooMetaHits" : "__spooMetaAnonHits"
      gm[bucket] = (gm[bucket] ?? []).filter((t) => now - t < 60_000)
      if (gm[bucket].length >= (authed ? 60 : 15))
        return fail(429, "rate_limit_exceeded", "Too many requests")
      gm[bucket].push(now)
      return mockMetadata(url)
    }

    /* ---------- redirect-chain expander (/tools/url-expander) ---------- */
    case "GET /v1/expand": {
      const url = params.get("url") ?? ""
      if (!/^https?:\/\//.test(url))
        return fail(400, "validation_error", "url must be http(s)", "url")
      let u: URL
      try {
        u = new URL(url)
      } catch {
        return fail(422, "unfetchable", "that URL can't be expanded")
      }
      const pathLower = u.pathname.toLowerCase()
      if (pathLower.includes("broken"))
        return fail(422, "unfetchable", "that URL can't be expanded")
      if (pathLower.includes("slow"))
        return fail(
          504,
          "upstream_timeout",
          "destination did not respond in time"
        )
      const finalUrl = `https://github.com/spoo-me/spoo`
      const hops = [
        { url, status: 301, https: url.startsWith("https://") },
        {
          url: `http://track.example/r?to=${encodeURIComponent(finalUrl)}`,
          status: 302,
          https: false,
        },
        { url: finalUrl, status: 200, https: true },
      ]
      return json({
        url,
        final_url: finalUrl,
        final_status: 200,
        truncated: false,
        hops,
        blocklist_match: pathLower.includes("blocked"),
        web_risk: pathLower.includes("risky")
          ? { checked: true, threats: ["SOCIAL_ENGINEERING"] }
          : { checked: true, threats: [] },
        fetched_at: new Date().toISOString(),
      })
    }

    /* ---------- domain records (/tools/url-expander panel) ---------- */
    case "GET /v1/domain-intel": {
      const host = (params.get("host") ?? "").toLowerCase()
      if (!host.includes("."))
        return fail(400, "validation_error", "not a valid hostname", "host")
      return json({
        host,
        registrable_domain: host.split(".").slice(-2).join("."),
        dns: {
          a: ["93.184.216.34"],
          aaaa: [],
          mx: [`0 mail.${host}.`],
          ns: [`ns1.${host}.`, `ns2.${host}.`],
          txt: ["v=spf1 -all"],
        },
        whois: {
          registrar: "Example Registrar LLC",
          created: "2019-04-02T00:00:00Z",
          updated: "2025-03-11T00:00:00Z",
          expires: "2027-04-02T00:00:00Z",
          age_days: 2706,
        },
        ssl: {
          issuer: "Let's Encrypt",
          subject: host,
          valid_from: "Jul  1 00:00:00 2026 GMT",
          valid_to: "Sep 29 23:59:59 2026 GMT",
          days_left: 31,
          sans: [host, `www.${host}`],
        },
        fetched_at: new Date().toISOString(),
      })
    }

    /* ---------- shorten ---------- */
    case "GET /v1/shorten/check-alias": {
      const alias = params.get("alias") ?? ""
      return json(checkAliasVerdict(alias))
    }
    case "GET /v1/emoji-set": {
      // Immutable per deploy; the real backend derives this from
      // shared/emoji_policy.generation_pool(). Mock returns a small real set,
      // with canonical CLDR group names so the picker's tab layout is
      // exercised as it is in production.
      const CANON: Record<string, string> = {
        smileys: "Smileys & Emotion",
        people: "People & Body",
        animals: "Animals & Nature",
        food: "Food & Drink",
        nature: "Animals & Nature",
        objects: "Objects",
      }
      return json(
        {
          accept_max_version: 15.1,
          generate_max_version: 12.0,
          max_graphemes: 15,
          emoji: MOCK_EMOJI.map((e) => ({ ...e, g: CANON[e.g] ?? e.g })),
        },
        { headers: { "cache-control": "public, max-age=31536000, immutable" } }
      )
    }
    case "POST /v1/urls/claim": {
      if (!req.cookies.has("access_token") && !req.cookies.has("refresh_token"))
        return fail(401, "unauthorized", "Authentication required")
      const claims = Array.isArray(body.claims) ? body.claims : []
      if (claims.length === 0 || claims.length > 16)
        return fail(
          422,
          "validation_error",
          "claims must contain 1 to 16 items"
        )
      // Mock semantics: well-formed pairs claim; a token ending in "burned"
      // simulates the invalid path for UI testing.
      const results = claims.map((c) => {
        const item = c as { url_id?: unknown; token?: unknown }
        const urlId = String(item.url_id ?? "")
        const token = String(item.token ?? "")
        return {
          url_id: urlId,
          status: token.endsWith("burned") ? "invalid" : "claimed",
        }
      })
      return json({
        results,
        claimed: results.filter((r) => r.status === "claimed").length,
      })
    }

    case "POST /v1/shorten": {
      // The DTO accepts `url` as an alias for `long_url` (first alias wins).
      const rawLong = body.long_url !== undefined ? body.long_url : body.url
      const longUrlErr = longUrlFail(rawLong, true)
      if (longUrlErr) return longUrlErr
      const longUrl = String(rawLong)
      // Emoji or alnum alias accepted; `alias_type: "emoji"` with no alias
      // auto-generates a 3-emoji alias (config emoji_generated_alias_length).
      let alias: string
      if (body.alias) {
        alias = String(body.alias)
        const v = checkAliasVerdict(alias)
        if (!v.available) return aliasFail(v.reason ?? "format")
      } else if (body.alias_type === "emoji") {
        alias = pickEmojiAlias()
      } else {
        alias = slug()
      }
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
      const tags = normalizeTagIds(body.tag_ids)
      if ("err" in tags) return tags.err
      const foreign = assertOwnedTagIds(tags.ok)
      if (foreign) return foreign
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
        starts_at: typeof body.starts_at === "number" ? body.starts_at : null,
        pre_start_url:
          typeof body.pre_start_url === "string" && body.pre_start_url
            ? String(body.pre_start_url)
            : null,
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
        tag_ids: tags.ok,
        weight: 1,
      }
      s.links.unshift(link)
      // Anonymous creates mint a one-time claim token (mirrors the real
      // backend); signed-in creates own the link outright.
      const anonCreate =
        !req.cookies.has("access_token") && !req.cookies.has("refresh_token")
      return json({
        id: link.id,
        alias,
        short_url: `https://${domain ?? "spoo.me"}/${alias}`,
        long_url: longUrl,
        owner_id: anonCreate ? null : "usr_mock_1",
        claim_token: anonCreate ? `mock_claim_${slug()}` : null,
        created_at: Math.floor(Date.now() / 1000),
        status: "active",
        private_stats: link.private_stats,
        // UrlResponse echoes the normalized map (or null) — PR #230.
        geo_rules: link.geo_rules,
        // UrlResponse echoes the full object with explicit nulls — PR #231.
        meta_tags: link.meta_tags,
      })
    }

    /* ---------- abuse-report intake + contact (optional auth) ---------- */
    case "POST /v1/contact":
      return handleContact(body)
    case "POST /v1/reports":
      return handleReports(
        body,
        req.cookies.has("access_token") || req.cookies.has("refresh_token")
      )

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
            tagIds?: string[]
            tagNames?: string[]
            tagsMatch?: string
          }
          if (f.status)
            items = items.filter(
              (l) =>
                effectiveStatus(l).toLowerCase() ===
                String(f.status).toLowerCase()
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
          const wantedIds: string[] = Array.isArray(f.tagIds)
            ? f.tagIds.map(String)
            : []
          if (Array.isArray(f.tagNames) && f.tagNames.length) {
            // Names resolve through the registry; unknown names match nothing.
            const names = f.tagNames.map((n: unknown) => normalizeTagName(n))
            if (names.some((n: string | null) => n === null))
              return fail(
                422,
                "validation_error",
                "invalid tag name",
                "filter.tagNames"
              )
            for (const t of s.tags)
              if (names.includes(t.name) && !wantedIds.includes(t.id))
                wantedIds.push(t.id)
            // A name no tag carries can never be on every link.
            if (
              f.tagsMatch === "all" &&
              names.some(
                (n: string | null) => !s.tags.some((t) => t.name === n)
              )
            )
              items = []
          }
          if (
            wantedIds.length ||
            (Array.isArray(f.tagNames) && f.tagNames.length)
          ) {
            const all = f.tagsMatch === "all"
            items = items.filter((l) =>
              all
                ? wantedIds.length > 0 &&
                  wantedIds.every((t) => l.tag_ids.includes(t))
                : wantedIds.some((t) => l.tag_ids.includes(t))
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

  /* ---------- tags: the per-account registry links point at by id ---------- */
  if (route === "GET /v1/tags") {
    return json({ items: s.tags.map(tagItem) })
  }
  if (route === "POST /v1/tags") {
    const name = normalizeTagName(body.name)
    if (!name)
      return fail(
        422,
        "validation_error",
        "name: letters, digits, spaces, - _ . only",
        "name"
      )
    if (
      body.color !== undefined &&
      body.color !== null &&
      !TAG_COLORS.has(String(body.color))
    )
      return fail(
        422,
        "validation_error",
        "color: unknown palette key",
        "color"
      )
    if (
      body.icon !== undefined &&
      body.icon !== null &&
      body.icon !== "" &&
      !(TAG_ICON_KEYS as readonly string[]).includes(String(body.icon))
    )
      return fail(
        422,
        "validation_error",
        `unknown tag icon '${body.icon}'`,
        "icon"
      )
    if (s.tags.some((t) => t.name === name))
      return fail(409, "conflict", `you already have a tag named '${name}'`)
    if (s.tags.length >= 500)
      return fail(
        400,
        "validation_error",
        "an account can have at most 500 tags",
        "name"
      )
    const tag: MockTag = {
      id: `tag_${slug()}`,
      name,
      color: body.color ? String(body.color) : pickAutoColor(),
      icon: body.icon ? String(body.icon) : "tag",
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    s.tags.push(tag)
    return json(tagItem(tag), { status: 201 })
  }
  if (path[0] === "v1" && path[1] === "tags" && path[2] && !path[3]) {
    const tag = s.tags.find((t) => t.id === path[2])
    if (req.method === "PATCH") {
      if (!tag) return fail(404, "not_found", "Tag not found")
      if ("name" in body && body.name !== null) {
        const name = normalizeTagName(body.name)
        if (!name)
          return fail(
            422,
            "validation_error",
            "name: letters, digits, spaces, - _ . only",
            "name"
          )
        if (s.tags.some((t) => t !== tag && t.name === name))
          return fail(409, "conflict", `you already have a tag named '${name}'`)
        tag.name = name
      }
      if ("color" in body && body.color !== null) {
        if (!TAG_COLORS.has(String(body.color)))
          return fail(
            422,
            "validation_error",
            "color: unknown palette key",
            "color"
          )
        tag.color = String(body.color)
      }
      if ("icon" in body) {
        if (body.icon === null)
          return fail(422, "validation_error", "icon cannot be null", "icon")
        if (!(TAG_ICON_KEYS as readonly string[]).includes(String(body.icon)))
          return fail(
            422,
            "validation_error",
            `unknown tag icon '${body.icon}'`,
            "icon"
          )
        tag.icon = String(body.icon)
      }
      tag.updated_at = new Date().toISOString()
      return json(tagItem(tag))
    }
    if (req.method === "DELETE") {
      if (!tag) return fail(404, "not_found", "Tag not found")
      let links_updated = 0
      for (const l of s.links)
        if (l.tag_ids.includes(tag.id)) {
          l.tag_ids = l.tag_ids.filter((id) => id !== tag.id)
          links_updated += 1
        }
      s.tags = s.tags.filter((t) => t !== tag)
      return json({ deleted: true, links_updated })
    }
  }

  /* ---------- single-resource reads: urls/{id}, urls/{domain}/{alias} ---- */
  if (
    path[0] === "v1" &&
    path[1] === "urls" &&
    path[2] &&
    req.method === "GET"
  ) {
    // Emoji aliases (and dots in domains) arrive percent-encoded.
    const decode = (seg: string) => {
      try {
        return decodeURIComponent(seg)
      } catch {
        return seg
      }
    }
    if (path[3]) {
      // Natural key: the domain segment is explicit. The host serving the
      // dashboard (localhost in dev) and the system domains resolve
      // default-domain links; anything else must match the link's custom
      // domain. Missing or foreign → 404.
      const domain = decode(path[2])
      const alias = decode(path[3])
      const isDefaultDomain =
        domain === req.nextUrl.hostname || SYSTEM_HOSTS.has(domain)
      const link = s.links.find(
        (l) =>
          l.alias === alias &&
          (isDefaultDomain ? l.domain === null : l.domain === domain)
      )
      if (!link) return fail(404, "not_found", "No such URL")
      return json(linkItem(link))
    }
    const link = s.links.find((l) => l.id === decode(path[2]))
    if (!link) return fail(404, "not_found", "No such URL")
    return json(linkItem(link))
  }

  /* ---------- bulk ops: POST /urls/bulk/{delete,status,expiry} ----------
     The batch answers 200 with a summary + one result row per unique id
     (even all-failed). 4xx is envelope rejection where nothing was
     attempted. Blocked links (seed alias "legacy") fail per-item with
     "forbidden" and unknown ids with "not_found" — the two ways to
     exercise the partial-failure path. */
  if (
    path[0] === "v1" &&
    path[1] === "urls" &&
    path[2] === "bulk" &&
    req.method === "POST"
  ) {
    const op = path[3]
    const rawIds = Array.isArray(body.ids) ? (body.ids as unknown[]) : null
    // Envelope shape is DTO-level validation on the real backend, so it
    // answers 422 (not 400) for an empty or over-cap id list.
    if (!rawIds || rawIds.length === 0)
      return fail(
        422,
        "validation_error",
        "ids must be a non-empty list",
        "ids"
      )
    if (rawIds.length > 100)
      return fail(422, "validation_error", "at most 100 ids per request", "ids")
    // Dedupe, first occurrence wins — mirrors the server envelope.
    const seen = new Set<string>()
    const ids = rawIds
      .map(String)
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))

    type Rejection = { code: string; msg: string }
    let apply: (link: MockLink) => Rejection | null

    if (op === "delete") {
      apply = (link) => {
        if (link.status === "BLOCKED")
          return { code: "forbidden", msg: "blocked URLs cannot be deleted" }
        s.links = s.links.filter((l) => l !== link)
        return null
      }
    } else if (op === "status") {
      const next = String(body.status ?? "").toUpperCase()
      if (!["ACTIVE", "INACTIVE"].includes(next))
        return fail(
          422,
          "validation_error",
          "status must be ACTIVE or INACTIVE",
          "status"
        )
      apply = (link) => {
        if (link.status === "BLOCKED")
          return { code: "forbidden", msg: "blocked URLs cannot be modified" }
        link.status = next as MockLink["status"]
        return null
      }
    } else if (op === "expiry") {
      const raw = body.expire_after
      let expire: number | null = null
      if (raw !== null && raw !== undefined) {
        expire = Number(raw)
        if (!Number.isFinite(expire))
          return fail(
            422,
            "validation_error",
            "Invalid expire_after format",
            "expire_after"
          )
        // One value for the whole batch, validated once at the envelope.
        if (expire <= Math.floor(Date.now() / 1000))
          return fail(
            400,
            "validation_error",
            "expire_after must be in the future",
            "expire_after"
          )
      }
      apply = (link) => {
        if (link.status === "BLOCKED")
          return { code: "forbidden", msg: "blocked URLs cannot be modified" }
        link.expire_after = expire
        // An expired link reactivates when its expiry is cleared (null) or
        // extended to a future value. The envelope already rejected any
        // non-future value, so any non-null expire here is in the future.
        if (link.status === "EXPIRED") link.status = "ACTIVE"
        return null
      }
    } else if (op === "domain") {
      const raw = body.domain
      // The wire expresses the system default as null; a custom target is
      // its fqdn. "spoo.me" folds onto the default too.
      const target =
        raw === null || raw === undefined || raw === "" || raw === "spoo.me"
          ? null
          : String(raw)
      // Envelope precondition: a custom target must be a domain the caller
      // owns and that is active. A bad target rejects the whole request
      // before any item is touched.
      if (
        target !== null &&
        !s.domains.some((d) => d.fqdn === target && d.status === "active")
      )
        return fail(
          400,
          "validation_error",
          `no active domain ${target} in your account`,
          "domain"
        )
      apply = (link) => {
        if (link.status === "BLOCKED")
          return { code: "forbidden", msg: "blocked URLs cannot be modified" }
        // Already on the target = success no-op.
        if (link.domain === target) return null
        // Alias must be free on the target namespace.
        const clash = s.links.some(
          (l) => l !== link && l.alias === link.alias && l.domain === target
        )
        if (clash)
          return {
            code: "conflict",
            msg: "alias already taken on the target domain",
          }
        link.domain = target
        return null
      }
    } else if (op === "tags") {
      const add = normalizeTagIds(body.add, "add")
      if ("err" in add) return add.err
      const remove = normalizeTagIds(body.remove, "remove")
      if ("err" in remove) return remove.err
      if (!add.ok.length && !remove.ok.length)
        return fail(
          422,
          "validation_error",
          "add or remove must name at least one tag",
          "add"
        )
      if (add.ok.some((t) => remove.ok.includes(t)))
        return fail(
          422,
          "validation_error",
          "tags cannot be both added and removed",
          "add"
        )
      // Envelope precondition, like the real service: every added tag
      // must be one of yours, or nothing is attempted.
      const foreign = assertOwnedTagIds(add.ok, "add")
      if (foreign) return foreign
      apply = (link) => {
        if (link.status === "BLOCKED")
          return { code: "forbidden", msg: "blocked URLs cannot be modified" }
        const kept = link.tag_ids.filter((t) => !remove.ok.includes(t))
        const next = [...kept, ...add.ok.filter((t) => !kept.includes(t))]
        if (next.length > 10)
          return {
            code: "validation_error",
            msg: "a link can carry at most 10 tags",
          }
        link.tag_ids = next
        return null
      }
    } else {
      return fail(404, "not_found", "Unknown bulk operation")
    }

    const results = ids.map((id) => {
      const link = s.links.find((l) => l.id === id)
      if (!link)
        return {
          id,
          alias: null,
          ok: false,
          error_code: "not_found",
          error: "No such URL in your account",
        }
      const err = apply(link)
      if (err)
        return {
          id,
          alias: link.alias,
          ok: false,
          error_code: err.code,
          error: err.msg,
        }
      return { id, alias: link.alias, ok: true, error_code: null, error: null }
    })
    const succeeded = results.filter((r) => r.ok).length
    return json({
      summary: {
        total: results.length,
        succeeded,
        failed: results.length - succeeded,
      },
      results,
    })
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
        const v = checkAliasVerdict(body.alias)
        if (!v.available) return aliasFail(v.reason ?? "format")
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
      if ("starts_at" in body) {
        const starts = body.starts_at === null ? null : Number(body.starts_at)
        if (starts !== null && starts <= Math.floor(Date.now() / 1000))
          return fail(
            400,
            "validation_error",
            "starts_at must be in the future",
            "starts_at"
          )
        if (
          starts !== null &&
          link.expire_after !== null &&
          starts >= link.expire_after
        )
          return fail(
            400,
            "validation_error",
            "starts_at must be before expire_after",
            "starts_at"
          )
        link.starts_at = starts
      }
      if ("pre_start_url" in body)
        link.pre_start_url =
          body.pre_start_url === null || body.pre_start_url === ""
            ? null
            : String(body.pre_start_url)
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
      if ("tag_ids" in body) {
        // Whole-list replace; null and [] both clear.
        const tags = normalizeTagIds(body.tag_ids)
        if ("err" in tags) return tags.err
        const foreign = assertOwnedTagIds(tags.ok)
        if (foreign) return foreign
        link.tag_ids = tags.ok
      }
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

  /* ---------- public link surfaces (no session required) ---------- */
  if (path[0] === "v1" && path[1] === "public" && path[3]) {
    // Emoji aliases arrive percent-encoded through the rewrite.
    let code = path[3]
    try {
      code = decodeURIComponent(code)
    } catch {
      /* keep the raw segment */
    }
    if (
      path[2] === "stats" &&
      (req.method === "GET" || req.method === "POST")
    ) {
      return handlePublicStats(code, req.method, body, params)
    }
    if (path[2] === "preview" && req.method === "GET") {
      return handlePublicPreview(code)
    }
  }

  /* ---------- stats + export ---------- */
  // Shared query parsing for the account and per-link stats endpoints.
  const parseStatsQuery = ():
    | {
        startMs: number
        endMs: number
        groupBy: StatsDimension[]
        filters: Partial<Record<string, string[]>> | undefined
      }
    | NextResponse => {
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
        filters = JSON.parse(rawFilters) as Record<string, string[]>
      } catch {
        return fail(422, "invalid_filters", "filters must be JSON", "filters")
      }
    }
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
    return { startMs, endMs, groupBy, filters }
  }

  if (route === "GET /v1/stats") {
    const q = parseStatsQuery()
    if (q instanceof NextResponse) return q
    const { startMs, endMs, groupBy, filters } = q
    // Link scoping arrives via the filters JSON — url_id and short_code are
    // plain multi-value filters on the account aggregate (AND semantics).
    let shortCodes = (filters?.short_code as string[] | undefined) ?? null
    delete filters?.short_code
    const urlIds = filters?.url_id as string[] | undefined
    delete filters?.url_id
    // Tag scope resolves through the links, like the real service does:
    // clicks on links carrying any listed tag (by id or by name); a tag
    // nobody uses matches nothing.
    const tagIdScope = (filters?.tag_id as string[] | undefined) ?? []
    const tagNameScope = (filters?.tag as string[] | undefined) ?? []
    delete filters?.tag_id
    delete filters?.tag
    if (tagIdScope.length || tagNameScope.length) {
      const names = tagNameScope.map((n) => normalizeTagName(n))
      const wanted = new Set(tagIdScope)
      for (const t of s.tags) if (names.includes(t.name)) wanted.add(t.id)
      const tagged = s.links
        .filter((l) => l.tag_ids.some((t) => wanted.has(t)))
        .map((l) => l.alias)
      shortCodes = shortCodes
        ? shortCodes.filter((c) => tagged.includes(c))
        : tagged
      if (!shortCodes.length) shortCodes = ["__no_match__"]
    }
    if (urlIds?.length) {
      const byId = s.links
        .filter((l) => urlIds.includes(l.id))
        .map((l) => l.alias)
      shortCodes = shortCodes
        ? shortCodes.filter((c) => byId.includes(c))
        : byId
      // Foreign/unknown ids slice the aggregate to nothing, not everything.
      if (!shortCodes.length) shortCodes = ["__no_match__"]
    }
    return json(
      generateStats(s.links, { startMs, endMs, shortCodes, filters, groupBy })
    )
  }

  if (
    path[0] === "v1" &&
    path[1] === "stats" &&
    path[2] === "links" &&
    path[3] &&
    req.method === "GET"
  ) {
    // Resolve-first like the real endpoint: unknown or foreign id is a 404,
    // not a silently-empty aggregate.
    const link = s.links.find((l) => l.id === path[3])
    if (!link) return fail(404, "not_found", "No such link")
    const q = parseStatsQuery()
    if (q instanceof NextResponse) return q
    const { startMs, endMs, groupBy, filters } = q
    return json({
      ...generateStats(s.links, {
        startMs,
        endMs,
        shortCodes: [link.alias],
        filters,
        groupBy,
      }),
      url_id: link.id,
      alias: link.alias,
    })
  }

  /* ---------- api keys ----------
     Wire shape mirrors the REAL backend's ApiKeyResponse exactly: envelope
     key `keys`, Unix-second timestamps, last_used_at nullable (null until
     the key first authenticates; server debounces updates to ~hourly).
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
    last_used_at: k.last_used_at
      ? Math.floor(new Date(k.last_used_at).getTime() / 1000)
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
  if (route === "GET /v1/apps")
    // Newest granted_at first, like the real endpoint.
    return json({
      items: [...s.grants].sort((a, b) =>
        b.granted_at.localeCompare(a.granted_at)
      ),
    })

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
        webhooks: "enabled",
        link_scheduling: "enabled",
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

  /* ---------- profile pictures (real path: /api/v1/me/profile-pictures) -- */

  if (path[0] === "v1" && path[1] === "me" && path[2] === "profile-pictures") {
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
    // POST /api/v1/me/profile-pictures/upload — real gates in order
    // (services/image_ingest.py): missing field 422s (pydantic), then
    // data-URI shape and the decoded-size cap are 400 validation_error
    // with a `field: "image"` echo. The real backend re-hosts the bytes
    // on the CDN; the mock stores the data URI itself as the pfp url.
    if (req.method === "POST" && path[3] === "upload") {
      if (typeof body.image !== "string" || !body.image)
        return fail(422, "validation_error", "image: Field required", "image")
      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
        body.image
      )
      if (!m)
        return fail(
          400,
          "validation_error",
          "image must be a base64 data URI (image/png, image/jpeg, image/webp)",
          "image"
        )
      if (m[2].length > (PFP_UPLOAD_MAX_BYTES * 4) / 3 + 4)
        return fail(
          400,
          "validation_error",
          `image exceeds ${PFP_UPLOAD_MAX_BYTES} bytes`,
          "image"
        )
      s.pfp = { url: body.image, source: "upload" }
      return json({ message: "Profile picture updated successfully" })
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
    // Idempotent: clearing an already-empty pfp still 200s.
    if (req.method === "DELETE") {
      s.pfp = null
      return json({ message: "Profile picture removed" })
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
