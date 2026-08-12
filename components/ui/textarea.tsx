import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // field-sizing-content grows the box to fit its content in BOTH axes,
        // so it needs a bound on each: max-w-full plus anywhere-wrapping keeps
        // a long unbroken URL inside its container, and max-h stops the field
        // from swallowing the surface it sits in. Past that it scrolls.
        "field-sizing-content flex max-h-56 min-h-16 w-full max-w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors [overflow-wrap:anywhere] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
