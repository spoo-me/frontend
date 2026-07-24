import type * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Styled native <select> — the public intake forms' picker (contact,
 * report). Deliberately NOT the Radix Select (ui/select.tsx, dashboard
 * chrome): on marketing pages the platform dropdown keeps the OS picker
 * on mobile and native keyboard behavior, and works before hydration.
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] [&>option]:bg-background",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export { NativeSelect }
