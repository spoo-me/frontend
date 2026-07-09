"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Mini keycap for shortcut hints — one style everywhere. */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        "border-border/60 bg-muted/50 text-muted-foreground flex h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-mono text-[10px]",
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/** "⌘" on macOS, "Ctrl" elsewhere — for cross-platform hints. */
export function useModKey() {
  const [mod, setMod] = React.useState("⌘")
  React.useEffect(() => {
    if (!/Mac|iP(hone|ad|od)/.test(navigator.platform)) setMod("Ctrl")
  }, [])
  return mod
}
