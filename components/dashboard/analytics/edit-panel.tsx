"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  ChartArea,
  ChartBar,
  ChartLine,
  ChartPie,
  Copy,
  Map as MapIcon,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  BREAKDOWN_DIMENSIONS,
  MAX_WIDGETS,
  type BreakdownViz,
  type TimeseriesViz,
  type Widget,
  type WidgetConfigPatch,
  type WidgetKind,
} from "@/lib/analytics-layout"
import {
  DIMENSION_META,
  KIND_META,
  STAT_META,
} from "@/components/dashboard/analytics/widget-meta"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/dashboard/segmented"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * The floating editor panel: an add-widget palette when nothing is selected,
 * a per-kind config form when a widget is. A plain positioned card — no
 * overlay, no focus trap — so the grid stays directly manipulable beside it.
 */

const STAT_METRICS = [
  "total_clicks",
  "unique_clicks",
  "unique_rate",
  "clicks_per_visitor",
] as const

const TS_VIZ: Array<{ value: TimeseriesViz; icon: React.ElementType; label: string }> = [
  { value: "area", icon: ChartArea, label: "Area" },
  { value: "line", icon: ChartLine, label: "Line" },
  { value: "bars", icon: ChartBar, label: "Bars" },
  { value: "table", icon: Table2, label: "Table" },
]
const BD_VIZ: Array<{ value: BreakdownViz; icon: React.ElementType; label: string }> = [
  { value: "bars", icon: ChartBar, label: "Bars" },
  { value: "donut", icon: ChartPie, label: "Donut" },
  { value: "map", icon: MapIcon, label: "Map" },
  { value: "table", icon: Table2, label: "Table" },
]

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-mono text-muted-foreground/60 text-[10px]">{children}</div>
  )
}

