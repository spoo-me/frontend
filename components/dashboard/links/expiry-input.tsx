"use client"

import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateTimeField } from "@/components/dashboard/date-time-field"

/**
 * How the link ends, as one field with two segments: a date and a click
 * cap. Either alone ends the link; both means whichever comes first. The
 * wrapper owns the border and focus ring so the segments read as one input.
 */
export function ExpiryInput({
  expiry,
  onExpiryChange,
  maxClicks,
  onMaxClicksChange,
  minDate,
  clearable = false,
  className,
}: {
  expiry: string
  onExpiryChange: (value: string) => void
  maxClicks: string
  onMaxClicksChange: (value: string) => void
  minDate?: Date
  /** Show an inline clear on the date segment (the cap clears by deleting). */
  clearable?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-0 items-stretch rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className
      )}
    >
      <DateTimeField
        value={expiry}
        onChange={onExpiryChange}
        placeholder="Never"
        minDate={minDate}
        className="min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent dark:shadow-none"
      />
      {clearable && expiry && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove expiry"
          className="my-auto mr-1 shrink-0"
          onClick={() => onExpiryChange("")}
        >
          <X />
        </Button>
      )}
      <div aria-hidden className="my-1.5 w-px shrink-0 bg-border" />
      <div className="relative w-28 shrink-0 sm:w-36">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={maxClicks}
          onChange={(e) => onMaxClicksChange(e.target.value)}
          placeholder="Unlimited"
          aria-label="Click cap"
          className="h-full w-full bg-transparent pr-14 pl-2.5 font-mono text-xs outline-none [appearance:textfield] placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-[11px] text-muted-foreground"
        >
          clicks
        </span>
      </div>
    </div>
  )
}
