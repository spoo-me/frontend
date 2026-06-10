import { NextRequest, NextResponse } from "next/server"

/**
 * Mock backend for design walkthroughs — enabled only when SPOO_MOCK=1
 * (npm run dev:mock). next.config.mjs points the same-origin proxy
 * (/auth/*, /oauth/*, /api/v1/*) here instead of the FastAPI backend, so
 * the real pages run the real flow against canned responses.
 *
 * Conventions:
 *  - any email/password signs in; signup walks the OTP beat (any 6 digits)
 *  - aliases "launch", "spring", "ga", "api", "docs" are taken
 *  - state is per dev-server process; restart to reset, or GET /api/mock/reset
 */

const MOCK = process.env.SPOO_MOCK === "1"

type MockState = {
  email: string
  userName: string | null
  verified: boolean
  onboarding: { step: string | null; path: "links" | "api" | null; completed: boolean }
  links: Array<{
    id: string
    alias: string
    long_url: string
    created_at: string
    total_clicks: number
  }>
}

const initial = (): MockState => ({
  email: "you@example.com",
  userName: null,
  verified: true,
  onboarding: { step: null, path: null, completed: false },
  links: [],
})

// Survives HMR within one dev-server process.
const g = globalThis as typeof globalThis & { __spooMock?: MockState }
g.__spooMock ??= initial()
const state = () => g.__spooMock!

const TAKEN_ALIASES = new Set(["launch", "spring", "ga", "api", "docs"])

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
    auth_providers: [],
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

async function handle(req: NextRequest, path: string[]) {
  if (!MOCK) return fail(404, "mock_disabled", "Mock API is disabled (set SPOO_MOCK=1)")

  const route = `${req.method} /${path.join("/")}`
  const body =
    req.method === "POST" || req.method === "PUT"
      ? await req.json().catch(() => ({}))
      : ({} as Record<string, unknown>)

  // Latency theater — enough to exercise loading states, not annoy.
  await sleep(250 + Math.random() * 250)

  const s = state()

  switch (route) {
    /* ---------- housekeeping ---------- */
    case "GET /reset": {
      g.__spooMock = initial()
      return json({ success: true, note: "mock state reset" })
    }

    /* ---------- auth ---------- */
    case "POST /auth/register": {
      g.__spooMock = {
        ...initial(),
        email: String(body.email ?? "you@example.com"),
        userName: body.user_name ? String(body.user_name) : null,
        verified: false, // signup walks the OTP beat
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
        verified: true,
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

    /* ---------- links ---------- */
    case "GET /v1/shorten/check-alias": {
      const alias = req.nextUrl.searchParams.get("alias") ?? ""
      const taken = TAKEN_ALIASES.has(alias.toLowerCase())
      return json({ available: !taken, reason: taken ? "taken" : null })
    }
    case "POST /v1/shorten": {
      const longUrl = String(body.long_url ?? "")
      if (!/^https?:\/\//.test(longUrl))
        return fail(422, "invalid_url", "Enter a valid http(s) URL", "long_url")
      const alias = body.alias ? String(body.alias) : slug()
      if (TAKEN_ALIASES.has(alias.toLowerCase()))
        return fail(409, "alias_taken", "That alias is already taken", "alias")
      s.links.push({
        id: `url_${slug()}`,
        alias,
        long_url: longUrl,
        created_at: new Date().toISOString(),
        total_clicks: 0,
      })
      return json({
        alias,
        short_url: `https://spoo.me/${alias}`,
        long_url: longUrl,
        owner_id: "usr_mock_1",
        created_at: Math.floor(Date.now() / 1000),
        status: "active",
        private_stats: false,
      })
    }
    case "GET /v1/urls":
      return json({
        items: s.links.map((l) => ({
          id: l.id,
          alias: l.alias,
          long_url: l.long_url,
          status: "active",
          created_at: l.created_at,
          expire_after: null,
          max_clicks: null,
          private_stats: false,
          block_bots: false,
          password_set: false,
          total_clicks: l.total_clicks,
          last_click: null,
          domain: null,
        })),
        page: 1,
        pageSize: 20,
        total: s.links.length,
        hasNext: false,
      })

    /* ---------- api keys ---------- */
    case "POST /v1/keys": {
      const name = String(body.name ?? "").trim()
      if (!name) return fail(422, "invalid_name", "Give the key a name", "name")
      const prefix = "spk_live_"
      const token = `${prefix}${slug()}${slug()}${slug()}${slug()}`
      return json({
        id: `key_${slug()}`,
        name,
        scopes: Array.isArray(body.scopes) ? body.scopes : [],
        token_prefix: token.slice(0, 12),
        token,
      })
    }

    /* ---------- custom domains ---------- */
    case "POST /v1/custom-domains": {
      const fqdn = String(body.fqdn ?? "")
      return json({
        id: `dom_${slug()}`,
        fqdn,
        status: "PENDING",
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
      })
    }
  }

  /* ---------- oauth: one hop, straight back signed-in ---------- */
  if (path[0] === "oauth") {
    g.__spooMock = { ...initial(), email: `you@${path[1] ?? "oauth"}.dev`, verified: true }
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
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await ctx.params).path)
}
