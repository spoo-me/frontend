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
import { Panel, SectionHeader } from "@/components/dashboard/section"
import {
  HeaderControls,
  MetricControl,
} from "@/components/dashboard/analytics/metric-control"
import { Segmented } from "@/components/dashboard/segmented"

/**
 * One public-page breakdown: the analytics widget's read-mode anatomy —
 * metric control, chart<->table flip with the overlapping crossfade, the
 * scroll fade mask — reusing the same primitives, but composed under a
 * SectionHeader + Panel instead of the widget shell. Fixed panel height
 * keeps sibling sections uniform regardless of row counts.
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
    <div>
      <SectionHeader
        icon={icon}
        title={title}
        action={
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
      />
      <Panel
        className={cn("relative mt-2 h-72 overflow-hidden", panelClassName)}
      >
        {/* Overlapping crossfade: views stay absolutely positioned so the
            panel is never empty mid-switch (widget behavior, shell-less). */}
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
      </Panel>
    </div>
  )
}
