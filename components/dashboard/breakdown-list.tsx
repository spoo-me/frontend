"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import {
  DimensionIcon,
  dimensionLabel,
} from "@/components/dashboard/dim-icon"
import type { DimensionRow } from "@/lib/api"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

export type BreakdownMetric = "total" | "unique" | "both"

/**
 * Breakdown list, ref-17 pattern: the row background IS the bar — a
 * one-lightness-step fill whose width encodes the value. Icon carries
 * identity; the bar stays neutral.
 *
 * Metric views (SPEC §7): total / unique swap the encoded value; "both"
 * nests the unique bar inside the clicks bar (uniques ⊆ clicks, so the
 * nesting reads as part-to-whole) — treatment change, never a second hue.
 */
export function BreakdownList({
  dimension,
  rows,
  limit = 8,
  metric = "total",
  onSelect,
  className,
}: {
  dimension: string
  rows: DimensionRow[]
  limit?: number
  metric?: BreakdownMetric
  onSelect?: (value: string) => void
  className?: string
}) {
  const top = [...rows]
    .sort((a, b) =>
      metric === "unique"
        ? b.unique_clicks - a.unique_clicks
        : b.clicks - a.clicks,
    )
    .slice(0, limit)
  const max =
    (metric === "unique" ? top[0]?.unique_clicks : top[0]?.clicks) ?? 1

  return (
    // Re-key on metric: every mode switch replays the grow-in cascade.
    <div key={metric} className={cn("h-full space-y-1", className)}>
      {top.map((row, i) => {
        const primary = metric === "unique" ? row.unique_clicks : row.clicks
        return (
          <button
            key={row.value}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(row.value)}
            className="group relative flex h-9 w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 text-left disabled:cursor-default"
          >
            <motion.span
              aria-hidden
              className="bg-muted/80 group-hover:bg-accent absolute inset-y-0 left-0 rounded-lg transition-colors duration-150"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.max((primary / max) * 100, 4)}%` }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.035,
              }}
            />
            {metric === "both" && (
              <motion.span
                aria-hidden
                className="bg-foreground/8 absolute inset-y-0 left-0 rounded-lg"
                initial={{ width: "0%" }}
                animate={{
                  width: `${Math.max((row.unique_clicks / max) * 100, 2)}%`,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: i * 0.035 + 0.05,
                }}
              />
            )}
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <DimensionIcon dimension={dimension} value={row.value} className="size-4" />
            </span>
            <span className="text-foreground relative min-w-0 flex-1 truncate text-[13px]">
              {dimensionLabel(dimension, row.value)}
            </span>
            {metric === "both" ? (
              <span className="relative font-mono text-xs tabular-nums">
                <span className="text-foreground">{formatCount(row.clicks)}</span>
                <span className="text-muted-foreground/70">
                  {" "}
                  · {formatCount(row.unique_clicks)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground relative font-mono text-xs tabular-nums">
                {formatCount(primary)}
              </span>
            )}
          </button>
        )
      })}
      {!top.length && (
        <EmptyRange />
      )}
    </div>
  )
}
