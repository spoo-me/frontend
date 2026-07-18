/**
 * Deterministic mock dataset — seeded PRNG so the dashboard shows the same
 * believable workspace on every restart (design walkthroughs need stable
 * numbers, not roulette). Everything derives from SEED; change it to get a
 * different-but-stable workspace.
 */

const SEED = 20260707

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type MockLink = {
  id: string
  alias: string
  long_url: string
  domain: string | null
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "BLOCKED"
  created_at: string
  expire_after: number | null
  max_clicks: number | null
  password_set: boolean
  password: string | null
  private_stats: boolean
  block_bots: boolean
  total_clicks: number
  last_click: string | null
  /** Real wire shape (backend PR #230): UPPERCASE ISO alpha-2 → URL. */
  geo_rules: Record<string, string> | null
  ab_variants: Array<{ url: string; weight: number }> | null
  /** Real wire shape (backend PR #231): full echo, explicit nulls;
      `warnings` stays null until async image validation runs. */
  meta_tags: {
    title: string
    description: string | null
    image: string | null
    color: string | null
    warnings: string[] | null
  } | null
  /** Relative traffic weight used by the stats generator. */
  weight: number
}

// Mirrors the real CustomDomainResponse wire byte-for-byte: lowercase
// status, verification_method present, no cf_* fields (the real DTO
// doesn't expose them).
export type MockDomain = {
  id: string
  fqdn: string
  status: "pending" | "verifying" | "active" | "suspended" | "revoked"
  verification_method: "cf_http_dcv"
  created_at: string
  last_verified_at: string | null
  last_verification_error: string | null
  root_redirect: string | null
  not_found_redirect: string | null
  custom_robots_txt: string | null
  dns_records: Array<{
    type: string
    name: string
    value: string
    purpose: string
  }>
  setup_notes: string[]
}

export type MockKey = {
  id: string
  name: string
  description: string | null
  token_prefix: string
  scopes: string[]
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  revoked: boolean
}

export type MockGrant = {
  id: string
  app: string
  app_name: string
  icon: string
  scopes: string[]
  permissions: string[]
  granted_at: string
  last_used_at: string | null
}

const DESTINATIONS: Array<[alias: string, url: string, weight: number]> = [
  ["launch", "https://github.com/spoo-me/url-shortener/releases/tag/v2.0.0", 9],
  ["docs", "https://docs.spoo.me/getting-started/introduction", 8],
  ["gh", "https://github.com/spoo-me/url-shortener", 7],
  ["api", "https://docs.spoo.me/api-reference/authentication", 6],
  ["blog", "https://blog.spoo.me/how-we-handle-400k-redirects-a-day", 6],
  ["demo", "https://www.youtube.com/watch?v=spoo-demo-2026", 5],
  ["cli", "https://github.com/spoo-me/spoo-cli#installation", 5],
  ["status", "https://status.spoo.me/", 4],
  ["discord", "https://discord.gg/spoo-me-community", 4],
  ["snap", "https://chromewebstore.google.com/detail/spoo-snap", 4],
  ["pricing", "https://spoo.me/#pricing", 4],
  ["webinar", "https://zoom.us/webinar/register/spoo-product-tour", 3],
  ["deck", "https://docs.google.com/presentation/d/spoo-pitch-deck-2026", 3],
  ["survey", "https://tally.so/r/spoo-user-survey-q3", 3],
  ["swag", "https://shop.spoo.me/collections/stickers", 3],
  ["raycast", "https://www.raycast.com/spoo-me/spoo", 3],
  ["changelog", "https://docs.spoo.me/changelog#july-2026", 3],
  ["hn", "https://news.ycombinator.com/item?id=spoo-show-hn", 3],
  ["talk", "https://www.meetup.com/pycon-india/events/spoo-scaling-talk", 2],
  ["hiring", "https://spoo.me/careers/founding-engineer", 2],
  ["kit", "https://www.notion.so/spoo/press-kit-2026", 2],
  ["og", "https://spoo.me/tools/og-image-generator", 2],
  ["report", "https://blog.spoo.me/state-of-link-sharing-2026", 2],
  ["invite", "https://spoo.me/i/team-invite", 2],
  ["beta", "https://spoo.me/beta/edge-analytics", 2],
  ["ios", "https://apps.apple.com/app/spoo-shortener/id123456", 2],
  ["feedback", "https://spoo.canny.io/feature-requests", 2],
  ["newsletter", "https://buttondown.email/spoo/archive", 2],
  ["yt", "https://www.youtube.com/@spoo-me", 1],
  ["x", "https://x.com/spoo_me", 1],
  ["book", "https://cal.com/zingzy/spoo-onboarding", 1],
  ["stack", "https://stackshare.io/spoo-me/spoo-me", 1],
  ["uptime", "https://uptime.spoo.me/history", 1],
  ["mirror", "https://spoo-me.pages.dev/", 1],
  ["paper", "https://arxiv.org/abs/2606.01234", 1],
  ["repo2", "https://github.com/spoo-me/spoo-snap", 1],
  ["form", "https://forms.spoo.me/contact-sales", 1],
  ["maps", "https://maps.app.goo.gl/spoo-hq", 1],
  ["drop", "https://drive.google.com/file/d/spoo-brand-assets", 1],
  ["notes", "https://www.notion.so/spoo/roadmap-2026-h2", 1],
  ["qr", "https://spoo.me/tools/qr-designer", 1],
  ["legacy", "http://old.spoo.me/redirect-test", 1],
]

