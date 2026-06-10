"use client"

import * as React from "react"
import { Link2, Terminal } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OnboardingPath } from "@/lib/onboarding"

const PATHS: {
  value: OnboardingPath
  label: string
  description: string
  icon: typeof Link2
  bullets: string[]
}[] = [
  {
    value: "links",
    label: "Manage links",
    description: "Shorten, organize, and track everything from the dashboard.",
    icon: Link2,
    bullets: ["Custom aliases & QR codes", "Click analytics", "Password & expiry rules"],
  },
  {
    value: "api",
    label: "Build with the API",
    description: "Keys, SDKs, and webhooks wired into your own stack.",
    icon: Terminal,
    bullets: ["REST API & typed SDKs", "Scoped API keys", "Webhooks & exports"],
  },
]

export function PathStep({
  onDone,
}: {
  onDone: (path: OnboardingPath) => void
}) {
  const [focus, setFocus] = React.useState<OnboardingPath>("links")

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        setFocus((f) => (f === "links" ? "api" : "links"))
      } else if (e.key === "Enter") {
        e.preventDefault()
        onDone(focus)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [focus, onDone])

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        How will you use spoo.me?
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        We&apos;ll tailor the next step. Everything stays available either way.
      </p>

      <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {PATHS.map((p) => {
          const Icon = p.icon
          const isFocused = focus === p.value
          return (
            <button
              key={p.value}
              onClick={() => onDone(p.value)}
              onMouseEnter={() => setFocus(p.value)}
              className={cn(
                "group flex flex-col rounded-xl border p-5 text-left transition-all",
                isFocused
                  ? "border-ring ring-ring/30 shadow-soft bg-card ring-2"
                  : "border-border/60 hover:border-border bg-card/50",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border transition-colors",
                  isFocused
                    ? "border-brand/30 bg-brand/10 text-brand"
                    : "border-border/60 bg-muted/40 text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-foreground mt-4 text-sm font-semibold">
                {p.label}
              </span>
              <span className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                {p.description}
              </span>
              <ul className="mt-4 space-y-1.5">
                {p.bullets.map((b) => (
                  <li
                    key={b}
                    className="text-muted-foreground/80 flex items-center gap-2 text-xs"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1 rounded-full transition-colors",
                        isFocused ? "bg-brand" : "bg-border",
                      )}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <p className="label-mono text-muted-foreground/50 mt-8 text-[10px]">
        ← → to choose · ↵ to continue
      </p>
    </div>
  )
}
