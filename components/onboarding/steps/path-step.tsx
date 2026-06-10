"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OnboardingPath } from "@/lib/onboarding"

const BARS = [38, 62, 45, 80, 58, 92, 70]

function LinksPreview({ active }: { active: boolean }) {
  return (
    <div className="border-border/60 bg-muted/20 mt-4 rounded-lg border p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground/90 truncate font-mono text-[11px]">
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
      <div className="mt-2.5 flex h-9 items-end gap-1" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={cn(
              "flex-1 rounded-[2px] transition-colors duration-300",
              active ? "bg-brand/70" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  )
}

function ApiPreview({ active }: { active: boolean }) {
  return (
    <div className="border-border/60 bg-muted/20 mt-4 rounded-lg border p-3 text-left font-mono text-[11px] leading-5">
      <div>
        <span className={cn(active ? "text-brand" : "text-muted-foreground")}>
          POST
        </span>{" "}
        <span className="text-foreground/90">/api/v1/shorten</span>
      </div>
      <div className="text-muted-foreground/80">
        {"{"} url: <span className="text-foreground/70">&quot;https://…&quot;</span>{" "}
        {"}"}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-live">201</span>
        <span className="label-mono text-muted-foreground/60 text-[9px] tabular-nums">
          38ms
        </span>
      </div>
    </div>
  )
}

const PATHS: {
  value: OnboardingPath
  label: string
  description: string
  icon3d: string
  cta: string
  preview: (props: { active: boolean }) => React.ReactNode
}[] = [
  {
    value: "links",
    label: "Manage links",
    description: "Shorten, organize, and track everything from the dashboard.",
    icon3d: "/icons-3d/link_3D.png",
    cta: "Continue with links",
    preview: LinksPreview,
  },
  {
    value: "api",
    label: "Build with the API",
    description: "Keys, SDKs, and webhooks wired into your own stack.",
    icon3d: "/icons-3d/api_3D.png",
    cta: "Continue with the API",
    preview: ApiPreview,
  },
]

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
    <div className="flex flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        How will you use spoo.me?
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        We&apos;ll tailor the next step. Everything stays available either way.
      </p>

      <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {PATHS.map((p) => {
          const Preview = p.preview
          const isFocused = focus === p.value
          return (
            <div
              key={p.value}
              onMouseEnter={() => setFocus(p.value)}
              className={cn(
                "group flex flex-col rounded-xl border p-5 text-left transition-all",
                isFocused
                  ? "border-ring ring-ring/30 shadow-soft bg-card ring-2"
                  : "border-border/60 hover:border-border bg-card/50",
              )}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={p.icon3d}
                  alt=""
                  width={40}
                  height={40}
                  className={cn(
                    "size-10 object-contain transition-all duration-300",
                    isFocused
                      ? "scale-105 drop-shadow-[0_4px_12px_rgba(139,92,246,0.35)]"
                      : "opacity-80 grayscale-[35%]",
                  )}
                />
                <span className="text-foreground text-sm font-semibold">
                  {p.label}
                </span>
              </div>
              <span className="text-muted-foreground mt-3 text-[13px] leading-relaxed">
                {p.description}
              </span>
              <Preview active={isFocused} />
              <Button
                onClick={() => onChoose(p.value)}
                variant={isFocused ? "default" : "outline"}
                className="mt-4 h-9 w-full"
              >
                {p.cta}
                <ArrowRight className="size-3.5" data-icon="inline-end" />
              </Button>
            </div>
          )
        })}
      </div>

      <p className="label-mono text-muted-foreground/50 mt-8 text-[10px]">
        ← → to choose · ↵ to continue
      </p>
    </div>
  )
}
