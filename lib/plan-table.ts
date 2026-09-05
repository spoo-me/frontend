import type { PlansResponse } from "@/lib/api"
import { FEATURE_COPY, LIMIT_COPY, formatLimit } from "@/lib/entitlements/copy"

/**
 * Pure decisions behind the plan table shared by /pricing and /upgrade.
 * Which rows exist and how they group is a marketing decision and lives
 * here; every number in a cell comes from GET /api/v1/plans.
 */
export type PlanColumn = "free" | "pro" | "business"

export type PlanCell =
  | { kind: "value"; text: string }
  /** A paid feature this plan lacks: the cell names the plan that has it. */
  | { kind: "needs"; plan: "Pro" | "Business" }
  | { kind: "later" }
  | { kind: "loading" }

export type PlanRow = { label: string; cells: Record<PlanColumn, PlanCell> }

export type PlanGroupName =
  | "Links and domains"
  | "Routing"
  | "Analytics"
  | "Developer"

export type PlanGroup = { name: PlanGroupName; rows: PlanRow[] }

type Plan = PlansResponse["plans"][number]

const value = (text: string): PlanCell => ({ kind: "value", text })
const needsPro: PlanCell = { kind: "needs", plan: "Pro" }
const needsBusiness: PlanCell = { kind: "needs", plan: "Business" }
const later: PlanCell = { kind: "later" }
const loading: PlanCell = { kind: "loading" }

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString("en")} ${n === 1 ? one : many}`

/** A feature both paid columns carry and Free lacks (or carries too). */
function feature(
  key: keyof typeof FEATURE_COPY,
  free: Plan | undefined,
  pro: Plan | undefined
): PlanRow {
  const has = (p: Plan | undefined) =>
    p ? p.features[key] === true : undefined
  const cell = (on: boolean | undefined) =>
    on === undefined ? loading : on ? value("Included") : needsPro
  return {
    label: FEATURE_COPY[key].title,
    cells: {
      free: cell(has(free)),
      pro: cell(has(pro)),
      business: cell(has(pro)),
    },
  }
}

/** A counted limit rendered as a phrase per column; Business mirrors Pro. */
function limit(
  key: keyof typeof LIMIT_COPY,
  free: Plan | undefined,
  pro: Plan | undefined,
  phrase: (n: number) => string
): PlanRow {
  const cell = (p: Plan | undefined) => {
    if (!p) return loading
    const n = p.limits[key]
    if (n === undefined) return loading
    if (n === 0) return needsPro
    return value(n === -1 ? "Unlimited" : phrase(n))
  }
  return {
    label: LIMIT_COPY[key].label,
    cells: { free: cell(free), pro: cell(pro), business: cell(pro) },
  }
}

export function buildPlanGroups(
  plans: PlansResponse["plans"] | undefined
): PlanGroup[] {
  const free = plans?.find((p) => p.name === "free")
  const pro = plans?.find((p) => p.name === "pro")
  const all = (text: string): PlanRow["cells"] => ({
    free: value(text),
    pro: value(text),
    business: value(text),
  })
  return [
    {
      name: "Links and domains",
      rows: [
        { label: "Links and clicks", cells: all("Unlimited") },
        limit("custom_domains_max", free, pro, (n) =>
          plural(n, "custom domain", "custom domains")
        ),
        feature("custom_meta_tags", free, pro),
        feature("qr_custom_logo", free, pro),
        limit(
          "bulk_batch_max",
          free,
          pro,
          (n) => `${n.toLocaleString("en")} per batch`
        ),
        {
          label: "Team seats",
          cells: { free: needsBusiness, pro: needsBusiness, business: later },
        },
      ],
    },
    {
      name: "Routing",
      rows: [
        feature("geo_targeting", free, pro),
        feature("ab_variants", free, pro),
        feature("link_scheduling", free, pro),
        feature("expired_fallback", free, pro),
      ],
    },
    {
      name: "Analytics",
      rows: [
        limit(
          "analytics_window_days",
          free,
          pro,
          (n) => `${formatLimit("analytics_window_days", n)} of history`
        ),
        feature("analytics_extra_views", free, pro),
        feature("live_click_stream", free, pro),
        {
          label: "Conversion tracking",
          cells: { free: needsBusiness, pro: needsBusiness, business: later },
        },
      ],
    },
    {
      name: "Developer",
      rows: [
        limit("webhook_endpoints_max", free, pro, (n) =>
          plural(n, "webhook endpoint", "webhook endpoints")
        ),
        limit("api_keys_max", free, pro, (n) =>
          plural(n, "API key", "API keys")
        ),
        limit(
          "api_rate_multiplier",
          free,
          pro,
          (n) => `${formatLimit("api_rate_multiplier", n)} API rate`
        ),
      ],
    },
  ]
}

/** Whole-percent saving of the year price against twelve months, or null. */
export function yearlySavingPercent(
  prices: PlansResponse["prices"] | undefined
): number | null {
  const monthly = prices?.monthly?.amount
  const year = prices?.year?.amount
  if (!monthly || !year) return null
  const pct = Math.round((1 - year / (monthly * 12)) * 100)
  return pct > 0 ? pct : null
}

/** The founding window is open while seats and time both remain. */
export function foundingIsOpen(
  founding: PlansResponse["founding"],
  now: number
): founding is NonNullable<PlansResponse["founding"]> & { until: string } {
  return (
    founding !== null &&
    founding.until !== null &&
    (founding.seats_left ?? 0) > 0 &&
    new Date(founding.until).getTime() > now
  )
}

/** "37 of 100 seats left" when seats are counted, otherwise the days left. */
export function foundingRemaining(
  founding: { seats_total: number; seats_left: number | null; until: string },
  now: number
): string {
  if (founding.seats_left !== null)
    return `${founding.seats_left} of ${founding.seats_total} seats left`
  const days = Math.max(
    1,
    Math.ceil((new Date(founding.until).getTime() - now) / 86_400_000)
  )
  return plural(days, "day left", "days left")
}
