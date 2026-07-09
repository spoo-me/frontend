"use client"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import { dimensionLabel } from "@/components/dashboard/dim-icon"

/**
 * Shared tooltip card for the categorical charts (donut, pie, columns,
 * treemap): value header, clicks/unique rows, computed unique rate. Same
 * grammar as the time-series ChartTooltip.
 */

export const OTHER = "__other__"

/** Recharts positions tooltips at z:auto; the donut's center total (and any
    absolutely-positioned sibling) would paint over them without this. */
export const TOOLTIP_WRAPPER_STYLE = { zIndex: 10 } as const

export function DimTooltip({
  active,
  payload,
  dimension,
}: {
  active?: boolean
  payload?: Array<{ payload: DimensionRow & { name?: unknown } }>
  dimension: Exclude<StatsDimension, "time">
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  // Treemap nodes overwrite `value` with the computed number; the string
  // category survives on `name` (nameKey) there.
  const raw =
    typeof d?.value === "string"
      ? d.value
      : typeof d?.name === "string"
        ? d.name
        : null
  if (raw == null) return null
  const rate = d.clicks ? Math.round((d.unique_clicks / d.clicks) * 100) : 0
  return (
    <div className="border-border/60 bg-popover min-w-[168px] overflow-hidden rounded-lg border shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
      <div className="border-border/60 bg-muted/40 border-b px-3 py-1.5">
        <span className="text-foreground text-xs font-medium">
          {raw === OTHER ? "Other" : dimensionLabel(dimension, raw)}
        </span>
      </div>
      <div className="space-y-1 px-3 py-2">
        <TooltipRow label="Clicks" value={formatCount(d.clicks)} />
        <TooltipRow label="Unique" value={formatCount(d.unique_clicks)} />
        <div className="border-border/60 mt-1.5 border-t pt-1.5">
          <TooltipRow label="Unique rate" value={`${rate}%`} muted />
        </div>
      </div>
    </div>
  )
}

export function TooltipRow({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground flex-1 text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-xs font-medium tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}
