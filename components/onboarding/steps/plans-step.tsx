"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { PlanId } from "@/lib/onboarding"

/* Compact plan glance — not the full /pricing page. Free is the default;
   "Continue as free" is the forward action. Numbers mirror /pricing
   (launch placeholders). */
const PLANS: {
  id: PlanId
  name: string
  price: number
  tagline: string
  features: string[]
  recommended?: boolean
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Personal links & side projects",
    features: ["100 links / mo", "10K clicks / mo", "QR codes + 5 API keys"],
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    tagline: "Creators & growing projects",
    features: ["Unlimited links", "100K clicks / mo", "Webhooks & alerts"],
  },
  {
    id: "business",
    name: "Business",
    price: 29,
    tagline: "Teams shipping at scale",
    features: ["1M clicks / mo", "10 team seats", "SLA + audit log"],
  },
]

export function PlansStep({ onChoose }: { onChoose: (plan: PlanId) => void }) {
  const [selected, setSelected] = React.useState<PlanId>("free")

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onChoose(selected)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, onChoose])

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Start free.{" "}
        <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
          Upgrade when your links do.
        </span>
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        No card required to keep going — switch plans anytime from your
        dashboard.
      </p>

      <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {PLANS.map((p) => {
          const isSel = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              aria-pressed={isSel}
              className={cn(
                "group bg-card/40 relative flex flex-col rounded-2xl border p-5 text-left transition-colors duration-300",
                isSel
                  ? "border-ring/60 ring-ring/20 ring-1"
                  : "border-border/60 hover:border-border",
              )}
            >
              {p.recommended && (
                <span className="label-mono text-muted-foreground/70 border-border/60 bg-muted/40 absolute top-4 right-4 rounded-full border px-2 py-0.5 text-[9px]">
                  Recommended
                </span>
              )}

              <div className="text-foreground text-sm font-semibold">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
                  ${p.price}
                </span>
                {p.price > 0 && (
                  <span className="text-muted-foreground/70 text-xs">/mo</span>
                )}
              </div>
              <p className="text-muted-foreground mt-1.5 text-[13px] leading-snug">
                {p.tagline}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="text-muted-foreground flex items-center gap-2 text-xs"
                  >
                    <Check className="text-foreground/40 size-3.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Selection tick */}
              <span
                aria-hidden
                className={cn(
                  "border-ring bg-ring/15 absolute bottom-4 right-4 flex size-4 items-center justify-center rounded-full border transition-opacity",
                  isSel ? "opacity-100" : "opacity-0",
                )}
              >
                <Check className="text-foreground size-2.5" />
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-9 flex flex-col items-center gap-3">
        <Button onClick={() => onChoose(selected)} className="h-10 min-w-56">
          {selected === "free"
            ? "Continue as free"
            : `Continue with ${PLANS.find((p) => p.id === selected)!.name}`}
          <ArrowRight className="size-4" data-icon="inline-end" />
        </Button>
        <Link
          href="/pricing"
          target="_blank"
          rel="noopener"
          className="text-muted-foreground/70 hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
        >
          Compare all plans
        </Link>
      </div>
    </div>
  )
}
