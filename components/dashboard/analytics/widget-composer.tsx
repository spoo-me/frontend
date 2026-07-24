"use client"

import * as React from "react"
import {
  Building2,
  Clock,
  Compass,
  Globe2,
  Hash,
  Link2,
  MapPin,
  MonitorSmartphone,
} from "@/components/icons"

import { cn } from "@/lib/utils"
import {
  ACCENTS,
  MAX_WIDGETS,
  type Accent,
  type BreakdownDimension,
  type BreakdownViz,
  type ScopeDimension,
  type SeriesMetric,
  type StatMetric,
  type StatViz,
  type TimeseriesViz,
  type Widget,
  type WidgetConfigPatch,
  type WidgetKind,
  type WidgetScope,
} from "@/lib/analytics-layout"
import type { WidgetStatsCtx } from "@/hooks/use-widget-stats"
import {
  ACCENT_VARS,
  BD_VIZ,
  SERIES_METRIC_META,
  STAT_META,
  STAT_VIZ_META,
  TS_VIZ,
} from "@/components/dashboard/analytics/widget-meta"
import { WidgetCell } from "@/components/dashboard/analytics/widget-cell"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
import { InfoHint } from "@/components/dashboard/info-hint"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * The chart constructor: the authoring door into widgets. The preview on
 * the left IS the real widget — the same WidgetCell the board renders,
 * fed the draft config and live (scoped) data. The form on the right maps
 * honestly onto what the stats data can express: X = time or a dimension
 * (or none, a single stat), Y = the measure, then chart / scope / ink.
 */

type XAxis = "none" | "time" | BreakdownDimension

const X_OPTIONS: Array<{
  value: XAxis
  label: string
  icon: React.ElementType
}> = [
  { value: "none", label: "None (single stat)", icon: Hash },
  { value: "time", label: "Time", icon: Clock },
  { value: "short_code", label: "Links", icon: Link2 },
  { value: "referrer", label: "Referrers", icon: Globe2 },
  { value: "country", label: "Countries", icon: MapPin },
  { value: "city", label: "Cities", icon: Building2 },
  { value: "browser", label: "Browsers", icon: Compass },
  { value: "os", label: "OS", icon: MonitorSmartphone },
]

const SCOPE_FIELDS: Array<{
  dim: ScopeDimension
  label: string
  icon: React.ElementType
}> = [
  { dim: "short_code", label: "Links", icon: Link2 },
  { dim: "referrer", label: "Referrer", icon: Globe2 },
  { dim: "country", label: "Country", icon: MapPin },
  { dim: "browser", label: "Browser", icon: Compass },
  { dim: "os", label: "OS", icon: MonitorSmartphone },
  { dim: "city", label: "City", icon: Building2 },
]

const STAT_METRICS = Object.keys(STAT_META) as StatMetric[]

function FieldLabel({
  children,
  hint,
  hintLabel,
}: {
  children: React.ReactNode
  hint?: string
  hintLabel?: string
}) {
  if (hint)
    return (
      <span className="flex items-center gap-1.5">
        <span className="label-mono block text-[10px] text-muted-foreground/70">
          {children}
        </span>
        <InfoHint label={hintLabel ?? "More info"}>{hint}</InfoHint>
      </span>
    )
  return (
    <span className="label-mono block text-[10px] text-muted-foreground/70">
      {children}
    </span>
  )
}

