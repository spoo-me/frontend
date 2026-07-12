"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChartBar, Map as MapIcon, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DimensionRow } from "@/lib/api"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { BreakdownTable } from "@/components/dashboard/analytics/widgets/breakdown-table"
import { CountryMap } from "@/components/dashboard/analytics/country-map"
import {
  HeaderControls,
  MetricControl,
} from "@/components/dashboard/analytics/metric-control"
import { Segmented } from "@/components/dashboard/segmented"
import { WidgetShell } from "@/components/dashboard/analytics/widget-shell"

/**
 * One public-page breakdown: the analytics widget's read-mode anatomy —
 * shell, metric control, chart<->table flip with the overlapping
 * crossfade, the scroll fade mask — reusing the same primitives with a
 * fixed panel height so sibling sections stay uniform regardless of row
 * counts. No edit affordances: the arrangement is curated, not a grid.
 */
export function BreakdownSection({
  dimension,
  title,
  icon,
  rows,
  map,
  hasUnique = true,
  limit = 6,
  panelClassName,
}: {
  dimension: string
  title: string
  icon: React.ElementType
  rows: DimensionRow[]
  /** Countries: the chart view is the map. */
  map?: boolean
  /** v1 bots carry no unique counts — the metric stays locked to total. */
  hasUnique?: boolean
  limit?: number
  panelClassName?: string
}) {
  const [metric, setMetric] = React.useState<BreakdownMetric>("total")
  const [mode, setMode] = React.useState<"chart" | "table">("chart")

  return (
    <WidgetShell
      icon={icon}
      title={title}
      /* flex-none: the shell's panel is flex-1 for grid cells; here the
         section owns its height (absolute crossfade children have none). */
      panelClassName={cn("h-72 flex-none", panelClassName)}
      quickControls={
        <HeaderControls>
          {hasUnique && <MetricControl value={metric} onChange={setMetric} />}
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "chart",
                icon: map ? MapIcon : ChartBar,
                ariaLabel: "chart view",
              },
              { value: "table", icon: Table2, ariaLabel: "table view" },
            ]}
          />
        </HeaderControls>
      }
    >
      {/* Overlapping crossfade: views stay absolutely positioned so the
          panel is never empty mid-switch (widget behavior). */}
      <AnimatePresence>
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn("absolute inset-0", mode === "chart" && "p-2")}
        >
          {mode === "table" ? (
            <BreakdownTable
              dimension={dimension}
              title={title}
              rows={rows}
              metric={metric}
              fullCols={hasUnique}
            />
          ) : map ? (
            <CountryMap rows={rows} metric={metric} />
          ) : (
            <div className="h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,black,black_calc(100%-24px),transparent)]">
              <BreakdownList
                dimension={dimension}
                rows={rows}
                metric={metric}
                limit={limit}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </WidgetShell>
  )
}
