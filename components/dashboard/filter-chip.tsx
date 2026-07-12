"use client"

import * as React from "react"
import { X } from "lucide-react"

/**
 * Applied-filter pill, duotone: muted label segment | hairline | value
 * segment with the dismiss button. Shared by the links and stats pages.
 */
export function FilterChip({
  label,
  value,
  icon,
  onClear,
}: {
  label: string
  value: string
  /** Identity/property icon shown at the start of the value segment. */
  icon?: React.ReactNode
  onClear: () => void
}) {
  return (
    <span className="flex h-7 items-stretch overflow-hidden rounded-full border border-border/60 text-xs">
      <span className="flex items-center bg-muted/60 pr-2 pl-2.5 text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1.5 border-border/60 border-l bg-card pr-1 pl-2 text-foreground">
        {icon}
        {value}
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear filter ${label}: ${value}`}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </span>
    </span>
  )
}
