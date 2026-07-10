import posthog from "posthog-js"

import type { AuthUser } from "@/lib/api/auth"
import type { ShortenInput, UpdateUrlInput } from "@/lib/api/links"
import type { OnboardingPath, OnboardingStep } from "@/lib/onboarding"

/**
 * Product-analytics facade — the only module allowed to import posthog-js
 * (ESLint enforces this). Components call the typed emitters below; the
 * event names and property shapes live here and nowhere else, so the two
 * surfaces that share an action (dashboard + onboarding) can never drift.
 *
 * Without NEXT_PUBLIC_POSTHOG_KEY (mock mode, self-hosters, CI) every call
 * is a no-op — in dev the would-be event is console.debug'd instead, so
 * instrumentation is verifiable by eye against the mock backend.
 *
 * Properties are booleans, counts and enum strings only. Raw URLs,
 * passwords, tokens and emails never leave the app; keep it that way.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

let ready = false

/** Called once from instrumentation-client.ts, before hydration. */
export function initAnalytics() {
  if (ready || !KEY || typeof window === "undefined") return
  posthog.init(KEY, {
    // Same-origin reverse proxy (next.config.mjs) — first-party requests,
    // invisible to ad-block hostlists, EU data residency behind it.
    api_host: "/relay",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  })
  ready = true
}

function capture(event: string, props?: Record<string, unknown>) {
  if (!ready) {
    if (process.env.NODE_ENV === "development")
      console.debug(`[analytics] ${event}`, props ?? {})
    return
  }
  posthog.capture(event, props)
}

/* ---------- identity (wired in auth-context, nowhere else) ---------- */

/** Idempotent — safe to call on every session hydrate. No email: person
    properties stay PII-free by policy. */
export function identifyUser(user: AuthUser) {
  if (!ready) return
  posthog.identify(user.id, {
    plan: user.plan,
    email_verified: user.email_verified,
  })
}

/** Unlinks the device from the account so the next visitor starts clean.
    Call only on a real identified → signed-out transition; resetting an
    anonymous session would rotate its distinct id for nothing. */
export function resetUser() {
  if (!ready) return
  posthog.reset()
}

/* ---------- auth ---------- */

export function trackSignedUp(method: "password") {
  capture("user_signed_up", { method })
}

export function trackLoggedIn(method: "password") {
  capture("user_logged_in", { method })
}

/* ---------- links ---------- */

export function trackLinkCreated(
  input: ShortenInput,
  surface: "composer" | "onboarding",
) {
  const geoCount = Object.keys(input.geo_rules ?? {}).length
  const variantCount = input.ab_variants?.length ?? 0
  capture("link_created", {
    surface,
    is_custom_alias: !!input.alias,
    has_custom_domain: !!input.domain,
    has_password: !!input.password,
    has_expiry: input.expire_after != null,
    has_max_clicks: input.max_clicks != null,
    has_geo_rules: geoCount > 0,
    geo_rules_count: geoCount,
    has_ab_variants: variantCount > 0,
    ab_variants_count: variantCount,
    has_meta_tags: !!input.meta_tags,
    block_bots: !!input.block_bots,
    private_stats: !!input.private_stats,
  })
}

export function trackLinkUpdated(patch: UpdateUrlInput) {
  capture("link_updated", {
    changed_fields: Object.keys(patch).sort(),
    changed_count: Object.keys(patch).length,
  })
}

export function trackLinkDeleted() {
  capture("link_deleted")
}

/* ---------- API keys ---------- */

export function trackApiKeyCreated(
  input: { scopes: string[]; hasExpiry: boolean },
  surface: "developer" | "onboarding",
) {
  capture("api_key_created", {
    surface,
    scopes: [...input.scopes].sort(),
    scopes_count: input.scopes.length,
    has_admin_scope: input.scopes.some((s) => s.startsWith("admin")),
    has_expiry: input.hasExpiry,
  })
}

export function trackApiKeyDeleted(mode: "revoke" | "delete") {
  capture("api_key_deleted", { mode })
}

/* ---------- custom domains ---------- */

export function trackDomainAdded() {
  capture("domain_added")
}

export function trackDomainVerified(daysToVerify: number | null) {
  capture("domain_verified", {
    ...(daysToVerify != null ? { days_to_verify: daysToVerify } : {}),
  })
}

/* ---------- widget board ---------- */

export function trackWidgetAdded(kind: string, page: string) {
  capture("widget_added", { widget_kind: kind, page })
}

export function trackBoardLayoutReset(page: string) {
  capture("board_layout_reset", { page })
}

export function trackBoardLayoutExported(page: string) {
  capture("board_layout_exported", { page })
}

export function trackBoardLayoutImported(page: string) {
  capture("board_layout_imported", { page })
}

/* ---------- onboarding ---------- */

export function trackOnboardingStepCompleted(
  step: OnboardingStep,
  path?: OnboardingPath,
) {
  capture("onboarding_step_completed", {
    step,
    ...(path ? { path } : {}),
  })
}

/** Skips are derivable: a completed funnel without a link_created /
    api_key_created event at surface=onboarding means the step was skipped. */
export function trackOnboardingCompleted(props: {
  heardFrom?: string
  artifactKind: "link" | "key" | null
}) {
  capture("onboarding_completed", {
    artifact_kind: props.artifactKind,
    ...(props.heardFrom ? { heard_from: props.heardFrom } : {}),
  })
}
