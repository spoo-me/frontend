"use client"

import * as React from "react"

import type { FeatureName, LimitName } from "@/lib/api"
import { LIMIT_COPY } from "@/lib/entitlements/copy"
import { useFeature, useLimit } from "@/hooks/use-entitlements"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProMark } from "./pro-mark"
import { UpsellDialog, type UpsellTrigger } from "./upsell-dialog"

/** A counted resource: `used / max` in muted mono next to the heading. A
    plan with none of the resource shows no counter. */
export function LimitCounter({
  limit,
  className,
}: {
  limit: LimitName
  className?: string
}) {
  const view = useLimit(limit)
  if (view.unlimited || view.max === 0) return null
  return (
    <span
      className={cn(
        "font-mono text-[11px] text-muted-foreground tabular-nums",
        view.atLimit && "text-foreground",
        className
      )}
      aria-label={`${LIMIT_COPY[limit].label}: ${view.used} of ${view.max}`}
    >
      {view.used} / {view.max}
    </span>
  )
}

/**
 * The add button of a counted resource. Never disabled: at the limit, or
 * while the feature itself is locked, it carries the Pro mark and opens the
 * upsell instead of adding.
 */
export function Limited({
  limit,
  feature,
  onAdd,
  children,
  className,
}: {
  limit: LimitName
  /** The feature that owns the resource; locked gates before the count does. */
  feature?: FeatureName
  onAdd: () => void
  children: React.ReactNode
  className?: string
}) {
  const view = useLimit(limit)
  const locked = useFeature(feature ?? "custom_domains") === "locked"
  const [open, setOpen] = React.useState(false)
  const trigger: UpsellTrigger =
    feature && locked
      ? { kind: "features", features: [feature] }
      : { kind: "limit", limit }
  const gated = (feature !== undefined && locked) || view.atLimit
  return (
    <>
      <Button
        className={className}
        onClick={gated ? () => setOpen(true) : onAdd}
      >
        {children}
        {gated && <ProMark onPrimary />}
      </Button>
      <UpsellDialog trigger={trigger} open={open} onOpenChange={setOpen} />
    </>
  )
}
