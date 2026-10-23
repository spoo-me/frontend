/**
 * The feature vocabulary shared by the entitlements client, the plan
 * components and the copy table. Keys are the backend catalog's keys; the
 * backend may send more (ignore them) or fewer (missing = hidden).
 */
export type FeatureState = "enabled" | "locked" | "hidden"

export type FeatureName =
  | "geo_targeting"
  | "custom_meta_tags"
  | "ab_variants"
  | "expired_fallback"
  | "link_scheduling"
  | "custom_domains"
  | "domain_polish"
  | "qr_custom_logo"
  | "live_click_stream"
  | "analytics_extra_views"
  | "viral_full_tracking"
  | "webhooks"

export type LimitName =
  | "custom_domains_max"
  | "webhook_endpoints_max"
  | "api_keys_max"
  | "analytics_window_days"
  | "api_rate_multiplier"
  | "bulk_batch_max"

export type FeatureMap = Partial<Record<FeatureName, FeatureState>> &
  Record<string, FeatureState>
