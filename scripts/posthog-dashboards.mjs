/* Dashboards-as-code for PostHog: three consolidated product dashboards
   (Acquisition, Feature adoption, Engagement), upserted via the PostHog
   API — same philosophy as the Axiom dashboards. Idempotent: dashboards
   and insights are matched by name; re-running updates in place, and
   insights no longer defined here are pruned (soft-deleted) from managed
   dashboards. Event names/properties must match lib/analytics.ts; change
   them together.

   Deliberately NOT charted (build ad hoc when a question comes up — the
   events still flow): generic traffic (referrers/geo/paths — PostHog's
   built-in Web Analytics covers those), per-detail ui_action splits
   beyond composer tabs and apps, widget kind/source/scope breakdowns,
   stickiness/lifecycle variants of retention.

   Run: `node scripts/posthog-dashboards.mjs`
   Env (also read from .env.local):
     POSTHOG_PERSONAL_API_KEY  phx_… key, scopes: dashboard + insight read/write
     POSTHOG_HOST              default https://eu.posthog.com
     POSTHOG_PROJECT_ID        optional; auto-detected when the key sees one project */

import fs from "node:fs"
import path from "node:path"

/* ---------- env ---------- */

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
  }
}
loadEnvLocal()

const HOST = (process.env.POSTHOG_HOST ?? "https://eu.posthog.com").replace(
  /\/$/,
  ""
)
const KEY = process.env.POSTHOG_PERSONAL_API_KEY

if (!KEY) {
  console.error("POSTHOG_PERSONAL_API_KEY is not set (env or .env.local).")
  process.exit(1)
}

/* ---------- tiny API client ---------- */

