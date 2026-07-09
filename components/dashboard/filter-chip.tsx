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
    <span className="border-border/60 flex h-7 items-stretch overflow-hidden rounded-full border text-xs">
      <span className="bg-muted/60 text-muted-foreground flex items-center pr-2 pl-2.5">
        {label}
      </span>
      <span className="border-border/60 bg-card text-foreground flex items-center gap-1.5 border-l pr-1 pl-2">
        {icon}
        {value}
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear filter ${label}: ${value}`}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/60 flex size-5 items-center justify-center rounded-full transition-colors duration-150"
        >
          <X className="size-3" />
        </button>
      </span>
    </span>
  )
}
