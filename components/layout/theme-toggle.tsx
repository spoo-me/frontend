"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

type Mode = "system" | "light" | "dark"

const modes: { value: Mode; icon: React.ElementType; label: string }[] = [
  { value: "system", icon: Monitor, label: "System theme" },
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const active = (mounted ? (theme as Mode) : "system") ?? "system"

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      suppressHydrationWarning
      className="border-border/60 bg-background/40 inline-flex h-8 items-center rounded-full border p-0.5"
    >
      {modes.map(({ value, icon: Icon, label }) => {
        const isActive = mounted && active === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            suppressHydrationWarning
            onClick={() => setTheme(value)}
            className={cn(
              "relative inline-flex size-7 items-center justify-center rounded-full transition-colors",
              isActive
                ? "ring-border/80 text-foreground bg-muted/60 ring-1"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
