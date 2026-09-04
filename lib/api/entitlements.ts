import { authedFetch, jsonInit, parse } from "./client"
import type { FeatureMap, LimitName } from "./features"

/**
 * GET /api/v1/me/entitlements: one call at app load for everything plan
 * shaped. `version` changes on every subscription or override write; every
 * authenticated response also carries it as X-Entitlements-Version so the
 * fetch layer can invalidate the query the moment it moves.
 */
export type PlanStatus =
  | "active"
  | "past_due"
  | "cancel_at_period_end"
  | "grace"
  | "lapsed"

export type PlanBlock = {
  name: "free" | "pro" | "selfhost" | "anonymous"
  status: PlanStatus | null
  until: string | null
  founding: boolean
  /** True when the term renews on its own at `until`; false when it ends there. */
  renews: boolean
}

export type LimitBlock = { max: number; used: number | null }

export type Entitlements = {
  version: number
  plan: PlanBlock
  features: FeatureMap
  limits: Partial<Record<LimitName, LimitBlock>> & Record<string, LimitBlock>
  over_limit: Record<string, { paused: string[] }>
}

export function getMyEntitlements() {
  return authedFetch("/api/v1/me/entitlements", { method: "GET" }).then((r) =>
    parse<Entitlements>(r)
  )
}

export type Price = { amount: number; currency: string }

export type PlansResponse = {
  plans: Array<{
    name: "free" | "pro"
    features: Record<string, boolean>
    limits: Record<string, number>
  }>
  prices: Partial<Record<Cadence, Price>>
  founding: {
    monthly: Price
    year: Price
    seats_total: number
    seats_left: number | null
    until: string | null
  } | null
}

export function getPlans() {
  return authedFetch("/api/v1/plans", { method: "GET" }).then((r) =>
    parse<PlansResponse>(r)
  )
}

export type Cadence = "monthly" | "year"

export function createCheckout(input: {
  cadence: Cadence
  from?: string
  return: string
}) {
  return authedFetch("/api/v1/billing/checkout", jsonInit("POST", input)).then(
    (r) => parse<{ url: string }>(r)
  )
}

export function createPortalSession() {
  return authedFetch("/api/v1/billing/portal", { method: "POST" }).then((r) =>
    parse<{ url: string }>(r)
  )
}

/** 204 on success, plain 403 for a non-Pro account. No version bump follows. */
export function completeProOnboarding() {
  return authedFetch("/api/v1/me/pro-onboarding", { method: "POST" }).then(
    (r) => {
      if (!r.ok) return parse<never>(r)
      return undefined
    }
  )
}