async function api(method, route, body) {
  const res = await fetch(`${HOST}/api${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${route} → ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function resolveProjectId() {
  if (process.env.POSTHOG_PROJECT_ID) return process.env.POSTHOG_PROJECT_ID
  const { results } = await api("GET", "/projects/")
  if (results.length === 1) return results[0].id
  console.error(
    "Personal key sees multiple projects — set POSTHOG_PROJECT_ID. Options:",
    results.map((p) => `${p.id}=${p.name}`).join(", ")
  )
  process.exit(1)
}

/* ---------- query builders (PostHog query schema) ---------- */

const ev = (event, opts = {}) => ({
  kind: "EventsNode",
  event,
  name: opts.name ?? event,
  ...(opts.math ? { math: opts.math } : {}),
  ...(opts.math_property ? { math_property: opts.math_property } : {}),
  ...(opts.properties ? { properties: opts.properties } : {}),
})

const p = (key, value, operator = "exact") => ({
  key,
  value: Array.isArray(value) ? value : [value],
  operator,
  type: "event",
})

const viz = (source) => ({ kind: "InsightVizNode", source })

const trends = (series, opts = {}) =>
  viz({
    kind: "TrendsQuery",
    series,
    interval: opts.interval ?? "day",
    dateRange: { date_from: opts.dateFrom ?? "-30d" },
    trendsFilter: { display: opts.display ?? "ActionsLineGraph" },
    ...(opts.breakdown
      ? {
          breakdownFilter: {
            breakdown: opts.breakdown,
            breakdown_type: "event",
          },
        }
      : {}),
  })

const funnel = (series, opts = {}) =>
  viz({
    kind: "FunnelsQuery",
    series,
    dateRange: { date_from: opts.dateFrom ?? "-30d" },
    funnelsFilter: { funnelVizType: "steps" },
    ...(opts.breakdown
      ? {
          breakdownFilter: {
            breakdown: opts.breakdown,
            breakdown_type: "event",
          },
        }
      : {}),
  })

const retention = () =>
  viz({
    kind: "RetentionQuery",
    retentionFilter: {
      retentionType: "retention_first_time",
      period: "Week",
      totalIntervals: 8,
      targetEntity: {
        id: "link_created",
        name: "link_created",
        type: "events",
      },
      returningEntity: {
        id: "link_created",
        name: "link_created",
        type: "events",
      },
    },
  })

const step = (name) =>
  ev("onboarding_step_completed", { name, properties: [p("step", name)] })

const uiAction = (action, opts = {}) =>
  ev("ui_action", { ...opts, properties: [p("action", action)] })

/** Marketing traffic = pageviews outside the app shell. */
const marketingPageview = (opts = {}) =>
  ev("$pageview", {
    ...opts,
    properties: [p("$pathname", "/dashboard", "not_icontains")],
  })

const dashboardPageview = (opts = {}) =>
  ev("$pageview", {
    ...opts,
    properties: [p("$pathname", "/dashboard", "icontains")],
  })

/* ---------- the dashboards ---------- */

const MANAGED =
  "Managed by scripts/posthog-dashboards.mjs — edit there, then re-run."

const DASHBOARDS = [
  {
    name: "Acquisition",
    description: `Are people coming in, and do they activate? ${MANAGED}`,
    insights: [
      {
        name: "Acquisition funnel",
        description:
          "The whole story in one funnel: marketing visit → account → onboarded → first link.",
        query: funnel([
          marketingPageview(),
          ev("user_signed_up"),
          ev("onboarding_completed"),
          ev("link_created"),
        ]),
      },
      {
        name: "Onboarding step funnel",
        description:
          "Which step bleeds users; split by chosen path (links vs api). Conversion time is built into the funnel viz.",
        query: funnel(
          [
            step("welcome"),
            step("path"),
            step("domain"),
            step("apps"),
            ev("onboarding_completed"),
          ],
          { breakdown: "path" }
        ),
      },
      {
        name: "Auth activity",
        description: "Signups and logins per day.",
        query: trends([ev("user_signed_up"), ev("user_logged_in")]),
      },
      {
        name: "How did you hear about us",
        description:
          "heard_from on onboarding_completed (the rescued HDYHAU answer).",
        query: trends([ev("onboarding_completed")], {
          breakdown: "heard_from",
          display: "ActionsBarValue",
          dateFrom: "-90d",
        }),
      },
      {
        name: "Onboarding artifact rate",
        description:
          "Finished onboarding with a link, a key, or nothing (skipped everything).",
        query: trends([ev("onboarding_completed")], {
          breakdown: "artifact_kind",
          display: "ActionsBarValue",
          dateFrom: "-90d",
        }),
      },
    ],
  },
  {
    name: "Feature adoption",
    description: `Which capabilities people explore and adopt — the pricing-decision data. ${MANAGED}`,
    insights: [
      {
        name: "Links created by surface",
        description:
          "Frontend-only until backend events land (Phase 3): API-created links are invisible here.",
        query: trends([ev("link_created")], { breakdown: "surface" }),
      },
      {
        name: "Feature usage on new links",
        description:
          "One series per optional capability on link_created — adoption.",
        query: trends(
          [
            ev("link_created", {
              name: "password",
              properties: [p("has_password", "true")],
            }),
            ev("link_created", {
              name: "expiry",
              properties: [p("has_expiry", "true")],
            }),
            ev("link_created", {
              name: "max clicks",
              properties: [p("has_max_clicks", "true")],
            }),
            ev("link_created", {
              name: "geo rules",
              properties: [p("has_geo_rules", "true")],
            }),
            ev("link_created", {
              name: "meta tags",
              properties: [p("has_meta_tags", "true")],
            }),
            ev("link_created", {
              name: "a/b variants",
              properties: [p("has_ab_variants", "true")],
            }),
            ev("link_created", {
              name: "custom alias",
              properties: [p("is_custom_alias", "true")],
            }),
            ev("link_created", {
              name: "custom domain",
              properties: [p("has_custom_domain", "true")],
            }),
            ev("link_created", {
              name: "block bots",
              properties: [p("block_bots", "true")],
            }),
            ev("link_created", {
              name: "private stats",
              properties: [p("private_stats", "true")],
            }),
          ],
          { dateFrom: "-90d", interval: "week" }
        ),
      },
      {
        name: "Composer feature exploration",
        description:
          "composer_tab_opened by tab — features people LOOK at. Compare with the adoption matrix: a big gap = interest the feature isn't converting.",
        query: trends([uiAction("composer_tab_opened")], {
          breakdown: "detail",
          display: "ActionsBarValue",
          dateFrom: "-90d",
        }),
      },
      {
        name: "API keys",
        description: "Created, created-with-admin-scope, and deleted.",
        query: trends(
          [
            ev("api_key_created", { name: "created" }),
            ev("api_key_created", {
              name: "admin scope",
              properties: [p("has_admin_scope", "true")],
            }),
            ev("api_key_deleted", { name: "deleted" }),
          ],
          { dateFrom: "-90d" }
        ),
      },
      {
        name: "Domain setup funnel",
        description:
          "domain_added → domain_verified; the gap is DNS pain. Time-to-convert shows in the funnel viz.",
        query: funnel([ev("domain_added"), ev("domain_verified")], {
          dateFrom: "-90d",
        }),
      },
      {
        name: "Apps explored",
        description: "app_explored by slug — which catalogue apps get opened.",
        query: trends([uiAction("app_explored")], {
          breakdown: "detail",
          display: "ActionsBarValue",
          dateFrom: "-90d",
        }),
      },
      {
        name: "Board activity",
        description:
          "Widget board editing volume: adds, removals, config changes, rearranges. Kind/source/scope splits: ad hoc.",
        query: trends(
          [
            ev("widget_added", { name: "added" }),
            ev("widget_removed", { name: "removed" }),
            ev("widget_config_updated", { name: "config changed" }),
            ev("board_grid_changed", { name: "rearranged" }),
          ],
          { dateFrom: "-90d", interval: "week" }
        ),
      },
      {
        name: "Micro-feature usage (30d)",
        description:
          "ui_action totals by action — how often each small affordance is used.",
        query: trends([ev("ui_action")], {
          breakdown: "action",
          display: "ActionsBarValue",
        }),
      },
      {
        name: "Micro-feature reach (30d)",
        description:
          "Unique users per action — found-by-how-many, not used-how-often. The never-discovered features are the missing bars.",
        query: trends([ev("ui_action", { math: "dau", name: "users" })], {
          breakdown: "action",
          display: "ActionsBarValue",
        }),
      },
    ],
  },
  {
    name: "Engagement",
    description: `Do they come back? ${MANAGED}`,
    insights: [
      {
        name: "Active users",
        description: "Rolling WAU and MAU on /dashboard routes.",
        query: trends(
          [
            dashboardPageview({ math: "weekly_active", name: "WAU" }),
            dashboardPageview({ math: "monthly_active", name: "MAU" }),
          ],
          { dateFrom: "-90d" }
        ),
      },
      {
        name: "Link creators retention",
        description:
          "Weekly retention: first link_created → any later link_created.",
        query: retention(),
      },
      {
        name: "Power-user signals",
        description:
          "Unique users per week doing the things future Pro payers do. (Cohort version: build in UI — Cohorts API is not worth the brittleness.)",
        query: trends(
          [
            ev("api_key_created", { name: "created api key", math: "dau" }),
            ev("domain_verified", { name: "verified domain", math: "dau" }),
            ev("link_created", {
              name: "used geo rules",
              math: "dau",
              properties: [p("has_geo_rules", "true")],
            }),
          ],
          { dateFrom: "-90d", interval: "week" }
        ),
      },
    ],
  },
]

/** Dashboards this script used to manage — pruned of dead insights, then deleted. */
const RETIRED_DASHBOARDS = ["Widget board", "Micro-features"]

/* ---------- idempotent upserts ---------- */

async function findDashboard(projectId, name) {
  const { results } = await api(
    "GET",
    `/projects/${projectId}/dashboards/?limit=300&search=${encodeURIComponent(name)}`
  )
  return results.find((d) => d.name === name && !d.deleted) ?? null
}

async function upsertDashboard(projectId, def) {
  const existing = await findDashboard(projectId, def.name)
  if (existing) {
    await api("PATCH", `/projects/${projectId}/dashboards/${existing.id}/`, {
      description: def.description,
    })
    return existing.id
  }
  const created = await api("POST", `/projects/${projectId}/dashboards/`, {
    name: def.name,
    description: def.description,
  })
  return created.id
}

async function upsertInsight(projectId, dashboardId, def) {
  const { results } = await api(
    "GET",
    `/projects/${projectId}/insights/?limit=100&search=${encodeURIComponent(def.name)}`
  )
  const existing = results.find((i) => i.name === def.name && !i.deleted)
  const payload = {
    name: def.name,
    description: def.description,
    query: def.query,
    saved: true,
  }
  if (existing) {
    const dashboards = [
      ...new Set([...(existing.dashboards ?? []), dashboardId]),
    ]
    await api("PATCH", `/projects/${projectId}/insights/${existing.id}/`, {
      ...payload,
      dashboards,
    })
    return "updated"
  }
  await api("POST", `/projects/${projectId}/insights/`, {
    ...payload,
    dashboards: [dashboardId],
  })
  return "created"
}

/** Soft-delete insights on a managed dashboard that this file no longer defines. */
async function pruneDashboard(projectId, dashboardId, keepNames) {
  const dash = await api(
    "GET",
    `/projects/${projectId}/dashboards/${dashboardId}/`
  )
  for (const tile of dash.tiles ?? []) {
    const ins = tile.insight
    if (!ins || ins.deleted || keepNames.has(ins.name)) continue
    await api("PATCH", `/projects/${projectId}/insights/${ins.id}/`, {
      deleted: true,
    })
    console.log(`   − pruned  ${ins.name}`)
  }
}

/* ---------- run ---------- */

const projectId = await resolveProjectId()
console.log(`Project ${projectId} @ ${HOST}\n`)

const keepNames = new Set(
  DASHBOARDS.flatMap((d) => d.insights.map((i) => i.name))
)
const failures = []

for (const dash of DASHBOARDS) {
  try {
    const dashId = await upsertDashboard(projectId, dash)
    console.log(`▸ ${dash.name} (dashboard ${dashId})`)
    for (const insight of dash.insights) {
      try {
        const verb = await upsertInsight(projectId, dashId, insight)
        console.log(`   ✓ ${verb}  ${insight.name}`)
      } catch (err) {
        failures.push(`${dash.name} / ${insight.name}: ${err.message}`)
        console.log(`   ✗ FAILED ${insight.name}`)
      }
    }
    await pruneDashboard(projectId, dashId, keepNames).catch((err) =>
      failures.push(`${dash.name} prune: ${err.message}`)
    )
  } catch (err) {
    failures.push(`${dash.name}: ${err.message}`)
    console.log(`▸ ${dash.name} FAILED: ${err.message}`)
  }
}

for (const name of RETIRED_DASHBOARDS) {
  try {
    const dash = await findDashboard(projectId, name)
    if (!dash) continue
    console.log(`▸ retiring ${name} (dashboard ${dash.id})`)
    await pruneDashboard(projectId, dash.id, keepNames)
    await api("PATCH", `/projects/${projectId}/dashboards/${dash.id}/`, {
      deleted: true,
    })
  } catch (err) {
    failures.push(`retire ${name}: ${err.message}`)
  }
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n${failures.join("\n")}`)
  process.exit(1)
}
console.log("\nAll dashboards up to date.")
