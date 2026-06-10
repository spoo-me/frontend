"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OnboardingPath } from "@/lib/onboarding"

/* The stage illustrations ARE the product — enlarged, floating panels. */

/** Catmull-Rom → cubic bezier, same smooth-line idiom as dashboard-preview. */
function smoothPath(points: number[], w: number, h: number, pad = 6): string {
  const max = Math.max(...points)
  const stepX = w / (points.length - 1)
  const xy = points.map(
    (p, i) => [i * stepX, h - (p / max) * (h - pad)] as const,
  )
  let d = `M ${xy[0][0]} ${xy[0][1]}`
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[Math.max(i - 1, 0)]
    const p1 = xy[i]
    const p2 = xy[i + 1]
    const p3 = xy[Math.min(i + 2, xy.length - 1)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

const CLICKS = [14, 22, 18, 34, 28, 46, 42, 66, 58, 88, 76, 96]
const CHART_W = 224
const CHART_H = 64

function LinksIllustration({ active }: { active: boolean }) {
  const gradientId = React.useId()
  const line = smoothPath(CLICKS, CHART_W, CHART_H)
  const area = `${line} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`
  const peakY =
    CHART_H - (CLICKS[CLICKS.length - 1] / Math.max(...CLICKS)) * (CHART_H - 6)

  // Just the curve — no labels, no chrome. Neutral ink, one live accent.
  return (
    <div
      className={cn(
        "border-border/60 bg-card shadow-card w-64 rounded-xl border p-5 transition-colors duration-500",
        active ? "text-foreground/80" : "text-foreground/40",
      )}
    >
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        className="h-20 w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <circle cx={CHART_W} cy={peakY} r={3} className="fill-live" />
          <circle cx={CHART_W} cy={peakY} r={7.5} className="fill-live" opacity={0.2} />
        </motion.g>
      </svg>
    </div>
  )
}

function ApiIllustration({ active }: { active: boolean }) {
  // Request → response, nothing else. Neutral ink, one live accent.
  return (
    <div className="border-border/60 bg-card shadow-card w-64 rounded-xl border p-5 text-left font-mono text-xs">
      <div
        className={cn(
          "transition-colors duration-500",
          active ? "text-foreground/80" : "text-foreground/40",
        )}
      >
        POST /api/v1/shorten
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span
          className={cn(
            "transition-colors duration-500",
            active ? "text-live" : "text-muted-foreground/50",
          )}
        >
          201 Created
        </span>
        <span
          aria-hidden
          className={cn(
            "h-3.5 w-[5px] transition-colors duration-500",
            active ? "bg-foreground/60 animate-pulse" : "bg-foreground/20",
          )}
        />
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
