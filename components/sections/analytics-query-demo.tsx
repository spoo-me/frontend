"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { Band } from "@/components/shared/section-shell"
import { cn } from "@/lib/utils"

/* Every dimension shown here ships today: browser, os, country, city and
   referrer are real filterKeys on the dashboard's breakdown widgets. Keep
   this demo honest — no utm, no device until the widgets land. */
type QueryPart = {
  t: string
  dim?: "browser" | "os" | "country" | "city" | "referrer"
}

type Query = {
  id: string
  parts: QueryPart[]
  clicks: string
  seed: number
}

const QUERIES: Query[] = [
  {
    id: "chrome-de-discord",
    parts: [
      { t: "Show me " },
      { t: "Chrome", dim: "browser" },
      { t: " users from " },
      { t: "Germany", dim: "country" },
      { t: " who came through " },
      { t: "Discord", dim: "referrer" },
      { t: "." },
    ],
    clicks: "1,284",
    seed: 1.7,
  },
  {
    id: "ios-berlin-instagram",
    parts: [
      { t: "Show me " },
      { t: "iOS", dim: "os" },
      { t: " clicks from " },
      { t: "Berlin", dim: "city" },
      { t: " that arrived via " },
      { t: "Instagram", dim: "referrer" },
      { t: "." },
    ],
    clicks: "862",
    seed: 4.2,
  },
  {
    id: "safari-jp-x",
    parts: [
      { t: "Show me " },
      { t: "Safari", dim: "browser" },
      { t: " users from " },
      { t: "Japan", dim: "country" },
      { t: " who clicked from " },
      { t: "X", dim: "referrer" },
      { t: "." },
    ],
    clicks: "407",
    seed: 8.9,
  },
]

const BAR_COUNT = 36

/* Deterministic pseudo-daily click volumes per query — real data shape,
   stable across renders (no Date.now / Math.random). */
function wave(seed: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const v =
      Math.sin(i * 0.55 + seed) * 0.32 +
      Math.sin(i * 0.21 + seed * 2.3) * 0.26 +
      0.5
    return 0.1 + Math.min(1, Math.max(0, v)) * 0.9
  })
}

const BARS = QUERIES.map((q) => wave(q.seed))

const TYPE_MS = 34
const HOLD_MS = 3600
const SWAP_MS = 350

function queryText(q: Query) {
  return q.parts.map((p) => p.t).join("")
}

export function AnalyticsQueryDemo() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { once: false, amount: 0.35 })
  const reduced = useReducedMotion()

  /* qi: query being typed. shownQi: query the chart answers (lags until the
     sentence completes — the redraw IS the answer moment). */
  const [qi, setQi] = React.useState(0)
  const [shownQi, setShownQi] = React.useState(0)
  const [chars, setChars] = React.useState(
    reduced ? queryText(QUERIES[0]).length : 0
  )

  const query = QUERIES[qi]
  const fullText = queryText(query)
  const done = chars >= fullText.length

  React.useEffect(() => {
    if (reduced || !inView) return
    if (!done) {
      const t = setTimeout(() => setChars((c) => c + 1), TYPE_MS)
      return () => clearTimeout(t)
    }
    setShownQi(qi)
    const t = setTimeout(() => {
      setChars(0)
      setQi((i) => (i + 1) % QUERIES.length)
    }, HOLD_MS)
    return () => clearTimeout(t)
  }, [reduced, inView, done, chars, qi])

  /* Which parts (and chips) are fully typed so far */
  let consumed = 0
  const revealed = query.parts.map((p) => {
    const start = consumed
    consumed += p.t.length
    const visible = Math.max(0, Math.min(p.t.length, chars - start))
    return {
      ...p,
      shown: p.t.slice(0, visible),
      complete: visible === p.t.length,
    }
  })
  const chips = revealed.filter((p) => p.dim && p.complete)

  return (
    <Band rule>
      <div className="grid gap-px bg-border lg:grid-cols-[1fr_1.5fr]">
        {/* Copy cell */}
        <div className="flex flex-col justify-center bg-background p-7 sm:p-9">
          <h3 className="text-balance font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Ask for the exact slice.
          </h3>
          <p className="mt-3 max-w-md text-balance text-base text-muted-foreground">
            Every chart on the dashboard takes filters: browser, country, city,
            referrer, OS. Stack them and the whole board re-scopes to the clicks
            you asked about.
          </p>
        </div>

        {/* Artifact cell */}
        <div className="bg-background p-5 sm:p-9" ref={stageRef}>
          <div className="rounded-xl border border-border/60 bg-card/40 p-5 shadow-float sm:p-6 dark:shadow-none">
            {/* Query line — fixed height, nothing below shifts while typing */}
            <div className="h-14 text-base text-muted-foreground leading-7 sm:h-14 sm:text-lg">
              {revealed.map((p, i) => (
                <span
                  key={i}
                  className={cn(p.dim && "font-medium text-foreground")}
                >
                  {p.shown}
                </span>
              ))}
              <span
                aria-hidden
                className={cn(
                  "ml-px inline-block h-[1.1em] w-px translate-y-[0.2em] bg-foreground/70",
                  done && "animate-blink-cursor"
                )}
              />
            </div>

            {/* Filter chips — assemble as the phrases land */}
            <div className="mt-1 flex h-7 items-center gap-1.5">
              <AnimatePresence mode="popLayout">
                {chips.map((c) => (
                  <motion.span
                    key={`${query.id}-${c.dim}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex h-6 items-center overflow-hidden rounded-md border border-border/60 font-mono text-[11px]"
                  >
                    <span className="bg-muted/50 px-1.5 text-muted-foreground">
                      {c.dim}
                    </span>
                    <span className="border-border/60 border-l bg-card px-1.5 text-foreground">
                      {c.t}
                    </span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* The answer — one violet chart, amplitudes re-scope per query */}
            <div className="mt-5 flex h-36 items-end gap-[3px] sm:h-40">
              {BARS[shownQi].map((v, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-[2px] bg-brand/80 transition-[height] duration-700"
                  style={{
                    height: `${Math.round(v * 100)}%`,
                    transitionTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
                    transitionDelay: `${i * 8}ms`,
                  }}
                />
              ))}
            </div>

            {/* Meta row — honest count for the shown slice */}
            <div className="mt-4 flex h-5 items-center justify-between border-border/60 border-t pt-4 font-mono text-[11px] text-muted-foreground tabular-nums">
              <AnimatePresence mode="wait">
                <motion.span
                  key={QUERIES[shownQi].id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: SWAP_MS / 1000 }}
                >
                  {QUERIES[shownQi].clicks} matching clicks
                </motion.span>
              </AnimatePresence>
              <span>last 30 days</span>
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}
