"use client"

import * as React from "react"

import { dimensionRowsOf } from "@/lib/api"
import type { Widget, WidgetConfigPatch } from "@/lib/analytics-layout"
import { useWidgetStats, type WidgetStatsCtx } from "@/hooks/use-widget-stats"
import {
  ACCENT_VARS,
  DIMENSION_META,
  STAT_META,
} from "@/components/dashboard/analytics/widget-meta"
import { WidgetRemoveButton } from "@/components/dashboard/analytics/widget-shell"
import { StatWidget } from "@/components/dashboard/analytics/widgets/stat-widget"
import { TimeseriesWidget } from "@/components/dashboard/analytics/widgets/timeseries-widget"
import { BreakdownWidget } from "@/components/dashboard/analytics/widgets/breakdown-widget"

/**
 * One board cell: resolves the widget's data (shared lens or its own scope
 * via useWidgetStats) and renders the right widget component. Extracted
 * from the page's renderWidget closure so every widget can own queries.
 * Also the constructor's live preview — it renders this exact component.
 */
export function WidgetCell({
  widget: w,
  ctx,
  editing,
  expanded,
  narrow,
  preview,
  rangeLabel,
  deltaLabel,
  onExpandedChange,
  onConfigChange,
  onRemove,
  onRangeSelect,
  onToggleFilter,
}: {
  widget: Widget
  ctx: WidgetStatsCtx
  editing?: boolean
  expanded?: boolean
  /** Mobile stack: the cell renders at phone width no matter what the
      stored grid.w says, so header controls must take their compact form. */
  narrow?: boolean
  /** Composer preview: the widget is an exhibit — no header controls. */
  preview?: boolean
  rangeLabel: string
  deltaLabel: string
  /** Absent while editing (focus mode and edit mode are exclusive). */
  onExpandedChange?: (expanded: boolean) => void
  onConfigChange: (patch: WidgetConfigPatch) => void
  onRemove: () => void
  onRangeSelect: (from: Date, to: Date) => void
  /** Click-to-filter is always GLOBAL — scope is the widget's lens, clicks
      steer the whole board. */
  onToggleFilter: (
    filterKey: "link" | "referrer" | "country" | "browser" | "os" | "city",
    value: string
  ) => void
}) {
  const { stats, prev, loading, disjoint } = useWidgetStats(w, ctx)

  const accentStyle = {
    "--chart-accent": ACCENT_VARS[w.config.accent ?? "violet"],
  } as React.CSSProperties

  const body = (() => {
    switch (w.kind) {
      case "stat":
        return (
          <StatWidget
            key={`view:${w.config.viz ?? "number"}`}
            config={w.config}
            h={w.grid.h}
            stats={stats}
            prevStats={prev}
            disjoint={disjoint}
            rangeLabel={rangeLabel}
            deltaLabel={deltaLabel}
          />
        )
      case "timeseries":
        return (
          <TimeseriesWidget
            key={`view:${w.config.viz}`}
            config={w.config}
            narrow={narrow}
            preview={preview}
            loading={loading}
            stats={stats}
            prevStats={prev}
            disjoint={disjoint}
            editing={editing}
            expanded={expanded}
            onExpandedChange={onExpandedChange}
            onConfigChange={onConfigChange}
            onRangeSelect={onRangeSelect}
            onRemove={onRemove}
          />
        )
      case "breakdown": {
        const meta = DIMENSION_META[w.config.dimension]
        return (
          <BreakdownWidget
            key={`view:${w.config.viz}`}
            config={w.config}
            w={w.grid.w}
            h={w.grid.h}
            narrow={narrow}
            preview={preview}
            rows={stats ? dimensionRowsOf(stats, w.config.dimension) : []}
            loading={loading}
            disjoint={disjoint}
            editing={editing}
            expanded={expanded}
            onExpandedChange={onExpandedChange}
            onConfigChange={onConfigChange}
            onSelect={(v) => onToggleFilter(meta.filterKey, v)}
            onRemove={onRemove}
          />
        )
      }
    }
  })()

  return (
    <div className="relative h-full" style={accentStyle}>
      {body}
      {editing && w.kind === "stat" && (
        <WidgetRemoveButton
          title={STAT_META[w.config.metric].label}
          onRemove={onRemove}
        />
      )}
    </div>
  )
}
