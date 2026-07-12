"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Bubbles,
  ChartBar,
  ChartColumn,
  ChartPie,
  ChartScatter,
  Donut,
  LayoutDashboard,
  LoaderCircle,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Radar,
  Table2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { DimensionRow } from "@/lib/api"
import {
  breakdownBarLimit,
  breakdownColumnCount,
  breakdownTableFullCols,
  bubbleLimit,
  donutLegend,
  donutSegments,
  radarSpokes,
  scatterPointLimit,
  treemapSegments,
  type BreakdownConfig,
} from "@/lib/analytics-layout"
import { DIMENSION_META } from "@/components/dashboard/analytics/widget-meta"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { BreakdownTable } from "@/components/dashboard/analytics/widgets/breakdown-table"
import { CountryMap } from "@/components/dashboard/analytics/country-map"
import { DonutChart } from "@/components/dashboard/analytics/widgets/donut-chart"
import { ColumnChart } from "@/components/dashboard/analytics/widgets/column-chart"
import { TreemapChart } from "@/components/dashboard/analytics/widgets/treemap-chart"
import { BreakdownScatter } from "@/components/dashboard/analytics/widgets/scatter-chart"
import { RadialChart } from "@/components/dashboard/analytics/widgets/radial-chart"
import { BreakdownRadar } from "@/components/dashboard/analytics/widgets/radar-chart"
import { BubbleChart } from "@/components/dashboard/analytics/widgets/bubble-chart"
import {
  HeaderControls,
  MetricControl,
} from "@/components/dashboard/analytics/metric-control"
import { Segmented } from "@/components/dashboard/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetShell } from "@/components/dashboard/analytics/widget-shell"

const BD_CHART_ICONS = {
  bars: ChartBar,
  columns: ChartColumn,
  donut: Donut,
  pie: ChartPie,
  treemap: LayoutDashboard,
  radial: LoaderCircle,
  radar: Radar,
  bubbles: Bubbles,
  scatter: ChartScatter,
  map: MapIcon,
} as const

/**
 * One dimension's top values as a widget. The chart type (bars / donut /
 * map) is composed in the edit bar; read mode only offers a chart <-> table
 * flip. Size drives density — grid height decides how many rows the bars
 * show and how many slices the donut carries; width decides the table's
 * columns and the donut's legend.
 */
export function BreakdownWidget({
  config,
  w,
  h,
  narrow,
  rows,
  loading,
  disjoint,
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
  /** Rendered at phone width (mobile stack): the header icon yields its
      room to the title. Control folding is measured, not flagged. */
  narrow?: boolean
  rows: DimensionRow[]
  loading: boolean
  /** Scope and board filters exclude each other — nothing to show. */
  disjoint?: boolean
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
  // Read mode only flips between the CONFIGURED chart and the table — the
  // chart type itself is composed in the edit bar. A stale "map" on a
  // non-country widget falls back to bars.
  const configuredChart =
    config.viz === "table"
      ? hasMap
        ? "map"
        : "bars"
      : config.viz === "map" && !hasMap
        ? "bars"
        : config.viz
  const [mode, setMode] = React.useState<"chart" | "table">(
    config.viz === "table" ? "table" : "chart"
  )
  const viz = mode === "table" ? "table" : configuredChart

  React.useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onExpandedChange?.(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, onExpandedChange])

  const fullCols = expanded || breakdownTableFullCols(w)
  const ExpandIcon = expanded ? Minimize2 : Maximize2

  return (
    <WidgetShell
      icon={meta.icon}
      title={config.title ?? meta.title}
      scope={config.scope}
      editing={editing}
      narrow={narrow}
      onRemove={onRemove}
      panelClassName={
        expanded ? "h-[calc(100dvh-15rem)] min-h-[420px] flex-none" : undefined
      }
      quickControls={
        <HeaderControls>
          <MetricControl
            value={metric}
            onChange={(m) => onConfigChange({ metric: m })}
          />
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "chart",
                icon: BD_CHART_ICONS[configuredChart],
                ariaLabel: "chart view",
              },
              { value: "table", icon: Table2, ariaLabel: "table view" },
            ]}
          />
          {onExpandedChange && (
            <button
              type="button"
              aria-label={
                expanded ? `Collapse ${meta.title}` : `Expand ${meta.title}`
              }
              onClick={() => onExpandedChange(!expanded)}
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground",
                expanded && "text-foreground"
              )}
            >
              <ExpandIcon className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
        </HeaderControls>
      }
    >
      {loading ? (
        <Skeleton className="m-2 h-[calc(100%-16px)] w-auto" />
      ) : disjoint ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground/70 text-xs">
          scope excluded by board filters
        </div>
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
            ) : viz === "donut" || viz === "pie" ? (
              <DonutChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                segments={expanded ? 6 : donutSegments(h)}
                legend={expanded || donutLegend(w)}
                variant={viz}
                onSelect={onSelect}
              />
            ) : viz === "columns" ? (
              <ColumnChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                count={expanded ? 12 : breakdownColumnCount(w)}
                onSelect={onSelect}
              />
            ) : viz === "treemap" ? (
              <TreemapChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                segments={expanded ? 18 : treemapSegments(w, h)}
                onSelect={onSelect}
              />
            ) : viz === "radial" ? (
              <RadialChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                segments={expanded ? 6 : donutSegments(h)}
                legend={expanded || donutLegend(w)}
                onSelect={onSelect}
              />
            ) : viz === "radar" ? (
              <BreakdownRadar
                dimension={dimension}
                rows={rows}
                metric={metric}
                spokes={expanded ? 8 : radarSpokes(w)}
              />
            ) : viz === "bubbles" ? (
              <BubbleChart
                dimension={dimension}
                rows={rows}
                metric={metric}
                limit={expanded ? 30 : bubbleLimit(w, h)}
                onSelect={onSelect}
              />
            ) : viz === "scatter" ? (
              <BreakdownScatter
                dimension={dimension}
                rows={rows}
                metric={metric}
                limit={expanded ? 60 : scatterPointLimit(w, h)}
                onSelect={onSelect}
              />
            ) : viz === "bars" ? (
              /* One stable wrapper in both states: a branch-shaped tree here
                 remounts the list and replays every bar. */
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
                  limit={expanded ? 100 : breakdownBarLimit(h)}
                />
              </div>
            ) : (
              <BreakdownTable
                dimension={dimension}
                title={meta.title}
                rows={rows}
                metric={metric}
                fullCols={fullCols}
                onSelect={onSelect}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </WidgetShell>
  )
}
