"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { PlanId } from "@/lib/onboarding"

/* Condensed tier band — same anatomy as /pricing (shared hairlines, Pro
   popping out), not the full page. Numbers mirror /pricing placeholders. */
const PLANS: {
  id: PlanId
  name: string
  price: number
  tagline: string
  cta: string
  highlight?: boolean
  leadIn: string
  features: string[]
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Personal links & side projects",
    cta: "Continue as free",
    leadIn: "Includes:",
    features: [
      "100 links / month",
      "10K clicks / month",
      "90-day analytics",
      "1 custom domain",
      "QR codes + 5 API keys",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    tagline: "Creators & growing projects",
    cta: "Choose Pro",
    highlight: true,
    leadIn: "Everything in Free, plus:",
    features: [
      "Unlimited links",
      "100K clicks / month",
      "2-year analytics",
      "5 custom domains",
      "Webhooks & alerts",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 29,
    tagline: "Teams shipping at scale",
    cta: "Choose Business",
    leadIn: "Everything in Pro, plus:",
    features: [
      "1M clicks / month",
      "Unlimited domains",
      "10 team seats",
      "99.99% uptime SLA",
      "Audit log",
    ],
  },
]

export function PlansStep({ onChoose }: { onChoose: (plan: PlanId) => void }) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onChoose("free")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onChoose])

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

      {/* Tier band — flat columns sharing hairlines; Pro pops out */}
      <div className="border-border/60 mt-12 grid w-full max-w-4xl grid-cols-1 rounded-2xl border text-left lg:grid-cols-3 lg:[&>*:not(:first-child)]:border-l lg:[&>*]:border-border/60">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative flex flex-col p-6",
              p.highlight &&
                "border-border/80 bg-card lg:shadow-card lg:-my-4 lg:rounded-2xl lg:border lg:!border-l dark:lg:shadow-[0_24px_64px_-32px_rgba(0,0,0,0.6)]",
            )}
          >
            {p.highlight && (
              <span className="bg-foreground text-background absolute -top-2.5 left-6 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase lg:top-4">
                Most popular
              </span>
            )}

            <h3
              className={cn(
                "text-foreground text-base font-semibold tracking-tight",
                p.highlight && "lg:mt-7",
              )}
            >
              {p.name}
            </h3>
            <p className="text-muted-foreground mt-1 text-[13px] leading-snug">
              {p.tagline}
            </p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
                ${p.price}
              </span>
              {p.price > 0 && (
                <span className="text-muted-foreground/70 text-xs">/mo</span>
              )}
            </div>

            <Button
              onClick={() => onChoose(p.id)}
              variant={p.highlight ? "default" : "outline"}
              className="mt-5 h-10 w-full"
            >
              {p.cta}
              {p.id === "free" && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>

            <p className="text-foreground/80 mt-6 text-xs font-medium">
              {p.leadIn}
            </p>
            <ul className="mt-3 space-y-2.5">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="text-muted-foreground flex items-start gap-2 text-[13px]"
                >
                  <Check className="text-foreground/60 mt-0.5 size-3.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href="/pricing"
        target="_blank"
        rel="noopener"
        className="text-muted-foreground/70 hover:text-foreground mt-8 inline-flex items-center gap-1 text-xs underline-offset-4 transition-colors hover:underline"
      >
        Compare all plans
        <ArrowRight className="size-3 -rotate-45" />
      </Link>
    </div>
  )
}