function isoDaysAgo(days: number, rand: () => number) {
  const d = new Date(Date.now() - days * 86_400_000 - rand() * 43_200_000)
  return d.toISOString()
}

export function buildLinks(): MockLink[] {
  const rand = mulberry32(SEED)
  return DESTINATIONS.map(([alias, url, weight], i) => {
    const ageDays = 3 + Math.floor(rand() * 175)
    const clicks = Math.round(
      weight * (140 + rand() * 260) * (0.4 + ageDays / 180)
    )
    // Sprinkle non-default states deterministically down the tail.
    const status: MockLink["status"] =
      alias === "legacy"
        ? "BLOCKED"
        : alias === "webinar" || alias === "hn"
          ? "EXPIRED"
          : alias === "survey" || alias === "mirror"
            ? "INACTIVE"
            : "ACTIVE"
    const onDomain =
      alias === "deck" ||
      alias === "invite" ||
      alias === "book" ||
      alias === "form"
        ? "go.acme.dev"
        : null
    return {
      id: `url_${SEED}_${i}`,
      alias,
      long_url: url,
      domain: onDomain,
      status,
      created_at: isoDaysAgo(ageDays, rand),
      expire_after:
        alias === "webinar"
          ? Math.floor((Date.now() - 6 * 86_400_000) / 1000)
          : alias === "beta"
            ? Math.floor((Date.now() + 21 * 86_400_000) / 1000)
            : null,
      max_clicks: alias === "invite" ? 500 : alias === "swag" ? 1000 : null,
      password_set: alias === "deck" || alias === "kit",
      password:
        alias === "deck"
          ? "velvet-quartz-42"
          : alias === "kit"
            ? "amber-pixel-77"
            : null,
      private_stats: alias === "hiring",
      block_bots: weight >= 6,
      total_clicks:
        status === "ACTIVE" || status === "EXPIRED"
          ? clicks
          : Math.round(clicks * 0.3),
      last_click:
        status === "ACTIVE"
          ? isoDaysAgo(rand() * 2, rand)
          : isoDaysAgo(20 + rand() * 30, rand),
      // "pricing" ships purchasing-power-parity pages — a believable geo
      // demo the settings form can round-trip out of the box.
      geo_rules:
        alias === "pricing"
          ? {
              IN: "https://spoo.me/in/#pricing",
              BR: "https://spoo.me/br/#pricing",
            }
          : null,
      ab_variants: null,
      // "launch" carries a custom social card — the meta editor and the
      // unfurl previews have something real to round-trip out of the box.
      meta_tags:
        alias === "launch"
          ? {
              title: "spoo.me v2 is here 🎉",
              description:
                "Custom domains, edge analytics, and the fastest redirects we've ever shipped.",
              image: "https://cdn.spoo.me/og/usr_mock_1/v2-launch-card.png",
              color: "#8b5cf6",
              warnings: null,
            }
          : null,
      weight,
    }
  })
}

