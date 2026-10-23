"use client"

import type { FeatureName } from "@/lib/api"
import { useFeature } from "@/hooks/use-entitlements"
import { cn } from "@/lib/utils"

/**
 * The one Pro mark. Used wherever a paid feature is named (section titles,
 * gated buttons, the plan row, the upgrade page, the tour), at most once per
 * control, never as a status pill. Its look changes in exactly one place:
 * here. It is also the one dashboard element allowed to carry the brand
 * violet as a gradient.
 */
function Star({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className={className}
      fill="currentColor"
    >
      <path d="M5 0C5.35 3.05 6.95 4.65 10 5C6.95 5.35 5.35 6.95 5 10C4.65 6.95 3.05 5.35 0 5C3.05 4.65 4.65 3.05 5 0Z" />
    </svg>
  )
}

export function ProMark({
  className,
  size = "sm",
  onPrimary = false,
}: {
  className?: string
  size?: "xs" | "sm" | "md"
  /** Inside a primary button: the chip alone, no sheen or corner stars. */
  onPrimary?: boolean
}) {
  return (
    <span
      aria-label="Pro"
      className={cn(
        "pro-mark relative inline-flex select-none items-center rounded-[4px] font-medium font-mono uppercase leading-none tracking-[0.14em]",
        size === "xs" && "h-3 pr-[3px] pl-[2px] text-[8px]",
        size === "sm" && "h-[15px] pr-1 pl-[3px] text-[9px]",
        size === "md" && "h-[18px] pr-1.5 pl-1 text-[10px]",
        className
      )}
    >
      {!onPrimary && (
        <span className="pro-mark-sheen absolute inset-0 overflow-hidden rounded-[4px]" />
      )}
      <Star
        className={cn(
          "pro-mark-glyph relative shrink-0",
          size === "xs" && "mr-[2px] size-[8px]",
          size === "sm" && "mr-[3px] size-[10px]",
          size === "md" && "mr-1 size-[12px]"
        )}
      />
      <span className="relative">pro</span>
      {!onPrimary && (
        <>
          <Star className="pro-mark-star pro-mark-star-1" />
          <Star className="pro-mark-star pro-mark-star-2" />
          <Star className="pro-mark-star pro-mark-star-3" />
        </>
      )}
    </span>
  )
}

/** The mark next to a section title, only while the account lacks the feature. */
export function FeatureMark({ feature }: { feature: FeatureName }) {
  return useFeature(feature) === "locked" ? <ProMark /> : null
}
