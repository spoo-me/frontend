"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/** Click cap with its unit kept inside the field, so "500" never reads as a
    bare number next to a date. Empty means unlimited. */
export function ClickCapInput({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn("relative w-40 shrink-0", className)}>
      <Input
        type="number"
        min={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Unlimited"
        aria-label="Click cap"
        className="pr-14 font-mono text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] text-muted-foreground"
      >
        clicks
      </span>
    </div>
  )
}