// Record shapes and copy match what the real backend stamps at create time:
// one routing CNAME to customers.spoo.me plus Cloudflare's ownership TXT at
// _cf-custom-hostname.<fqdn>. Purposes and setup notes are the backend's
// exact strings.
export function buildDomains(): MockDomain[] {
  const rand = mulberry32(SEED + 1)
  return [
    {
      id: "dom_acme",
      fqdn: "go.acme.dev",
      status: "active",
      verification_method: "cf_http_dcv",
      created_at: isoDaysAgo(64, rand),
      last_verified_at: isoDaysAgo(1, rand),
      last_verification_error: null,
      root_redirect: "https://acme.dev",
      not_found_redirect: null,
      custom_robots_txt: null,
      dns_records: [
        {
          type: "CNAME",
          name: "go.acme.dev",
          value: "customers.spoo.me",
          purpose: "routes traffic to spoo.me",
        },
        {
          type: "TXT",
          name: "_cf-custom-hostname.go.acme.dev",
          value: "b3a91c04-7d2e-4f6a-9c58-1e0d2b7a4f13",
          purpose: "proves domain ownership",
        },
      ],
      setup_notes: [],
    },
    {
      id: "dom_zin",
      fqdn: "l.zingzy.dev",
      status: "pending",
      verification_method: "cf_http_dcv",
      created_at: isoDaysAgo(2, rand),
      last_verified_at: null,
      last_verification_error:
        "DNS isn't reaching us yet - This is normal right after adding the " +
        "records. Try again in a few minutes.",
      root_redirect: null,
      not_found_redirect: null,
      custom_robots_txt: null,
      dns_records: [
        {
          type: "CNAME",
          name: "l.zingzy.dev",
          value: "customers.spoo.me",
          purpose: "routes traffic to spoo.me",
        },
        {
          type: "TXT",
          name: "_cf-custom-hostname.l.zingzy.dev",
          value: "f7e2d5a8-3b1c-4e9f-8a67-2c4b9d0e1a52",
          purpose: "proves domain ownership",
        },
      ],
      setup_notes: [
        "Cloudflare DNS detected. Set the record to DNS only (grey cloud " +
          "icon), not Proxied (orange cloud), or verification will fail.",
      ],
    },
  ]
}

export function buildKeys(): MockKey[] {
  const rand = mulberry32(SEED + 2)
  return [
    {
      id: "key_ci",
      name: "GitHub Actions",
      description: "release pipeline, shortens changelog links",
      token_prefix: "spk_live_a3f8",
      scopes: ["shorten:create", "urls:read"],
      created_at: isoDaysAgo(88, rand),
      expires_at: null,
      last_used_at: isoDaysAgo(0.3, rand),
      revoked: false,
    },
    {
      id: "key_bot",
      name: "spoo-bot",
      description: "discord bot",
      token_prefix: "spk_live_9c2d",
      scopes: ["shorten:create", "urls:read", "stats:read"],
      created_at: isoDaysAgo(41, rand),
      expires_at: null,
      last_used_at: isoDaysAgo(1.4, rand),
      revoked: false,
    },
    {
      id: "key_old",
      name: "zapier (rotated)",
      description: null,
      token_prefix: "spk_live_77aa",
      scopes: ["shorten:create"],
      created_at: isoDaysAgo(140, rand),
      expires_at: null,
      last_used_at: isoDaysAgo(61, rand),
      revoked: true,
    },
  ]
}

