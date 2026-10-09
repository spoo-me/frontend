"use client"

import type { FeatureMap, FeatureName } from "@/lib/api"
import { useFeatures } from "@/hooks/use-entitlements"

/** Pure: the features a draft uses that the account does not hold. Fails
    closed like the backend: an unknown state blocks. */
export function blockedFeatures(
  features: FeatureMap | null,
  used: FeatureName[]
): FeatureName[] {
  return [...new Set(used)].filter((f) => features?.[f] !== "enabled")
}

/**
 * The gate at the write. Every Pro control stays interactive; the draft
 * tells us which paid features it ended up using, and the submit button
 * turns into the upsell when any of them is missing from the plan.
 */
export function useProGate(draftUsesFeatures: FeatureName[]): {
  blocked: FeatureName[]
} {
  const { features } = useFeatures()
  return { blocked: blockedFeatures(features, draftUsesFeatures) }
}
