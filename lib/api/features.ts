import { authedFetch, parse } from "./client"

/**
 * Per-account feature availability (GET /api/v1/me/features) — the read
 * side of backend feature gating. The backend enforces the same gates on
 * its write endpoints; this only tells the UI what to render.
 *
 * `locked` is reserved: the backend emits it once paid plans exist, and
 * gated surfaces switch from invisible to upgrade-gated with no frontend
 * change beyond providing the locked rendering.
 */
export type FeatureState = "enabled" | "locked" | "hidden"

/** The gated features this frontend knows how to render. The backend may
    send more (ignore them) or fewer (missing = hidden). */
export type FeatureName =
  | "custom_domains"
  | "geo_targeting"
  | "custom_meta_tags"
  | "ab_testing"
  | "webhooks"
  | "expired_fallback"

export type FeatureMap = Partial<Record<FeatureName, FeatureState>> &
  Record<string, FeatureState>

export function getMyFeatures() {
  return authedFetch("/api/v1/me/features", { method: "GET" }).then((r) =>
    parse<{ features: FeatureMap }>(r)
  )
}
