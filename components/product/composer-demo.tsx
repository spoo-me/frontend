"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"
import { MousePointer2 } from "lucide-react"

import { Band } from "@/components/shared/section-shell"
import { SectionHeader } from "@/components/dashboard/section"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import {
  COMPOSER_DEFAULTS,
  ComposerForm,
  type ComposerState,
} from "@/components/dashboard/analytics/widget-composer"
import { ACCENT_VARS } from "@/components/dashboard/analytics/widget-meta"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"
import {
  countryRows,
  referrerRows,
} from "@/components/sections/dashboard-hero-fixtures"
import { osRows } from "@/components/product/board-fixtures"
import { Compass, Globe2, MapPin } from "lucide-react"

/* The real chart constructor, driven like a film: a cursor walks the
   actual ComposerForm through sample builds, the preview answers each
   step, and the finished widget drops onto a mini board below. */

const CountryMap = dynamic(
  () =>
    import("@/components/dashboard/analytics/country-map").then(
      (m) => m.CountryMap
    ),
  { ssr: false, loading: () => null }
)
const DonutChart = dynamic(
  () =>
    import("@/components/dashboard/analytics/widgets/donut-chart").then(
      (m) => m.DonutChart
    ),
  { ssr: false, loading: () => null }
)

/* Anchored to the local day so SSR and hydration agree. */
const DAY = 86_400_000
const anchor = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()
const RANGE: TimeRange = {
  from: new Date(anchor - 30 * DAY),
  to: new Date(anchor),
  preset: "30d",
}

type Step = { field: string; patch: Partial<ComposerState>; hold?: number }

type Workflow = {
  id: string
  question: string
  steps: Step[]
  /** The finished widget's board title. */
  title: string
}

const WORKFLOWS: Workflow[] = [
  {
    id: "insta-ios",
    question: "Where does Instagram send my iOS readers?",
    title: "Instagram iOS readers",
    steps: [
      { field: "x", patch: { x: "country" } },
      { field: "chart", patch: { bdViz: "map" } },
      { field: "scope", patch: { scope: { referrer: ["instagram.com"] } } },
      {
        field: "scope",
        patch: { scope: { referrer: ["instagram.com"], os: ["iOS"] } },
      },
      { field: "ink", patch: { accent: "amber" } },
    ],
  },
  {
    id: "launch-referrers",
    question: "Who sends traffic to /launch?",
    title: "/launch referrers",
    steps: [
      { field: "x", patch: { x: "referrer" } },
      { field: "chart", patch: { bdViz: "donut" } },
      { field: "scope", patch: { scope: { short_code: ["launch"] } } },
      { field: "ink", patch: { accent: "sky" } },
    ],
  },
]

const STEP_MS = 1900
const MOVE_MS = 800

function PreviewChart({ state }: { state: ComposerState }) {
  if (state.x === "country" && state.bdViz === "map")
    return <CountryMap rows={countryRows} metric="total" />
  if (state.x === "country")
    return <BreakdownList dimension="country" rows={countryRows} limit={6} />
  if (state.x === "referrer" && state.bdViz === "donut")
    return (
      <div className="h-full p-3">
        <DonutChart
          dimension="referrer"
          rows={referrerRows}
          metric="total"
          segments={5}
          legend
        />
      </div>
    )
  if (state.x === "referrer")
    return <BreakdownList dimension="referrer" rows={referrerRows} limit={6} />
  if (state.x === "os")
    return <BreakdownList dimension="os" rows={osRows} limit={5} />
  return <BreakdownList dimension="referrer" rows={referrerRows} limit={6} />
}

function widgetIcon(state: ComposerState) {
  if (state.x === "country") return MapPin
  if (state.x === "referrer") return Globe2
  return Compass
}

