"use client"

import * as React from "react"

import type { FeatureName } from "@/lib/api"
import { useFeature } from "@/hooks/use-features"

/**
 * The velvet rope: renders children only for accounts whose backend says
 * the feature is enabled — hidden accounts see nothing, as if the feature
 * never existed. `locked` is the future upsell slot: unused until paid
 * plans ship and the backend starts emitting the state.
 */
export function Velvet({
  feature,
  locked = null,
  children,
}: {
  feature: FeatureName
  locked?: React.ReactNode
  children: React.ReactNode
}) {
  const state = useFeature(feature)
  if (state === "enabled") return <>{children}</>
  if (state === "locked") return <>{locked}</>
  return null
}
