"use client"

import * as React from "react"
import { motion } from "motion/react"

/**
 * Alternative stat-tile faces. Odometer: the value's digits roll into
 * place, once per data change, never looping. Gauge: a quiet 270-degree
 * hairline arc for percentage metrics — the accent draws the progress,
 * chrome stays neutral.
 */

export function OdometerValue({ value }: { value: string }) {
  return (
    <span className="flex" aria-label={value}>
      {[...value].map((ch, i) =>
        /\d/.test(ch) ? (
          <OdometerDigit key={i} digit={Number(ch)} />
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        )
      )}
    </span>
  )
}

function OdometerDigit({ digit }: { digit: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[1em] w-[1ch] overflow-hidden"
    >
      <motion.span
        className="absolute top-0 left-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit}em` }}
        transition={{ type: "spring", stiffness: 80, damping: 16, mass: 0.6 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em]">
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/** 270-degree arc, value centered. `fraction` in [0, 1]. */
export function GaugeArc({
  fraction,
  label,
}: {
  fraction: number
  label: string
}) {
  const f = Math.min(1, Math.max(0, fraction))
  const r = 42
  const sweep = 0.75 // 270 degrees
  const c = 2 * Math.PI * r
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="h-full max-h-36 w-auto rotate-[135deg]"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${c * sweep} ${c}`}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--chart-accent, var(--brand))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${c * sweep * f} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold text-[22px] text-foreground tabular-nums leading-none tracking-tight">
          {label}
        </span>
      </div>
    </div>
  )
}
