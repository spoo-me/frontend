"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChartBar,
  ChartPie,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Table2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCount, formatPercent } from "@/lib/format"
import type { DimensionRow } from "@/lib/api"
import {
  breakdownBarLimit,
  breakdownTableFullCols,
  donutLegend,
  donutSegments,
  type BreakdownConfig,
} from "@/lib/analytics-layout"
import { DIMENSION_META } from "@/components/dashboard/analytics/widget-meta"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { CountryMap } from "@/components/dashboard/analytics/country-map"
import { DonutChart } from "@/components/dashboard/analytics/widgets/donut-chart"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { Segmented } from "@/components/dashboard/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetShell } from "@/components/dashboard/analytics/widget-shell"

/**
 * One dimension's top values as a widget: bars / donut / table (+ map for
 * countries). Size drives density — the cell's grid height decides how many
 * rows the bars show and how many slices the donut carries; width decides
 * the table's columns and the donut's legend.
 */
export function BreakdownWidget({
  config,
  w,
  h,
  rows,
  loading,
  editing,
  expanded,
  onExpandedChange,
  onConfigChange,
  onSelect,
  onRemove,
}: {
  config: BreakdownConfig
  w: number
  h: number
  rows: DimensionRow[]
  loading: boolean
  editing?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onConfigChange: (patch: Partial<BreakdownConfig>) => void
  onSelect?: (value: string) => void
  onRemove?: () => void
}) {
  const { dimension, metric } = config
  const meta = DIMENSION_META[dimension]
  const hasMap = dimension === "country"
  // The shell toggle is a transient peek; the persisted default lives in
  // config.viz and the parent re-keys this component when it changes. A
  // stale "map" on a non-country widget falls back to bars.
  const [view, setView] = React.useState(
    config.viz === "map" && !hasMap ? "bars" : config.viz,
  )
  const viz = view === "map" && !hasMap ? "bars" : view

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
          : b.clicks - a.clicks,
      ),
    [rows, metric],
  )

  const fullCols = expanded || breakdownTableFullCols(w)
  const ExpandIcon = expanded ? Minimize2 : Maximize2

  return (
    <WidgetShell
      icon={meta.icon}
      title={config.title ?? meta.title}
      editing={editing}
      onRemove={onRemove}
      panelClassName={
        expanded ? "h-[calc(100dvh-15rem)] min-h-[420px] flex-none" : undefined
      }
      quickControls={
        <span className="flex items-center gap-1.5">
          <Segmented
            value={metric}
            onChange={(m) => onConfigChange({ metric: m })}
            options={[
              { value: "total", label: "total" },
              { value: "unique", label: "unique" },
              { value: "both", label: "both" },
            ]}
          />
          <Segmented
            value={viz}
            onChange={setView}
            options={[
              { value: "bars", icon: ChartBar, ariaLabel: "bars view" },
              { value: "donut", icon: ChartPie, ariaLabel: "donut view" },
              ...(hasMap
                ? [{ value: "map" as const, icon: MapIcon, ariaLabel: "map view" }]
                : []),
              { value: "table", icon: Table2, ariaLabel: "table view" },
            ]}
          />
          {onExpandedChange && (
            <button
              type="button"
              aria-label={expanded ? `Collapse ${meta.title}` : `Expand ${meta.title}`}
              onClick={() => onExpandedChange(!expanded)}
              className={cn(
                "text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground flex size-6 items-center justify-center rounded-md transition-colors duration-150",
                expanded && "text-foreground",
              )}
            >
              <ExpandIcon className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
        </span>
      }
    >
      {loading ? (
        <Skeleton className="m-2 h-[calc(100%-16px)] w-auto" />
      ) : (
        /* Overlapping crossfade: views stay absolutely positioned so the
           panel is never empty mid-switch; padding lives inside each view. */
        <AnimatePresence>
          <motion.div
            key={viz}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn("absolute inset-0", viz !== "table" && "p-2")}
          >
            {viz === "map" ? (
              <CountryMap rows={rows} metric={metric} onSelect={onSelect} />
            ) : viz === "donut" ? (
              <DonutChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                segments={expanded ? 6 : donutSegments(h)}
                legend={expanded || donutLegend(w)}
                onSelect={onSelect}
              />
            ) : viz === "bars" ? (
              /* One stable wrapper in both states: a branch-shaped tree here
                 remounts the list and replays every bar. */
              <div
                className={cn(
                  "h-full",
                  expanded &&
                    "overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]",
                )}
              >
                <BreakdownList
                  dimension={dimension}
                  rows={rows}
                  metric={metric}
                  onSelect={onSelect}
                  limit={expanded ? 100 : breakdownBarLimit(h)}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr className="border-border/60 text-muted-foreground border-b text-left">
                      <th className="label-mono h-8 w-full px-3 text-[10px] font-medium">
                        {meta.title}
                      </th>
                      <th
                        className={cn(
                          "label-mono h-8 px-3 text-right text-[10px] font-medium",
                          metric !== "unique" && "text-foreground",
                          !fullCols && metric === "unique" && "hidden",
                        )}
                      >
                        Clicks
                      </th>
                      <th
                        className={cn(
                          "label-mono h-8 px-3 text-right text-[10px] font-medium",
                          metric === "unique" && "text-foreground",
                          !fullCols && metric !== "unique" && "hidden",
                        )}
                      >
                        Unique
                      </th>
                      <th
                        className={cn(
                          "label-mono h-8 px-3 text-right text-[10px] font-medium",
                          !fullCols && "hidden",
                        )}
                      >
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
                            !fullCols && metric === "unique" && "hidden",
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
                            !fullCols && metric !== "unique" && "hidden",
                          )}
                        >
                          {formatCount(row.unique_clicks)}
                        </td>
                        <td
                          className={cn(
                            "text-muted-foreground px-3 py-2 text-right font-mono text-xs tabular-nums",
                            !fullCols && "hidden",
                          )}
                        >
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
    </WidgetShell>
  )
}
