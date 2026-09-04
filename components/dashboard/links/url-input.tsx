"use client"

import * as React from "react"
import { Link2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/** A URL field that says so at a glance: leading link glyph, mono text.
    Placeholders name the blank state, the way date fields say "Never". */
export function UrlInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Link2
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <Input
        type="url"
        inputMode="url"
        spellCheck={false}
        className="pl-8 font-mono text-xs"
        {...props}
      />
    </div>
  )
}