export function WidgetComposer({
  onOpenChange,
  ctx,
  range,
  rangeLabel,
  deltaLabel,
  widgetCount,
  onAdd,
}: {
  onOpenChange: (open: boolean) => void
  ctx: WidgetStatsCtx
  range: TimeRange
  rangeLabel: string
  deltaLabel: string
  widgetCount: number
  onAdd: (kind: WidgetKind, seed: WidgetConfigPatch) => void
}) {
  const [x, setX] = React.useState<XAxis>("time")
  const [statMetric, setStatMetric] = React.useState<StatMetric>("total_clicks")
  const [seriesMetric, setSeriesMetric] = React.useState<SeriesMetric>("total")
  const [statViz, setStatViz] = React.useState<StatViz>("number")
  const [tsViz, setTsViz] = React.useState<TimeseriesViz>("area")
  const [bdViz, setBdViz] = React.useState<BreakdownViz>("bars")
  const [title, setTitle] = React.useState("")
  const [accent, setAccent] = React.useState<Accent>("violet")
  const [scope, setScope] = React.useState<WidgetScope>({})

  const kind: WidgetKind =
    x === "none" ? "stat" : x === "time" ? "timeseries" : "breakdown"
  const full = widgetCount >= MAX_WIDGETS

  const cleanScope = React.useMemo(() => {
    const out: WidgetScope = {}
    for (const f of SCOPE_FIELDS) {
      const v = scope[f.dim]
      if (v?.length) out[f.dim] = v
    }
    return Object.keys(out).length ? out : undefined
  }, [scope])

  const draft = React.useMemo<Widget>(() => {
    const extras = {
      ...(title.trim() ? { title: title.trim().slice(0, 40) } : {}),
      ...(accent !== "violet" ? { accent } : {}),
      ...(cleanScope ? { scope: cleanScope } : {}),
    }
    if (x === "none")
      return {
        id: "w_preview",
        kind: "stat",
        grid: { x: 0, y: 0, w: 3, h: 3 },
        config: {
          metric: statMetric,
          ...(statViz !== "number" ? { viz: statViz } : {}),
          ...extras,
        },
      }
    if (x === "time")
      return {
        id: "w_preview",
        kind: "timeseries",
        grid: { x: 0, y: 0, w: 6, h: 5 },
        config: { viz: tsViz, metric: seriesMetric, ...extras },
      }
    return {
      id: "w_preview",
      kind: "breakdown",
      grid: { x: 0, y: 0, w: 6, h: 5 },
      config: { dimension: x, viz: bdViz, metric: seriesMetric, ...extras },
    }
  }, [
    x,
    statMetric,
    seriesMetric,
    statViz,
    tsViz,
    bdViz,
    title,
    accent,
    cleanScope,
  ])

  const chartOptions =
    kind === "stat"
      ? STAT_VIZ_META.filter(
          (v) => v.value !== "gauge" || statMetric === "unique_rate"
        )
      : kind === "timeseries"
        ? TS_VIZ
        : BD_VIZ.filter((v) => v.value !== "map" || x === "country")

  const handleX = (next: XAxis) => {
    setX(next)
    // Map only exists for countries; fall back rather than carry a dead pick.
    if (next !== "country" && bdViz === "map") setBdViz("bars")
  }

  const handleAdd = () => {
    onAdd(kind, { ...draft.config })
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Custom chart</DialogTitle>
          <DialogDescription>
            The preview is live: exactly what lands on the board.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_300px]">
          {/* ── live preview ──────────────────────────────────────────── */}
          <div className="pattern-dots flex items-center justify-center rounded-xl p-6">
            <div
              className="pointer-events-none w-full select-none"
              style={{ height: kind === "stat" ? 220 : 400, maxWidth: 620 }}
            >
              <WidgetCell
                widget={draft}
                ctx={ctx}
                rangeLabel={rangeLabel}
                deltaLabel={deltaLabel}
                onConfigChange={() => {}}
                onRemove={() => {}}
                onRangeSelect={() => {}}
                onToggleFilter={() => {}}
              />
            </div>
          </div>

          {/* ── form ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <FieldLabel>Title</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
                maxLength={40}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel
                hintLabel="How the X axis works"
                hint="What each point or row represents: time buckets for a series, or a dimension's values for a breakdown."
              >
                X axis
              </FieldLabel>
              <Select value={x} onValueChange={(v) => handleX(v as XAxis)}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {X_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-xs"
                    >
                      <o.icon className="size-3.5" strokeWidth={1.75} />
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel
                hintLabel="How the Y axis works"
                hint="The measure being counted: total clicks, unique visitors, or both."
              >
                Y axis
              </FieldLabel>
              {kind === "stat" ? (
                <Select
                  value={statMetric}
                  onValueChange={(v) => {
                    const m = v as StatMetric
                    setStatMetric(m)
                    // Gauges only exist for the percentage metric.
                    if (m !== "unique_rate" && statViz === "gauge")
                      setStatViz("number")
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAT_METRICS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {STAT_META[m].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={seriesMetric}
                  onValueChange={(v) => setSeriesMetric(v as SeriesMetric)}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERIES_METRIC_META.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs"
                      >
                        <m.icon className="size-3.5" strokeWidth={1.75} />
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel
                hintLabel="Choosing a chart"
                hint="How the data draws. Some charts need a minimum number of categories to read well."
              >
                Chart
              </FieldLabel>
              <Select
                value={
                  kind === "stat"
                    ? statViz
                    : kind === "timeseries"
                      ? tsViz
                      : bdViz
                }
                onValueChange={(v) =>
                  kind === "stat"
                    ? setStatViz(v as StatViz)
                    : kind === "timeseries"
                      ? setTsViz(v as TimeseriesViz)
                      : setBdViz(v as BreakdownViz)
                }
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartOptions.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-xs"
                    >
                      <o.icon className="size-3.5" strokeWidth={1.75} />
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel
                hintLabel="How scope works"
                hint="Filters only this widget's data; the board's shared filters still apply on top."
              >
                Scope
              </FieldLabel>
              <p className="text-[11px] text-muted-foreground/60 leading-snug">
                Only clicks matching these filters are counted.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SCOPE_FIELDS.map((f) => (
                  <DimensionFilter
                    key={f.dim}
                    dimension={f.dim}
                    label={f.label}
                    icon={f.icon}
                    range={range}
                    selected={scope[f.dim] ?? []}
                    onChange={(values) =>
                      setScope((s) => ({ ...s, [f.dim]: values }))
                    }
                    className="w-full justify-start"
                    modal
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel
                hintLabel="What chart ink does"
                hint="The accent color this widget draws with; purely visual."
              >
                Chart ink
              </FieldLabel>
              <div className="flex flex-wrap items-center gap-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-label={`${a} ink`}
                    title={a}
                    onClick={() => setAccent(a)}
                    className={cn(
                      "size-4.5 shrink-0 rounded-full transition-transform duration-150 hover:scale-110",
                      accent === a &&
                        "ring-1 ring-foreground/60 ring-offset-2 ring-offset-background"
                    )}
                    style={{ background: ACCENT_VARS[a] }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="items-center">
          {full && (
            <span className="mr-auto text-muted-foreground/70 text-xs">
              board is full ({MAX_WIDGETS} widgets)
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={full} onClick={handleAdd}>
            Add widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
