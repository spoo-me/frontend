"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChartBar,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Table2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import { formatCount, formatPercent } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import {
  BreakdownList,
  type BreakdownMetric,
} from "@/components/dashboard/breakdown-list"
import { Segmented } from "@/components/dashboard/segmented"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { CountryMap } from "@/components/dashboard/analytics/country-map"
import { Skeleton } from "@/components/ui/skeleton"

export type CardView = "chart" | "table" | "map"

/**
 * One dimension's card with chart↔table duality and per-card metric views
 * (SPEC §7). Rows in either view are click-to-filter. Cards can expand in
 * place to take over the page content (layoutId morph, URL-addressable).
 */
export function DimensionCard({
  dimension,
  title,
  icon,
  rows,
  loading,
  onSelect,
  expanded = false,
  onExpandedChange,
  metric,
  view,
  onMetricChange,
  onViewChange,
}: {
  dimension: Exclude<StatsDimension, "time">
  title: string
  icon: React.ElementType
  rows: DimensionRow[]
  loading?: boolean
  onSelect?: (value: string) => void
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Controlled from the page so prefs survive expand/collapse remounts. */
  metric: BreakdownMetric
  view: CardView
  onMetricChange: (metric: BreakdownMetric) => void
  onViewChange: (view: CardView) => void
}) {
  const ExpandIcon = expanded ? Minimize2 : Maximize2
  // Only countries have shapes to paint; a stale "map" pref on any other
  // card falls back to bars.
  const hasMap = dimension === "country"
  const activeView = view === "map" && !hasMap ? "chart" : view

  React.useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onExpandedChange?.(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, onExpandedChange])

  const sortedRows = React.useMemo(
    () =>
      [...rows].sort((a, b) =>
        metric === "unique"
          ? b.unique_clicks - a.unique_clicks
          : b.clicks - a.clicks
      ),
    [rows, metric]
  )

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group/dim rounded-2xl border border-border/60 bg-shell p-0.5"
    >
      <SectionHeader
        className="h-9 px-2.5"
        icon={icon}
        title={title}
        action={
          <span className="flex items-center gap-1.5">
            <Segmented
              value={metric}
              onChange={onMetricChange}
              options={[
                { value: "total", label: "total" },
                { value: "unique", label: "unique" },
                { value: "both", label: "both" },
              ]}
            />
            <Segmented
              value={activeView}
              onChange={onViewChange}
              options={[
                { value: "chart", icon: ChartBar, ariaLabel: "chart view" },
                ...(hasMap
                  ? [
                      {
                        value: "map" as const,
                        icon: MapIcon,
                        ariaLabel: "map view",
                      },
                    ]
                  : []),
                { value: "table", icon: Table2, ariaLabel: "table view" },
              ]}
            />
            {onExpandedChange && (
              <button
                type="button"
                aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
                onClick={() => onExpandedChange(!expanded)}
                className={cn(
                  "flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground",
                  expanded && "text-foreground"
                )}
              >
                <ExpandIcon className="size-3.5" strokeWidth={1.75} />
              </button>
            )}
          </span>
        }
      />
      <Panel
        className={cn(
          "relative mt-0 overflow-hidden rounded-[14px] bg-background",
          expanded ? "h-[calc(100dvh-15rem)] min-h-[420px]" : "h-[340px]"
        )}
      >
        {loading ? (
          <Skeleton className="m-2 h-[calc(100%-16px)] w-auto" />
        ) : (
          /* Overlapping crossfade: both views stay absolutely positioned so
             the panel is never empty mid-switch; padding lives inside each
             view so the frame doesn't jump. */
          <AnimatePresence>
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute inset-0",
                activeView !== "table" && "p-2"
              )}
            >
              {activeView === "map" ? (
                <CountryMap rows={rows} metric={metric} onSelect={onSelect} />
              ) : activeView === "chart" ? (
                /* One stable wrapper in both states: a branch-shaped tree
                   here remounts the list and replays every bar. */
                <div
                  className={cn(
                    "h-full",
                    expanded &&
                      "overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]"
                  )}
                >
                  <BreakdownList
                    dimension={dimension}
                    rows={rows}
                    metric={metric}
                    onSelect={onSelect}
                    limit={expanded ? 100 : 8}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr className="border-b border-border/60 text-left text-muted-foreground">
                        <th className="h-8 w-full px-3 label-mono text-[10px] font-medium">
                          {title}
                        </th>
                        <th
                          className={cn(
                            "h-8 px-3 text-right label-mono text-[10px] font-medium",
                            metric !== "unique" && "text-foreground"
                          )}
                        >
                          Clicks
                        </th>
                        <th
                          className={cn(
                            "h-8 px-3 text-right label-mono text-[10px] font-medium",
                            metric === "unique" && "text-foreground"
                          )}
                        >
                          Unique
                        </th>
                        <th className="h-8 px-3 text-right label-mono text-[10px] font-medium">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sortedRows.map((row) => (
                        <tr
                          key={row.value}
                          onClick={() => onSelect?.(row.value)}
                          className={cn(
                            onSelect &&
                              "cursor-pointer transition-colors duration-150 hover:bg-accent/40"
                          )}
                        >
                          <td className="max-w-0 truncate px-3 py-2">
                            <span className="flex items-center gap-2">
                              <DimensionIcon
                                dimension={dimension}
                                value={row.value}
                                className="size-3.5"
                              />
                              <span className="truncate text-[13px] text-foreground">
                                {dimensionLabel(dimension, row.value)}
                              </span>
                            </span>
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              metric === "unique"
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {formatCount(row.clicks)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              metric === "unique"
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatCount(row.unique_clicks)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground tabular-nums">
                            {formatPercent(row.percentage)}
                          </td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-8 text-center text-xs text-muted-foreground/70"
                          >
                            no data in this range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Panel>
    </motion.div>
  )
}