/** Icon-tile picker: the Segmented grammar stretched to labeled tiles. */
function VizTiles<T extends string>({
  options,
  value,
  onChange,
  disabledValues = [],
}: {
  options: Array<{ value: T; icon: React.ElementType; label: string }>
  value: T
  onChange: (v: T) => void
  disabledValues?: T[]
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((o) => {
        const disabled = disabledValues.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === o.value}
            title={disabled ? "Only available for countries" : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              "border-border/60 flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors duration-150",
              value === o.value
                ? "bg-accent text-foreground border-border"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              disabled && "pointer-events-none opacity-40",
            )}
          >
            <o.icon className="size-3.5" strokeWidth={1.75} />
            <span className="text-[10px]">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function EditPanel({
  widgets,
  selected,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onConfigChange,
  onResetAll,
}: {
  widgets: Widget[]
  selected: Widget | null
  onSelect: (id: string | null) => void
  onAdd: (kind: WidgetKind) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onConfigChange: (id: string, patch: WidgetConfigPatch) => void
  onResetAll: () => void
}) {
  const full = widgets.length >= MAX_WIDGETS

  const title = selected
    ? selected.kind === "stat"
      ? STAT_META[selected.config.metric].label
      : selected.kind === "timeseries"
        ? "Clicks over time"
        : DIMENSION_META[selected.config.dimension].title
    : null

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="border-border/60 bg-popover fixed top-24 right-6 bottom-24 z-40 hidden w-80 flex-col overflow-hidden rounded-2xl border shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] lg:flex dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]"
    >
      {selected ? (
        <>
          <div className="border-border/60 flex h-11 shrink-0 items-center gap-2 border-b px-4">
            {(() => {
              const Icon =
                selected.kind === "breakdown"
                  ? DIMENSION_META[selected.config.dimension].icon
                  : KIND_META[selected.kind].icon
              return (
                <Icon className="text-muted-foreground/70 size-3.5" strokeWidth={1.75} />
              )
            })()}
            <span className="label-mono text-muted-foreground flex-1 truncate">
              {title}
            </span>
            <button
              type="button"
              aria-label="Deselect widget"
              onClick={() => onSelect(null)}
              className="text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground flex size-6 items-center justify-center rounded-md transition-colors duration-150"
            >
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            {selected.kind === "stat" && (
              <div className="space-y-2">
                <PanelLabel>Metric</PanelLabel>
                <div className="space-y-1">
                  {STAT_METRICS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={selected.config.metric === m}
                      onClick={() => onConfigChange(selected.id, { metric: m })}
                      className={cn(
                        "border-border/60 flex h-9 w-full items-center justify-between rounded-lg border px-3 text-[13px] transition-colors duration-150",
                        selected.config.metric === m
                          ? "bg-accent text-foreground border-border"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                      )}
                    >
                      {STAT_META[m].label}
                      {STAT_META[m].footer && (
                        <span className="text-muted-foreground/60 font-mono text-[10px]">
                          {STAT_META[m].footer}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected.kind === "timeseries" && (
              <>
                <div className="space-y-2">
                  <PanelLabel>Visualization</PanelLabel>
                  <VizTiles
                    options={TS_VIZ}
                    value={selected.config.viz}
                    onChange={(viz) => onConfigChange(selected.id, { viz })}
                  />
                </div>
                <div className="space-y-2">
                  <PanelLabel>Metric</PanelLabel>
                  <Segmented
                    className="w-full [&>button]:flex-1"
                    value={selected.config.metric}
                    onChange={(metric) => onConfigChange(selected.id, { metric })}
                    options={[
                      { value: "total", label: "total" },
                      { value: "unique", label: "unique" },
                      { value: "both", label: "both" },
                    ]}
                  />
                </div>
              </>
            )}

            {selected.kind === "breakdown" && (
              <>
                <div className="space-y-2">
                  <PanelLabel>Dimension</PanelLabel>
                  <Select
                    value={selected.config.dimension}
                    onValueChange={(dimension) =>
                      onConfigChange(selected.id, {
                        dimension: dimension as (typeof BREAKDOWN_DIMENSIONS)[number],
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BREAKDOWN_DIMENSIONS.map((d) => {
                        const Meta = DIMENSION_META[d]
                        return (
                          <SelectItem key={d} value={d}>
                            <span className="flex items-center gap-2">
                              <Meta.icon
                                className="text-muted-foreground size-3.5"
                                strokeWidth={1.75}
                              />
                              {Meta.title}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <PanelLabel>Visualization</PanelLabel>
                  <VizTiles
                    options={BD_VIZ}
                    value={selected.config.viz}
                    onChange={(viz) => onConfigChange(selected.id, { viz })}
                    disabledValues={
                      selected.config.dimension === "country" ? [] : ["map"]
                    }
                  />
                </div>
                <div className="space-y-2">
                  <PanelLabel>Metric</PanelLabel>
                  <Segmented
                    className="w-full [&>button]:flex-1"
                    value={selected.config.metric}
                    onChange={(metric) => onConfigChange(selected.id, { metric })}
                    options={[
                      { value: "total", label: "total" },
                      { value: "unique", label: "unique" },
                      { value: "both", label: "both" },
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          <div className="border-border/60 flex shrink-0 items-center gap-2 border-t p-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={full}
              onClick={() => onDuplicate(selected.id)}
            >
              <Copy data-icon="inline-start" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive flex-1"
              onClick={() => onRemove(selected.id)}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="border-border/60 flex h-11 shrink-0 items-center gap-2 border-b px-4">
            <Plus className="text-muted-foreground/70 size-3.5" strokeWidth={1.75} />
            <span className="label-mono text-muted-foreground flex-1">
              Add widgets
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
            {(Object.keys(KIND_META) as WidgetKind[]).map((kind) => {
              const meta = KIND_META[kind]
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={full}
                  onClick={() => onAdd(kind)}
                  className="border-border/60 hover:bg-accent/40 group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="border-border/60 bg-muted/40 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                    <meta.icon
                      className="text-muted-foreground size-4"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block text-[13px] font-medium">
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {meta.hint}
                    </span>
                  </span>
                  <Plus
                    className="text-muted-foreground/0 group-hover:text-muted-foreground size-4 transition-colors duration-150"
                    strokeWidth={1.75}
                  />
                </button>
              )
            })}
            {full && (
              <p className="text-muted-foreground/60 px-1 pt-1 text-[11px]">
                Widget limit reached ({MAX_WIDGETS}). Remove one to add another.
              </p>
            )}
            <p className="text-muted-foreground/60 px-1 pt-2 text-[11px]">
              Click a widget to configure it. Drag to move, pull the corner to
              resize, arrows nudge the selection.
            </p>
          </div>
          <div className="border-border/60 shrink-0 border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onResetAll}
            >
              <RotateCcw data-icon="inline-start" />
              Reset to default
            </Button>
          </div>
        </>
      )}
    </motion.aside>
  )
}