export function ComposerDemo() {
  const reduced = useReducedMotion()
  const stageRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { amount: 0.35 })

  const [wi, setWi] = React.useState(0)
  const [si, setSi] = React.useState(-1) // -1: defaults shown, then steps
  const [built, setBuilt] = React.useState<
    Array<{ id: string; title: string; state: ComposerState }>
  >([])
  const [cursor, setCursor] = React.useState({ x: 60, y: 40, click: 0 })

  const fieldEls = React.useRef<Record<string, HTMLDivElement | null>>({})
  const fieldRef = React.useCallback(
    (field: string) => (el: HTMLDivElement | null) => {
      fieldEls.current[field] = el
    },
    []
  )

  const flow = WORKFLOWS[wi]
  const state = React.useMemo<ComposerState>(() => {
    let s: ComposerState = { ...COMPOSER_DEFAULTS, x: "referrer" }
    for (let i = 0; i <= Math.min(si, flow.steps.length - 1); i++)
      s = { ...s, ...flow.steps[i].patch }
    return s
  }, [flow, si])

  /* One tick per step: aim the cursor, pulse, apply. */
  React.useEffect(() => {
    if (reduced || !inView) return
    const next = si + 1
    const t = setTimeout(
      () => {
        if (next < flow.steps.length) {
          const el = fieldEls.current[flow.steps[next].field]
          const stage = stageRef.current
          if (el && stage) {
            const r = el.getBoundingClientRect()
            const sr = stage.getBoundingClientRect()
            setCursor((c) => ({
              x: r.left - sr.left + r.width * 0.55,
              y: r.top - sr.top + r.height * 0.7,
              click: c.click + 1,
            }))
          }
          setSi(next)
        } else {
          // Ship it: the draft lands on the board strip below.
          setBuilt((b) =>
            [
              { id: `${flow.id}-${b.length}`, title: flow.title, state },
              ...b,
            ].slice(0, 3)
          )
          setSi(-1)
          setWi((i) => (i + 1) % WORKFLOWS.length)
        }
      },
      si === -1 ? 1200 : STEP_MS
    )
    return () => clearTimeout(t)
  }, [si, flow, inView, reduced, state])

  const accentVar = ACCENT_VARS[state.accent]

  return (
    <Band rule>
      <div className="grid gap-px bg-border lg:grid-cols-[1fr_1.9fr]">
        {/* Copy cell */}
        <div className="flex min-w-0 flex-col justify-center bg-background px-7 py-12 sm:p-12">
          <h3 className="text-balance font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Build the chart you're missing.
          </h3>
          <p className="mt-3 max-w-md text-balance text-base text-muted-foreground">
            The board's constructor: pick an axis, a measure, a shape, and scope
            it to exactly the clicks that matter. The preview is live, and the
            widget lands on your board.
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={flow.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-6 text-base text-muted-foreground italic"
            >
              <span className="text-muted-foreground/60">&ldquo;</span>
              <span className="text-foreground/90">{flow.question}</span>
              <span className="text-muted-foreground/60">&rdquo;</span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Stage: the real composer, scripted */}
        <div className="min-w-0 bg-background px-5 py-10 sm:px-10 sm:py-12">
          <div
            ref={stageRef}
            className="relative rounded-2xl border border-border/60 bg-shell p-0.5"
            style={{ "--chart-accent": accentVar } as React.CSSProperties}
          >
            <SectionHeader
              className="h-10 shrink-0 px-2.5"
              icon={widgetIcon(state)}
              title="Custom chart"
            />
            <div className="mt-0 rounded-[14px] bg-background p-4 sm:p-6">
              <div className="pointer-events-none grid select-none gap-6 sm:grid-cols-[minmax(0,1fr)_260px]">
                {/* Live preview */}
                <div className="pattern-dots flex items-center justify-center rounded-xl p-4">
                  <div className="h-[300px] w-full overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`${state.x}-${state.bdViz}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full"
                      >
                        <PreviewChart state={state} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* The real form */}
                <TooltipProvider delayDuration={0}>
                  <ComposerForm
                    state={state}
                    onChange={() => {}}
                    range={RANGE}
                    fieldRef={fieldRef}
                  />
                </TooltipProvider>
              </div>
            </div>

            {/* The guided cursor */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute z-20 hidden sm:block"
              animate={{ left: cursor.x, top: cursor.y }}
              transition={{ duration: MOVE_MS / 1000, ease: [0.3, 1, 0.4, 1] }}
            >
              <motion.span
                key={cursor.click}
                aria-hidden
                initial={{ scale: 0.4, opacity: 0.7 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.5, delay: MOVE_MS / 1000 }}
                className="absolute top-[-7px] left-[-7px] size-5 rounded-full border border-foreground/60"
              />
              <MousePointer2
                className="size-4.5 text-foreground drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                fill="currentColor"
                strokeWidth={1}
              />
            </motion.div>
          </div>

          {/* What we're building — finished widgets drop in below */}
          <div className="mt-6">
            <div className="label-mono mb-2 text-muted-foreground/70">
              landing on your board
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <AnimatePresence initial={false}>
                {built.map((b) => {
                  const Icon = widgetIcon(b.state)
                  return (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col rounded-2xl border border-border/60 bg-shell p-0.5"
                      style={
                        {
                          "--chart-accent": ACCENT_VARS[b.state.accent],
                        } as React.CSSProperties
                      }
                    >
                      <SectionHeader
                        className="h-9 shrink-0 px-2.5"
                        icon={Icon}
                        title={b.title}
                      />
                      <div className="mt-0 h-32 overflow-hidden rounded-[14px] bg-background">
                        <PreviewChart state={b.state} />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {built.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-border/40 border-dashed text-muted-foreground/50 text-xs sm:col-span-3">
                  watching the constructor…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}