export function buildGrants(): MockGrant[] {
  const rand = mulberry32(SEED + 3)
  return [
    {
      id: "grant_cli",
      app: "spoo-cli",
      app_name: "spoo CLI",
      icon: "terminal",
      scopes: ["shorten:create", "urls:manage", "stats:read"],
      permissions: [
        "Create short links",
        "Edit and delete links",
        "Read analytics data",
      ],
      granted_at: isoDaysAgo(33, rand),
      last_used_at: isoDaysAgo(0.1, rand),
    },
    {
      id: "grant_snap",
      app: "spoo-snap",
      app_name: "spoo snap",
      icon: "puzzle",
      scopes: ["shorten:create"],
      permissions: ["Create short links"],
      granted_at: isoDaysAgo(75, rand),
      last_used_at: isoDaysAgo(0.8, rand),
    },
    {
      id: "grant_raycast",
      app: "spoo-raycast",
      app_name: "Raycast extension",
      icon: "command",
      scopes: ["shorten:create", "urls:read"],
      permissions: ["Create short links", "List and read links"],
      granted_at: isoDaysAgo(12, rand),
      last_used_at: isoDaysAgo(3.2, rand),
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Stats generator: parametric distributions + seeded per-bucket noise */
/* ------------------------------------------------------------------ */

const REFERRERS: Array<[string, number]> = [
  ["direct", 30],
  ["google.com", 22],
  ["github.com", 13],
  ["x.com", 9],
  ["chatgpt.com", 7],
  ["reddit.com", 6],
  ["news.ycombinator.com", 4],
  ["linkedin.com", 3],
  ["youtube.com", 2],
  ["bing.com", 2],
  ["duckduckgo.com", 1],
  ["t.co", 1],
]

const COUNTRIES: Array<[string, number]> = [
  ["US", 28],
  ["IN", 19],
  ["DE", 8],
  ["GB", 7],
  ["FR", 5],
  ["CA", 5],
  ["BR", 4],
  ["JP", 4],
  ["NL", 3],
  ["AU", 3],
  ["ID", 3],
  ["SG", 2],
  ["ES", 2],
  ["PL", 2],
  ["TR", 2],
  ["KR", 1],
  ["SE", 1],
  ["MX", 1],
]

const CITIES: Array<[string, number]> = [
  ["San Francisco", 9],
  ["Bengaluru", 8],
  ["New York", 7],
  ["Mumbai", 6],
  ["Berlin", 6],
  ["London", 6],
  ["Paris", 4],
  ["Toronto", 4],
  ["São Paulo", 4],
  ["Tokyo", 4],
  ["Amsterdam", 3],
  ["Sydney", 3],
  ["Jakarta", 3],
  ["Singapore", 2],
  ["Madrid", 2],
  ["Warsaw", 2],
  ["Istanbul", 2],
  ["Seoul", 1],
]

const BROWSERS: Array<[string, number]> = [
  ["Chrome", 58],
  ["Safari", 16],
  ["Firefox", 9],
  ["Edge", 8],
  ["Arc", 4],
  ["Brave", 3],
  ["Opera", 2],
]

const OSES: Array<[string, number]> = [
  ["Windows", 36],
  ["Android", 22],
  ["iOS", 16],
  ["macOS", 15],
  ["Linux", 11],
]

export const DIMENSIONS = {
  referrer: REFERRERS,
  country: COUNTRIES,
  city: CITIES,
  browser: BROWSERS,
  os: OSES,
} as const

export type StatsDimension = keyof typeof DIMENSIONS | "short_code" | "time"

/** Diurnal shape (UTC-ish): quiet nights, evening peak. */
const HOUR_SHAPE = [
  2, 1.5, 1.2, 1, 1, 1.4, 2.2, 3.4, 4.8, 5.8, 6.2, 6.4, 6.6, 6.8, 7, 7.2, 7.6,
  8, 8.4, 8, 7, 5.4, 4, 3,
]

function noise(rand: () => number) {
  return 0.75 + rand() * 0.5
}

/**
 * Deterministic click volume for one hour bucket across the whole account
 * (weight 1). Scale by link weight share for per-link stats.
 */
function hourVolume(msUtc: number): number {
  const d = new Date(msUtc)
  const day = Math.floor(msUtc / 86_400_000)
  const rand = mulberry32(SEED ^ day)
  const weekday = d.getUTCDay()
  const weekend = weekday === 0 || weekday === 6 ? 0.62 : 1
  // Slow growth over time + occasional viral day.
  const growth = 0.8 + (day % 1000) / 2500
  const viral = mulberry32(SEED ^ (day * 7))() > 0.965 ? 2.6 : 1
  return (
    HOUR_SHAPE[d.getUTCHours()] * weekend * growth * viral * noise(rand) * 3.1
  )
}

export type StatsQuery = {
  startMs: number
  endMs: number
  shortCodes?: string[] | null
  filters?: Partial<Record<string, string[]>>
  groupBy: StatsDimension[]
}

function weightShare(links: MockLink[], shortCodes?: string[] | null) {
  const all = links.reduce((a, l) => a + l.weight, 0)
  // A fresh workspace has no links: no traffic at all, not NaN.
  if (!all) return 0
  if (!shortCodes?.length) return 1
  const sel = links
    .filter((l) => shortCodes.includes(l.alias))
    .reduce((a, l) => a + l.weight, 0)
  return sel / all
}

/** Multiplier <1 applied when dimension filters narrow the traffic. */
function filterShare(filters?: StatsQuery["filters"]) {
  if (!filters) return 1
  let share = 1
  for (const [dim, values] of Object.entries(filters)) {
    const table = DIMENSIONS[dim as keyof typeof DIMENSIONS]
    if (!table || !values?.length) continue
    const total = table.reduce((a, [, w]) => a + w, 0)
    const sel = table
      .filter(([name]) => values.includes(name))
      .reduce((a, [, w]) => a + w, 0)
    share *= Math.max(sel / total, 0.005)
  }
  return share
}

export function generateStats(links: MockLink[], q: StatsQuery) {
  const hourly = q.endMs - q.startMs <= 26 * 3_600_000
  const bucketMs = hourly ? 3_600_000 : 86_400_000
  // Bucket in LOCAL time like the real backend ($dateToString with the
  // requested timezone): floor to the local hour/day, so "today" exists
  // as a partial bucket the moment the local day starts.
  const floorLocal = (ms: number) => {
    const d = new Date(ms)
    if (hourly) d.setMinutes(0, 0, 0)
    else d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const start = floorLocal(q.startMs)
  const share = weightShare(links, q.shortCodes) * filterShare(q.filters)

  const series: Array<{
    bucket: string
    clicks: number
    unique_clicks: number
  }> = []
  let total = 0
  for (let t = start; t < q.endMs; t += bucketMs) {
    let v = 0
    if (hourly) v = hourVolume(t)
    else for (let h = 0; h < 24; h++) v += hourVolume(t + h * 3_600_000)
    const clicks = Math.round(v * share)
    const uniq = Math.round(clicks * (0.62 + mulberry32(SEED ^ t)() * 0.16))
    series.push({
      bucket: new Date(t).toISOString(),
      clicks,
      unique_clicks: uniq,
    })
    total += clicks
  }
  // Sum the jittered buckets instead of a flat ratio: total and unique
  // then trend DIFFERENTLY, so their deltas and sparklines diverge like
  // real traffic would.
  const uniqueTotal = series.reduce((a, b) => a + b.unique_clicks, 0)

  /* ---------- assemble the REAL wire shape ----------
     Mirrors the FastAPI stats response exactly: one array per metric per
     dimension keyed "{metric}_by_{dim}", entries keyed by the dimension
     name with *_percentage fields, display-formatted time labels in local
     time, quiet buckets ABSENT (Mongo groups only what exists), strftime
     time_bucket_info. The frontend adapter merges it all back. */
  const pad = (n: number) => String(n).padStart(2, "0")
  const label = (ms: number) => {
    const d = new Date(ms)
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return hourly ? `${day} ${pad(d.getHours())}:00` : day
  }
  const metrics: Record<string, unknown[]> = {}
  const emit = (
    dim: string,
    rows: Array<{ value: string; clicks: number; unique_clicks: number }>
  ) => {
    const clickTotal = rows.reduce((a, r) => a + r.clicks, 0) || 1
    const uniqTotal = rows.reduce((a, r) => a + r.unique_clicks, 0) || 1
    metrics[`clicks_by_${dim}`] = rows.map((r) => ({
      [dim]: r.value,
      clicks: r.clicks,
      clicks_percentage: Math.round((r.clicks / clickTotal) * 10000) / 100,
    }))
    metrics[`unique_clicks_by_${dim}`] = rows.map((r) => ({
      [dim]: r.value,
      unique_clicks: r.unique_clicks,
      unique_clicks_percentage:
        Math.round((r.unique_clicks / uniqTotal) * 10000) / 100,
    }))
  }

  if (q.groupBy.includes("time"))
    emit(
      "time",
      series
        .filter((b) => b.clicks > 0 || b.unique_clicks > 0)
        .map((b) => ({
          value: label(new Date(b.bucket).getTime()),
          clicks: b.clicks,
          unique_clicks: b.unique_clicks,
        }))
    )

  for (const dim of q.groupBy) {
    if (dim === "time" || dim === "short_code") continue
    const table = DIMENSIONS[dim]
    if (!table) continue
    // A filtered dimension's own breakdown contains only the selected
    // values — filtered traffic can't have other referrers/countries/etc.
    // Other dimensions keep their full distribution over that traffic.
    const active = q.filters?.[dim]
    const pool = active?.length
      ? table.filter(([value]) => active.includes(value))
      : table
    const raws = pool.map(([value, w], i) => {
      const jitter = 0.82 + mulberry32(SEED ^ (i * 31) ^ table.length)() * 0.36
      return { value, raw: w * jitter }
    })
    const rawTotal = raws.reduce((a, r) => a + r.raw, 0)
    emit(
      dim,
      raws
        .map(({ value, raw }, i) => {
          const clicks = Math.round((raw / rawTotal) * total)
          const rate = 0.6 + mulberry32(SEED ^ (i * 97) ^ raw)() * 0.2
          return { value, clicks, unique_clicks: Math.round(clicks * rate) }
        })
        // The real backend derives rows from events: zero clicks = no row.
        .filter((r) => r.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks)
    )
  }

  if (q.groupBy.includes("short_code")) {
    const pool = q.shortCodes?.length
      ? links.filter((l) => q.shortCodes!.includes(l.alias))
      : links
    const wTotal = pool.reduce((a, l) => a + l.weight, 0)
    emit(
      "short_code",
      pool
        .map((l, i) => {
          const clicks = Math.round((l.weight / wTotal) * total)
          const rate = 0.6 + mulberry32(SEED ^ (i * 53) ^ l.weight)() * 0.2
          return {
            value: l.alias,
            clicks,
            unique_clicks: Math.round(clicks * rate),
          }
        })
        .filter((r) => r.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 25)
    )
  }

  const fmt = hourly ? "%Y-%m-%d %H:00" : "%Y-%m-%d"
  return {
    summary: {
      total_clicks: total,
      unique_clicks: uniqueTotal,
      first_click: new Date(q.startMs).toISOString(),
      last_click: series.findLast((b) => b.clicks > 0)?.bucket ?? null,
      // Real backend averages to 0 over an empty range; the client adapter
      // is what turns that into null.
      avg_redirection_time: total
        ? 38 + Math.round(mulberry32(SEED)() * 14)
        : 0,
    },
    metrics,
    // Real backend omits computed_metrics entirely when nothing clicked.
    ...(total > 0
      ? {
          computed_metrics: {
            unique_click_rate: Math.round((uniqueTotal / total) * 1000) / 10,
            repeat_click_rate:
              Math.round((1 - uniqueTotal / total) * 1000) / 10,
            average_clicks_per_visitor: uniqueTotal
              ? Math.round((total / uniqueTotal) * 100) / 100
              : 0,
          },
        }
      : {}),
    time_range: {
      start_date: new Date(q.startMs).toISOString(),
      end_date: new Date(q.endMs).toISOString(),
    },
    time_bucket_info: {
      strategy: hourly ? "hourly" : "daily",
      interval_minutes: hourly ? 60 : 1440,
      mongo_format: fmt,
      display_format: fmt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    generated_at: new Date().toISOString(),
    api_version: "v1",
  }
}
