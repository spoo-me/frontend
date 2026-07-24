"use client"

import { Info } from "@/components/icons"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * The one help-icon tooltip: a quiet glyph that explains BEHAVIOR on hover
 * or focus. It sits in label rows without shifting them (size-5 hit target,
 * size-3.5 glyph, muted at rest) and never carries color. Content rides the
 * standard inverted tooltip. Keyboard-reachable by being a real button.
 */
export function InfoHint({
  children,
  label = "More info",
  className,
}: {
  /** The tooltip copy: one dry sentence about behavior, not the widget. */
  children: React.ReactNode
  /** Accessible name for the trigger. */
  label?: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex size-5 shrink-0 cursor-help items-center justify-center text-muted-foreground/60 transition-colors duration-150 hover:text-foreground",
            className
          )}
        >
          <Info className="size-3.5" strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}
