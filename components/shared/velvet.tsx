"use client"

import type * as React from "react"

import type { FeatureName } from "@/lib/api"
import { useFeature } from "@/hooks/use-entitlements"

/**
 * The velvet rope. Hidden accounts see nothing, as if the feature never
 * existed. Everyone else gets the real, working control; the plan is
 * enforced at the write (useProGate), never by dimming.
 */
export function Velvet({
  feature,
  children,
}: {
  feature: FeatureName
  children: React.ReactNode
}) {
  return useFeature(feature) === "hidden" ? null : <>{children}</>
}
