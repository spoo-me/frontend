"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { themeTransition } from "@/components/theme-provider"

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const

export function ThemeStep({ onDone }: { onDone: () => void }) {
  const { theme, setTheme } = useTheme()
  const active = theme ?? "dark"

  function pick(value: string) {
    if (value === active) return
    themeTransition(() => setTheme(value))
  }

  // Arrow keys move the selection; Enter advances (form-free step).
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onDone()
        return
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const i = THEMES.findIndex((t) => t.value === active)
      const next =
        THEMES[(i + (e.key === "ArrowRight" ? 1 : THEMES.length - 1)) % THEMES.length]
      pick(next.value)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Pick your theme
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        Change it any time with the{" "}
        <kbd className="border-border/70 bg-muted/50 rounded border px-1.5 py-0.5 font-mono text-[11px]">
          D
        </kbd>{" "}
        key or from the footer.
      </p>

      <div
        role="radiogroup"
        aria-label="Theme"
        className="mt-10 grid w-full max-w-md grid-cols-3 gap-3"
      >
        {THEMES.map((t) => (
          <button
            key={t.value}
            role="radio"
            aria-checked={active === t.value}
            onClick={() => pick(t.value)}
            className={cn(
              "group rounded-xl border p-1.5 text-left transition-all",
              active === t.value
                ? "border-ring ring-ring/30 shadow-soft ring-2"
                : "border-border/60 hover:border-border",
            )}
          >
            <ThemePreview value={t.value} />
            <span
              className={cn(
                "mt-2 block px-1.5 pb-1 text-xs font-medium transition-colors",
                active === t.value ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <Button onClick={onDone} className="mt-10 h-10 min-w-44">
        Continue
      </Button>
      <p className="label-mono text-muted-foreground/50 mt-3 text-[10px]">
        press ↵ to continue
      </p>
    </div>
  )
}

/** Mini UI mock rendered in the candidate scheme — no theme switch needed. */
function ThemePreview({ value }: { value: string }) {
  if (value === "system") {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        <div className="absolute inset-0 [clip-path:polygon(0_0,55%_0,45%_100%,0_100%)]">
          <MiniWindow scheme="light" />
        </div>
        <div className="absolute inset-0 [clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)]">
          <MiniWindow scheme="dark" />
        </div>
      </div>
    )
  }
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg">
      <MiniWindow scheme={value as "light" | "dark"} />
    </div>
  )
}

function MiniWindow({ scheme }: { scheme: "light" | "dark" }) {
  const dark = scheme === "dark"
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-full flex-col gap-1.5 border p-2",
        dark ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-white",
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn("size-1.5 rounded-full", dark ? "bg-white/20" : "bg-black/15")} />
        <span className={cn("h-1.5 w-8 rounded-full", dark ? "bg-white/15" : "bg-black/10")} />
      </div>
      <span className={cn("mt-1 h-2 w-3/4 rounded-full", dark ? "bg-white/25" : "bg-black/20")} />
      <span className={cn("h-1.5 w-1/2 rounded-full", dark ? "bg-white/10" : "bg-black/10")} />
      <div className="mt-auto flex gap-1">
        <span className="bg-brand/70 h-3 w-8 rounded-sm" />
        <span className={cn("h-3 w-8 rounded-sm", dark ? "bg-white/10" : "bg-black/5")} />
      </div>
    </div>
  )
}
