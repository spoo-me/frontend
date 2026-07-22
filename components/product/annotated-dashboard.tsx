"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import { AppFrame } from "@/components/sections/dashboard-hero"
import { sketchFont } from "@/components/product/sketch"
import { cn } from "@/lib/utils"

/**
 * The board, annotated: the full dashboard preview, narrowed so the
 * margins become sketchbook gutters — handwritten notes left and right,
 * arrows drawn into the real UI. Arrows draw in on scroll. Below xl the
 * overlay disappears and the same notes stack as a plain list — sketch
 * annotations don't survive small screens.
 */

type Annotation = {
  id: string
  text: string
  side: "left" | "right"
  /** Label position, % of the outer wrapper. */
  top: string
  rotate?: number
  /** Arrow path in the 1200x820 overlay space, label edge → target. */
  d: string
}

const ANNOTATIONS: Annotation[] = [
  {
    id: "filters",
    text: "stack filters as deep as the question goes",
    side: "left",
    top: "6%",
    rotate: -3,
    d: "M165 82 C 205 98, 240 100, 292 96",
  },
  {
    id: "chart",
    text: "previous period ghosted under every chart",
    side: "left",
    top: "38%",
    rotate: -2,
    d: "M165 344 C 225 356, 285 330, 322 304",
  },
  {
    id: "toggle",
    text: "any widget flips between chart & table",
    side: "left",
    top: "66%",
    rotate: 2,
    d: "M165 580 C 270 600, 380 560, 448 514",
  },
  {
    id: "kpis",
    text: "uniques, totals & redirect speed at a glance",
    side: "right",
    top: "12%",
    rotate: 2.5,
    d: "M1035 126 C 990 128, 962 138, 936 148",
  },
  {
    id: "map",
    text: "a first-party choropleth, not a script in sight",
    side: "right",
    top: "70%",
    rotate: -2,
    d: "M1035 610 C 985 630, 930 645, 884 652",
  },
]

/** Excalidraw-style open arrowhead: two short strokes, no fill. */
function arrowHead(d: string): { x: number; y: number; angle: number } {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const [x, y] = nums.slice(-2)
  const [cx, cy] = nums.slice(-4, -2)
  return { x, y, angle: (Math.atan2(y - cy, x - cx) * 180) / Math.PI }
}

export function AnnotatedDashboard() {
  const reduced = useReducedMotion()

  return (
    <Band
      rule
      className={cn("px-5 py-16 sm:px-9 sm:py-24", sketchFont.variable)}
    >
      <GutterHatch />
      {/* Breakout stage: fixed width past 1400px so the notes escape the
          lattice rails AND the arrow geometry stays constant. */}
      <div className="relative z-20 mx-auto w-full min-[1400px]:w-[1340px] min-[1400px]:max-w-none">
        {/* The board itself, narrowed so the margins can speak */}
        <div className="mx-auto xl:max-w-[52rem]">
          <TooltipProvider delayDuration={0}>
            <AppFrame />
          </TooltipProvider>
        </div>

        {/* Annotation layer — wide screens only */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden min-[1400px]:block"
        >
          <svg
            className="absolute inset-0 size-full overflow-visible"
            viewBox="0 0 1200 820"
            preserveAspectRatio="none"
            fill="none"
          >
            {ANNOTATIONS.map((a, i) => {
              const head = arrowHead(a.d)
              return (
                <g key={a.id} className="text-muted-foreground/80">
                  <motion.path
                    d={a.d}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: reduced ? 1 : 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: reduced ? 0 : 0.5,
                      delay: 0.15 + i * 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.2, delay: 0.55 + i * 0.15 }}
                    transform={`translate(${head.x}, ${head.y}) rotate(${head.angle})`}
                  >
                    <path
                      d="M-9 -5 L0 0 L-9 5"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </motion.g>
                </g>
              )
            })}
          </svg>

          {ANNOTATIONS.map((a, i) => (
            <motion.span
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.15 }}
              className={cn(
                "absolute w-44 text-2xl text-muted-foreground leading-[1.15] [font-family:var(--font-sketch)]",
                a.side === "left" ? "left-0 text-left" : "right-0 text-left"
              )}
              style={{ top: a.top, rotate: `${a.rotate ?? 0}deg` }}
            >
              {a.text}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Small-screen fallback: the same notes, stacked plainly */}
      <ul className="mx-auto mt-8 grid max-w-lg gap-3 min-[1400px]:hidden">
        {ANNOTATIONS.map((a) => (
          <li
            key={a.id}
            className="flex items-baseline gap-2.5 text-muted-foreground text-sm"
          >
            <span aria-hidden className="text-muted-foreground/50">
              →
            </span>
            {a.text}
          </li>
        ))}
      </ul>
    </Band>
  )
}
