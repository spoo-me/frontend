"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChartBar, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import { formatCount, formatPercent } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import {
  BreakdownList,
  type BreakdownMetric,
} from "@/components/dashboard/breakdown-list"
import { Segmented } from "@/components/dashboard/segmented"
import {
  DimensionIcon,
  dimensionLabel,
} from "@/components/dashboard/dim-icon"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * One dimension's card with chart↔table duality and per-card metric views
 * (SPEC §7). Rows in either view are click-to-filter.
 */
export function DimensionCard({
  dimension,
  title,
  icon,
  rows,
  loading,
  onSelect,
}: {
  dimension: Exclude<StatsDimension, "time">
  title: string
  icon: React.ElementType
  rows: DimensionRow[]
  loading?: boolean
  onSelect?: (value: string) => void
}) {
  const [view, setView] = React.useState<"chart" | "table">("chart")
  const [metric, setMetric] = React.useState<BreakdownMetric>("total")

  const sortedRows = React.useMemo(
    () =>
      [...rows].sort((a, b) =>
        metric === "unique"
          ? b.unique_clicks - a.unique_clicks
          : b.clicks - a.clicks,
      ),
    [rows, metric],
  )

  return (
    <div>
      <SectionHeader
        icon={icon}
        title={title}
        action={
          <span className="flex items-center gap-1.5">
            <Segmented
              value={metric}
              onChange={setMetric}
              options={[
                { value: "total", label: "total" },
                { value: "unique", label: "unique" },
                { value: "both", label: "both" },
              ]}
            />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "chart", icon: ChartBar, ariaLabel: "chart view" },
                { value: "table", icon: Table2, ariaLabel: "table view" },
              ]}
            />
          </span>
        }
      />
      <Panel
        className={cn(
          "mt-2 h-[340px] overflow-hidden",
          view === "chart" ? "p-2" : "",
        )}
      >
        {loading ? (
          <Skeleton className="m-2 h-[308px] w-auto" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="h-full"
            >
              {view === "chart" ? (
                <BreakdownList
                  dimension={dimension}
                  rows={rows}
                  metric={metric}
                  onSelect={onSelect}
                />
              ) : (
                <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr className="border-border/60 text-muted-foreground border-b text-left">
                        <th className="label-mono h-8 w-full px-3 text-[10px] font-medium">
                          {title}
                        </th>
                        <th
                          className={cn(
                            "label-mono h-8 px-3 text-right text-[10px] font-medium",
                            metric !== "unique" && "text-foreground",
                          )}
                        >
                          Clicks
                        </th>
                        <th
                          className={cn(
                            "label-mono h-8 px-3 text-right text-[10px] font-medium",
                            metric === "unique" && "text-foreground",
                          )}
                        >
                          Unique
                        </th>
                        <th className="label-mono h-8 px-3 text-right text-[10px] font-medium">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border/60 divide-y">
                      {sortedRows.map((row) => (
                        <tr
                          key={row.value}
                          onClick={() => onSelect?.(row.value)}
                          className={cn(
                            onSelect &&
                              "hover:bg-accent/40 cursor-pointer transition-colors duration-150",
                          )}
                        >
                          <td className="max-w-0 truncate px-3 py-2">
                            <span className="flex items-center gap-2">
                              <DimensionIcon
                                dimension={dimension}
                                value={row.value}
                                className="size-3.5"
                              />
                              <span className="text-foreground truncate text-[13px]">
                                {dimensionLabel(dimension, row.value)}
                              </span>
                            </span>
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              metric === "unique"
                                ? "text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {formatCount(row.clicks)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-xs tabular-nums",
                              metric === "unique"
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatCount(row.unique_clicks)}
                          </td>
                          <td className="text-muted-foreground px-3 py-2 text-right font-mono text-xs tabular-nums">
                            {formatPercent(row.percentage)}
                          </td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-muted-foreground/70 px-3 py-8 text-center text-xs"
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
    </div>
  )
}
