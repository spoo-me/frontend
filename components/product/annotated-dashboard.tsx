"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import { AppFrame } from "@/components/sections/dashboard-hero"

/**
 * The board, annotated: the full dashboard preview (no crop) with
 * hand-drawn arrows and floating notes calling out what each piece is
 * for. Arrows draw in as the band scrolls into view. Below lg the
 * overlay disappears and the same notes stack as a plain list — sketch
 * annotations don't survive a phone-width zoom.
 */

type Annotation = {
  id: string
  text: string
  /** Label position, % of the frame wrapper. */
  label: { top: string; left: string; rotate?: number }
  /** Arrow path in the 1200x820 overlay space, label edge → target. */
  d: string
}

const ANNOTATIONS: Annotation[] = [
  {
    id: "filters",
    text: "Stack filters as deep as the question goes",
    label: { top: "-9%", left: "1%", rotate: -2 },
    d: "M96 -26 C 76 10, 82 46, 106 72",
  },
  {
    id: "kpis",
    text: "Uniques, totals, and redirect speed at a glance",
    label: { top: "-9.5%", left: "73%", rotate: 1.5 },
    d: "M1012 -30 C 1052 4, 1048 84, 1024 128",
  },
  {
    id: "chart",
    text: "Every bucket hoverable, previous period ghosted",
    label: { top: "40%", left: "27%", rotate: -1.5 },
    d: "M312 336 C 272 328, 244 300, 254 262",
  },
  {
    id: "toggle",
    text: "Any widget flips between chart and table",
    label: { top: "104%", left: "34%", rotate: 1 },
    d: "M478 872 C 468 760, 452 600, 414 516",
  },
  {
    id: "map",
    text: "First-party choropleth, not a script in sight",
    label: { top: "104%", left: "69%", rotate: -1.5 },
    d: "M908 868 C 936 796, 918 716, 878 662",
  },
]

/** Excalidraw-style open arrowhead: two short strokes, no fill. */
function arrowHead(d: string): { x: number; y: number; angle: number } {
  // The head rides the path's end point; angle comes from the last
  // control point → end point segment.
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
      className="overflow-hidden px-5 py-16 sm:px-12 sm:py-24 lg:pt-28 lg:pb-32"
    >
      <GutterHatch />
      <div className="relative mx-auto max-w-6xl">
        <TooltipProvider delayDuration={0}>
          <AppFrame />
        </TooltipProvider>

        {/* Annotation layer — lg+ only */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
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
                <g key={a.id} className="text-muted-foreground/70">
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
                      duration: reduced ? 0 : 0.6,
                      delay: 0.15 + i * 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.2, delay: 0.6 + i * 0.18 }}
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
              transition={{ duration: 0.3, delay: 0.1 + i * 0.18 }}
              className="absolute max-w-52 font-normal text-base text-muted-foreground italic leading-snug [font-family:var(--font-serif)]"
              style={{
                top: a.label.top,
                left: a.label.left,
                rotate: `${a.label.rotate ?? 0}deg`,
              }}
            >
              {a.text}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Phone fallback: the same notes, stacked plainly */}
      <ul className="mx-auto mt-8 grid max-w-lg gap-3 lg:hidden">
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
