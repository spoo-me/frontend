"use client"

import * as React from "react"
import {
  Activity,
  ChartArea,
  ChartColumn,
  ChartLine,
  Maximize2,
  Minimize2,
  Table2,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import { timeSeriesOf, type StatsResponse } from "@/lib/api"
import type { TimeseriesConfig } from "@/lib/analytics-layout"
import { ClicksChart } from "@/components/dashboard/clicks-chart"
import { Segmented } from "@/components/dashboard/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetShell } from "@/components/dashboard/analytics/widget-shell"

const TS_CHART_ICONS = {
  area: ChartArea,
  line: ChartLine,
  step: Activity,
  bars: ChartColumn,
  cumulative: TrendingUp,
} as const

/**
 * Clicks over time as a widget. The chart type is composed in the edit bar;
 * read mode only offers a chart <-> table flip. All chart layers stay
 * MOUNTED behind a crossfade — unmounting would replay the draw animation.
 */
export function TimeseriesWidget({
  config,
  loading,
  stats,
  prevStats,
  disjoint,
  editing,
  expanded,
  onExpandedChange,
  onConfigChange,
  onRangeSelect,
  onRemove,
}: {
  config: TimeseriesConfig
  loading: boolean
  stats?: StatsResponse
  /** Previous equal-length window; drawn as a ghost when compare is on. */
  prevStats?: StatsResponse
  /** Scope and board filters exclude each other — nothing to show. */
  disjoint?: boolean
  editing?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onConfigChange: (patch: Partial<TimeseriesConfig>) => void
  onRangeSelect: (from: Date, to: Date) => void
  onRemove?: () => void
}) {
  // Read mode only flips between the CONFIGURED chart and the table — the
  // chart type itself is composed in the edit bar. Transient peek; the
  // parent re-keys this component when the configured default changes.
  const chartViz = config.viz === "table" ? "area" : config.viz
  const [mode, setMode] = React.useState<"chart" | "table">(
    config.viz === "table" ? "table" : "chart",
  )
  const { metric } = config
  const series = React.useMemo(() => (stats ? timeSeriesOf(stats) : []), [stats])
  const prevSeries = React.useMemo(
    () =>
      config.compare === "previous" && prevStats
        ? timeSeriesOf(prevStats)
        : undefined,
    [config.compare, prevStats],
  )
  const hourly = stats?.time_bucket_info.strategy === "hourly"

  const timeRows = React.useMemo(() => [...series].reverse(), [series])
  const timeRowFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        ...(hourly ? { hour: "numeric" as const } : {}),
      }),
    [hourly],
  )

  React.useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onExpandedChange?.(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, onExpandedChange])

  const ExpandIcon = expanded ? Minimize2 : Maximize2

  return (
    <WidgetShell
      icon={ChartLine}
      title={config.title ?? "Clicks over time"}
      scope={config.scope}
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
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "chart",
                icon: TS_CHART_ICONS[chartViz],
                ariaLabel: "chart view",
              },
              { value: "table", icon: Table2, ariaLabel: "table view" },
            ]}
          />
          {onExpandedChange && (
            <button
              type="button"
              aria-label={
                expanded ? "Collapse Clicks over time" : "Expand Clicks over time"
              }
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
        <Skeleton className="h-full w-full" />
      ) : disjoint ? (
        <div className="text-muted-foreground/70 flex h-full items-center justify-center px-6 text-center text-xs">
          scope excluded by board filters
        </div>
      ) : (
        <>
          {/* One chart layer only: the parent re-keys this widget when the
              configured type changes, so chartViz is stable for a mount.
              It stays mounted behind the table flip (no draw replay). */}
          <div
            className={cn(
              "absolute inset-0 p-4 transition-opacity duration-150 ease-out",
              mode !== "chart" && "pointer-events-none opacity-0",
            )}
          >
            <ClicksChart
              series={series}
              prevSeries={prevSeries}
              hourly={hourly}
              height="100%"
              metric={metric}
              variant={chartViz}
              expanded={expanded}
              onRangeSelect={onRangeSelect}
            />
          </div>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-150 ease-out",
              mode !== "table" && "pointer-events-none opacity-0",
            )}
          >
            <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr className="border-border/60 text-muted-foreground border-b text-left">
                    <th className="label-mono h-8 w-full px-3 text-[10px] font-medium">
                      When
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
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y">
                  {timeRows.map((b) => (
                    <tr key={b.bucket}>
                      <td className="text-foreground px-3 py-2 font-mono text-xs tabular-nums">
                        {timeRowFmt.format(new Date(b.bucket))}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono text-xs tabular-nums",
                          metric === "unique"
                            ? "text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {formatCount(b.clicks)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono text-xs tabular-nums",
                          metric === "unique"
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatCount(b.unique_clicks)}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-right font-mono text-xs tabular-nums">
                        {b.clicks
                          ? Math.round((b.unique_clicks / b.clicks) * 100) + "%"
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                  {!timeRows.length && (
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
          </div>
        </>
      )}
    </WidgetShell>
  )
}
