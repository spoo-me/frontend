import type { FeatureName, LimitName } from "@/lib/api/features"

/**
 * Every word the plan surfaces show. Copy lives here, never in backend
 * prose, so the upsell dialog, the limit counters and the upgrade page all
 * say the same thing about the same key.
 */
export type FeatureCopy = {
  /** Short name as it appears next to the Pro mark. */
  title: string
  /** One dry sentence: what the feature does for the person reading it. */
  blurb: string
  /** Which onboarding group it belongs to. */
  group: "domain" | "preview" | "qr" | "routing" | "live" | "analytics" | "api"
}

export const FEATURE_COPY: Record<FeatureName, FeatureCopy> = {
  custom_domains: {
    title: "Custom domains",
    blurb: "Short links on a domain you own, up to five of them.",
    group: "domain",
  },
  domain_polish: {
    title: "Domain polish",
    blurb:
      "Root redirect, a custom 404 and public pages without spoo.me chrome.",
    group: "domain",
  },
  custom_meta_tags: {
    title: "Custom social preview",
    blurb:
      "Your own title, description and image on the card people see when a link is shared.",
    group: "preview",
  },
  qr_custom_logo: {
    title: "Branded QR codes",
    blurb: "Your logo in the middle of every QR code.",
    group: "qr",
  },
  geo_targeting: {
    title: "Geo targeting",
    blurb: "Send visitors from a country to a different destination.",
    group: "routing",
  },
  ab_variants: {
    title: "A/B variants",
    blurb: "Split visitors across destinations by weight and compare.",
    group: "routing",
  },
  expired_fallback: {
    title: "Expired-link fallback",
    blurb:
      "Where visitors land once a link has ended, instead of an ended page.",
    group: "routing",
  },
  link_scheduling: {
    title: "Link scheduling",
    blurb: "Set the moment a link goes live, with a page for early visitors.",
    group: "routing",
  },
  live_click_stream: {
    title: "Live click stream",
    blurb: "Clicks as they happen, across every link you own.",
    group: "live",
  },
  analytics_extra_views: {
    title: "Hour and weekday views",
    blurb: "Clicks by hour of day and day of week, with bots split out.",
    group: "analytics",
  },
  viral_full_tracking: {
    title: "Every click recorded",
    blurb:
      "Links that go viral keep tracking at the edge; nothing is dropped under load.",
    group: "analytics",
  },
  webhooks: {
    title: "Webhooks",
    blurb: "Events delivered to your endpoints as they happen.",
    group: "api",
  },
}

export type LimitCopy = {
  /** Sentence-case label for the counter ("Domains 2 / 5"). */
  label: string
  /** Singular noun for "Remove a domain to add another". */
  noun: string
}

export const LIMIT_COPY: Record<LimitName, LimitCopy> = {
  custom_domains_max: {
    label: "Domains",
    noun: "domain",
  },
  webhook_endpoints_max: {
    label: "Endpoints",
    noun: "endpoint",
  },
  api_keys_max: {
    label: "API keys",
    noun: "key",
  },
  analytics_window_days: {
    label: "Analytics window",
    noun: "day",
  },
  api_rate_multiplier: {
    label: "API rate",
    noun: "request",
  },
  bulk_batch_max: {
    label: "Bulk batch",
    noun: "link",
  },
}

/** Plan comparison rows for the upgrade page, in display order. */
export const COMPARISON_FEATURES: FeatureName[] = [
  "custom_domains",
  "domain_polish",
  "custom_meta_tags",
  "qr_custom_logo",
  "geo_targeting",
  "ab_variants",
  "expired_fallback",
  "link_scheduling",
  "live_click_stream",
  "analytics_extra_views",
  "viral_full_tracking",
]

export const COMPARISON_LIMITS: LimitName[] = [
  "custom_domains_max",
  "webhook_endpoints_max",
  "analytics_window_days",
  "api_rate_multiplier",
  "bulk_batch_max",
]

export function formatLimit(key: LimitName, value: number): string {
  if (value === -1) return "Unlimited"
  switch (key) {
    case "analytics_window_days":
      return value >= 365 ? `${Math.round(value / 365)} years` : `${value} days`
    case "api_rate_multiplier":
      return `${value}x`
    default:
      return String(value)
  }
}
