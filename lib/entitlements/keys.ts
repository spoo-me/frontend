import type { FeatureName, LimitName } from "@/lib/api/features"

/**
 * Every key the frontend renders plan state for. The mock backend serves
 * exactly these, and the copy table must cover each one, so the drift
 * guard has a single list to check against.
 */
export const FEATURE_KEYS = [
  "geo_targeting",
  "custom_meta_tags",
  "ab_variants",
  "expired_fallback",
  "link_scheduling",
  "custom_domains",
  "domain_polish",
  "qr_custom_logo",
  "live_click_stream",
  "analytics_extra_views",
  "viral_full_tracking",
  "webhooks",
] as const satisfies readonly FeatureName[]

export function isFeatureName(x: string | null): x is FeatureName {
  return x !== null && (FEATURE_KEYS as readonly string[]).includes(x)
}

export const LIMIT_KEYS = [
  "custom_domains_max",
  "webhook_endpoints_max",
  "api_keys_max",
  "analytics_window_days",
  "api_rate_multiplier",
  "bulk_batch_max",
] as const satisfies readonly LimitName[]

export function isLimitName(x: string | null): x is LimitName {
  return x !== null && (LIMIT_KEYS as readonly string[]).includes(x)
}

/** Plan defaults the mock backend serves; mirrors the backend catalog. */
export const MOCK_PLAN_DEFAULTS = {
  free: {
    features: Object.fromEntries(
      FEATURE_KEYS.map((k) => [k, k === "webhooks"])
    ) as Record<FeatureName, boolean>,
    limits: {
      custom_domains_max: 0,
      webhook_endpoints_max: 1,
      api_keys_max: 20,
      analytics_window_days: 90,
      api_rate_multiplier: 1,
      bulk_batch_max: 100,
    } satisfies Record<LimitName, number>,
  },
  pro: {
    features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, true])) as Record<
      FeatureName,
      boolean
    >,
    limits: {
      custom_domains_max: 5,
      webhook_endpoints_max: 10,
      api_keys_max: 20,
      analytics_window_days: 730,
      api_rate_multiplier: 5,
      bulk_batch_max: 1000,
    } satisfies Record<LimitName, number>,
  },
} as const
