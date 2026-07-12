"use client"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { DimensionRow, StatsDimension } from "@/lib/api"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"

/**
 * Shared tooltip card for the categorical charts (donut, pie, columns,
 * treemap, radial, radar, scatter, bubbles): identity icon + value header,
 * accent-hinted clicks/unique rows, computed unique rate. Same grammar as
 * the time-series ChartTooltip.
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
    <div className="min-w-[168px] overflow-hidden rounded-lg border border-border/60 bg-popover shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-1.5 border-border/60 border-b bg-muted/40 px-3 py-1.5">
        {raw !== OTHER && (
          <DimensionIcon
            dimension={dimension}
            value={raw}
            className="size-3.5 shrink-0"
          />
        )}
        <span className="min-w-0 truncate font-medium text-foreground text-xs">
          {raw === OTHER ? "Other" : dimensionLabel(dimension, raw)}
        </span>
      </div>
      <div className="space-y-1 px-3 py-2">
        <TooltipRow
          swatch="fill"
          label="Clicks"
          value={formatCount(d.clicks)}
        />
        <TooltipRow
          swatch="ring"
          label="Unique"
          value={formatCount(d.unique_clicks)}
        />
        <div className="mt-1.5 border-border/60 border-t pt-1.5">
          <TooltipRow label="Unique rate" value={`${rate}%`} muted />
        </div>
      </div>
    </div>
  )
}

export function TooltipRow({
  swatch,
  label,
  value,
  muted,
}: {
  /** Series hint in the widget's ink, same grammar as ChartTooltip. */
  swatch?: "fill" | "ring"
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {swatch && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={
            swatch === "fill"
              ? { background: "var(--chart-accent, var(--brand))" }
              : { border: "1px solid var(--chart-accent, var(--brand))" }
          }
        />
      )}
      <span className="flex-1 text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-medium font-mono text-xs tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}
