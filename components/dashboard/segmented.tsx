"use client"

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string> = {
  value: T
  label?: string
  icon?: React.ElementType
  ariaLabel?: string
}

/**
 * The one segmented control (card headers, view toggles, metric switches).
 * Active state is a pill that SLIDES between options (layout animation,
 * 200ms ease-out) instead of teleporting.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<SegmentedOption<T>>
  className?: string
}) {
  const id = React.useId()
  return (
    <span
      role="radiogroup"
      className={cn(
        "flex h-7 items-center rounded-lg border border-border/60 bg-muted/40 p-0.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.ariaLabel ?? opt.label ?? opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex h-6 items-center justify-center rounded-md font-mono text-[11px] transition-colors duration-150",
              Icon && !opt.label ? "w-7" : "px-2",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-md border border-border/60 bg-card"
              />
            )}
            <span className="relative flex items-center gap-1">
              {Icon && <Icon className="size-3.5" strokeWidth={1.75} />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </span>
  )
}
