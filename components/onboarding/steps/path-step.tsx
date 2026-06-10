"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OnboardingPath } from "@/lib/onboarding"

const BARS = [38, 62, 45, 80, 58, 92, 70, 64, 84]

/* The stage illustrations ARE the product — enlarged, floating panels. */

function LinksIllustration({ active }: { active: boolean }) {
  return (
    <div className="border-border/60 bg-card shadow-card w-64 rounded-xl border p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground/90 truncate font-mono text-xs">
          spoo.me/launch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="bg-live absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            <span className="bg-live relative inline-flex size-1.5 rounded-full" />
          </span>
          <span className="label-mono text-muted-foreground/70 text-[9px] tabular-nums">
            1,284 clicks
          </span>
        </span>
      </div>
      <div className="mt-3 flex h-14 items-end gap-1" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={cn(
              "flex-1 rounded-[2px] transition-colors duration-500",
              active ? "bg-brand/70" : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="text-muted-foreground/70 mt-2.5 flex items-center justify-between font-mono text-[9px] tabular-nums">
        <span>last 7 days</span>
        <span className="text-live">+38%</span>
      </div>
    </div>
  )
}

function ApiIllustration({ active }: { active: boolean }) {
  return (
    <div className="border-border/60 bg-card shadow-card w-64 rounded-xl border p-4 text-left font-mono text-xs leading-6">
      <div>
        <span className={cn("transition-colors duration-500", active ? "text-brand" : "text-muted-foreground")}>
          POST
        </span>{" "}
        <span className="text-foreground/90">/api/v1/shorten</span>
      </div>
      <div className="text-muted-foreground/80">
        {"{"} url: <span className="text-foreground/70">&quot;https://…&quot;</span> {"}"}
      </div>
      <div className="border-border/50 mt-2 border-t pt-2">
        <span className="text-live">201 Created</span>
        <span className="text-muted-foreground/60 ml-2 text-[10px]">38ms</span>
      </div>
      <div className="text-muted-foreground/80">
        short_url: <span className="text-foreground/70">&quot;spoo.me/x9Tz&quot;</span>
      </div>
    </div>
  )
}

const PATHS: {
  value: OnboardingPath
  label: string
  description: React.ReactNode
  cta: string
  illustration: (props: { active: boolean }) => React.ReactNode
}[] = [
  {
    value: "links",
    label: "Manage links",
    description: (
      <>
        <U>Short links</U>, <U>QR codes</U>, and <U>real-time analytics</U> —
        organized from one dashboard.
      </>
    ),
    cta: "Continue with links",
    illustration: LinksIllustration,
  },
  {
    value: "api",
    label: "Build with the API",
    description: (
      <>
        <U>REST API</U>, <U>typed SDKs</U>, and <U>webhooks</U> wired straight
        into your own stack.
      </>
    ),
    cta: "Continue with the API",
    illustration: ApiIllustration,
  },
]

function U({ children }: { children: React.ReactNode }) {
  return (
    <span className="decoration-border text-foreground/80 underline underline-offset-4">
      {children}
    </span>
  )
}

export function PathStep({
  onChoose,
}: {
  onChoose: (path: OnboardingPath) => void
}) {
  const [focus, setFocus] = React.useState<OnboardingPath>("links")

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        setFocus((f) => (f === "links" ? "api" : "links"))
      } else if (e.key === "Enter") {
        e.preventDefault()
        onChoose(focus)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [focus, onChoose])

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        How will you use spoo.me?
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        We&apos;ll tailor the next step. Everything stays available either way.
      </p>

      <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {PATHS.map((p) => {
          const Illustration = p.illustration
          const isFocused = focus === p.value
          return (
            <div
              key={p.value}
              onMouseEnter={() => setFocus(p.value)}
              className={cn(
                "bg-card/40 flex flex-col rounded-2xl border p-7 transition-colors duration-300",
                isFocused ? "border-ring/60" : "border-border/60",
              )}
            >
              {/* Stage — the product itself is the illustration */}
              <div className="pattern-dots relative flex h-44 items-center justify-center rounded-xl">
                <div
                  aria-hidden
                  className={cn(
                    "bg-brand/10 absolute size-32 rounded-full blur-2xl transition-opacity duration-500",
                    isFocused ? "opacity-100" : "opacity-0",
                  )}
                />
                <div
                  className={cn(
                    "relative transition-transform duration-500",
                    isFocused && "-translate-y-1",
                  )}
                >
                  <Illustration active={isFocused} />
                </div>
              </div>

              <h2 className="text-foreground mt-7 text-base font-semibold">
                {p.label}
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-60 flex-1 text-[13px] leading-relaxed">
                {p.description}
              </p>

              <Button
                onClick={() => onChoose(p.value)}
                variant={isFocused ? "default" : "outline"}
                className="mt-7 h-10 w-full"
              >
                {p.cta}
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
