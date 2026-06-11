"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OnboardingPath } from "@/lib/onboarding"

/* The stage illustrations ARE the product — enlarged, floating panels.
   Both panels share exact dimensions so the two options weigh the same. */

const PANEL = "border-border/60 bg-card shadow-card h-40 w-full max-w-[19rem] overflow-hidden rounded-xl border"

/** Catmull-Rom → cubic bezier, same smooth-line idiom as dashboard-preview. */
function smoothPath(
  points: number[],
  w: number,
  h: number,
  pad = 6,
  max = Math.max(...points),
): string {
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

/* Dense daily-traffic oscillation, shadcn area-chart register: a tall
   neutral series behind, the brand series in front. Pure illustration —
   no axes, labels, dots, or legend. */
const SERIES_BACK = [
  34, 58, 30, 72, 44, 66, 28, 80, 52, 38, 88, 46, 70, 34, 92, 56, 40, 76,
  30, 84, 50, 64, 36, 96, 58, 42, 78, 32, 86, 48, 68, 38, 90, 54, 74, 100,
]
const SERIES_FRONT = [
  16, 28, 12, 36, 20, 30, 10, 40, 24, 16, 44, 20, 34, 14, 46, 26, 18, 38,
  12, 42, 22, 30, 16, 48, 28, 18, 38, 14, 42, 22, 32, 16, 44, 26, 36, 50,
]
const CHART_W = 304
const CHART_H = 160

function LinksIllustration({ active }: { active: boolean }) {
  const id = React.useId()
  const max = Math.max(...SERIES_BACK)
  const backLine = smoothPath(SERIES_BACK, CHART_W, CHART_H, 18, max)
  const frontLine = smoothPath(SERIES_FRONT, CHART_W, CHART_H, 18, max)
  const backArea = `${backLine} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`
  const frontArea = `${frontLine} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`

  return (
    <div
      className={cn(
        PANEL,
        "transition-opacity duration-500",
        active ? "opacity-100" : "opacity-60",
      )}
    >
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        className="size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-back`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`${id}-front`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <motion.path
          d={backArea}
          fill={`url(#${id}-back)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.path
          d={backLine}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.45}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        <motion.path
          d={frontArea}
          fill={`url(#${id}-front)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />
        <motion.path
          d={frontLine}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut", delay: 0.15 }}
        />
      </svg>
    </div>
  )
}

/* Endless API spec — endpoint rows on a slow vertical loop, faded at both
   edges so the surface reads as a window onto more. */
const ENDPOINTS: Array<[method: string, path: string, status: string]> = [
  ["POST", "/api/v1/shorten", "201"],
  ["GET", "/api/v1/urls", "200"],
  ["GET", "/api/v1/stats/{alias}", "200"],
  ["POST", "/api/v1/keys", "201"],
  ["DELETE", "/api/v1/urls/{id}", "204"],
  ["POST", "/api/v1/custom-domains", "201"],
  ["GET", "/api/v1/qr/{alias}", "200"],
  ["POST", "/api/v1/webhooks", "201"],
]

function ApiIllustration({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        PANEL,
        "relative px-5 text-left font-mono text-xs transition-opacity duration-500",
        active ? "opacity-100" : "opacity-60",
      )}
    >
      <div
        className="h-full [mask-image:linear-gradient(to_bottom,transparent,black_26%,black_74%,transparent)]"
      >
        <motion.div
          aria-hidden
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="flex flex-col"
        >
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex flex-col gap-3.5 py-[7px]">
              {ENDPOINTS.map(([method, path, status]) => (
                <li
                  key={`${method} ${path}`}
                  className="flex items-baseline justify-between gap-4 whitespace-nowrap"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-foreground/80 w-14 shrink-0">
                      {method}
                    </span>
                    <span className="text-muted-foreground">{path}</span>
                  </span>
                  <span className="text-muted-foreground/40">{status}</span>
                </li>
              ))}
            </ul>
          ))}
        </motion.div>
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

      <div className="mt-12 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
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
              <div className="pattern-dots relative flex h-52 items-center justify-center rounded-xl">
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
