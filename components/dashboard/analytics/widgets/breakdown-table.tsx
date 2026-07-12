"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatCount, formatPercent } from "@/lib/format"
import type { DimensionRow } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { EmptyRange } from "@/components/dashboard/analytics/widgets/empty-range"

/**
 * Dense value/clicks/share table — the read-mode flip side of every
 * breakdown viz (the analytics widget and the public stats page share it).
 * Scroll fades out at the bottom edge; the parent owns the height.
 */
export function BreakdownTable({
  dimension,
  title,
  rows,
  metric,
  fullCols = true,
  onSelect,
}: {
  dimension: string
  /** First column header (the dimension's display title). */
  title: string
  rows: DimensionRow[]
  metric: BreakdownMetric
  /** Narrow cells drop the off-metric and share columns. */
  fullCols?: boolean
  onSelect?: (value: string) => void
}) {
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
    <div className="flex h-full flex-col overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr className="border-border/60 border-b text-left text-muted-foreground">
            <th className="label-mono h-8 w-full px-3 font-medium text-[10px]">
              {title}
            </th>
            <th
              className={cn(
                "label-mono h-8 px-3 text-right font-medium text-[10px]",
                metric !== "unique" && "text-foreground",
                !fullCols && metric === "unique" && "hidden"
              )}
            >
              Clicks
            </th>
            <th
              className={cn(
                "label-mono h-8 px-3 text-right font-medium text-[10px]",
                metric === "unique" && "text-foreground",
                !fullCols && metric !== "unique" && "hidden"
              )}
            >
              Unique
            </th>
            <th
              className={cn(
                "label-mono h-8 px-3 text-right font-medium text-[10px]",
                !fullCols && "hidden"
              )}
            >
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
                    : "text-foreground",
                  !fullCols && metric === "unique" && "hidden"
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
                  !fullCols && metric !== "unique" && "hidden"
                )}
              >
                {formatCount(row.unique_clicks)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-mono text-muted-foreground text-xs tabular-nums",
                  !fullCols && "hidden"
                )}
              >
                {formatPercent(row.percentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <EmptyRange className="flex-1" />}
    </div>
  )
}
