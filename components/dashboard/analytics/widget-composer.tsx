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
  Tag,
} from "lucide-react"

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
import { TagPicker } from "@/components/dashboard/tags/tag-picker"
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
 *
 * The form itself is `ComposerForm`, a controlled component — the dialog
 * owns one draft here; the marketing composer demo drives another through
 * a scripted timeline.
 */

export type XAxis = "none" | "time" | BreakdownDimension

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
  { dim: "tag_id", label: "Tags", icon: Tag },
  { dim: "city", label: "City", icon: Building2 },
]

const STAT_METRICS = Object.keys(STAT_META) as StatMetric[]

/** The composer's whole draft, liftable: the dialog owns one, and the
    marketing composer demo drives one through a scripted timeline. */
export type ComposerState = {
  x: XAxis
  statMetric: StatMetric
  seriesMetric: SeriesMetric
  statViz: StatViz
  tsViz: TimeseriesViz
  bdViz: BreakdownViz
  title: string
  accent: Accent
  scope: WidgetScope
}

export const COMPOSER_DEFAULTS: ComposerState = {
  x: "time",
  statMetric: "total_clicks",
  seriesMetric: "total",
  statViz: "number",
  tsViz: "area",
  bdViz: "bars",
  title: "",
  accent: "violet",
  scope: {},
}

export function composerKind(x: XAxis): WidgetKind {
  return x === "none" ? "stat" : x === "time" ? "timeseries" : "breakdown"
}

/** The draft as a board-ready widget — shared by the dialog preview and
    anything else that renders a composer state. */
export function composerDraft(s: ComposerState): Widget {
  const cleanScope: WidgetScope = {}
  for (const f of SCOPE_FIELDS) {
    const v = s.scope[f.dim]
    if (v?.length) cleanScope[f.dim] = v
  }
  const extras = {
    ...(s.title.trim() ? { title: s.title.trim().slice(0, 40) } : {}),
    ...(s.accent !== "violet" ? { accent: s.accent } : {}),
    ...(Object.keys(cleanScope).length ? { scope: cleanScope } : {}),
  }
  if (s.x === "none")
    return {
      id: "w_preview",
      kind: "stat",
      grid: { x: 0, y: 0, w: 3, h: 3 },
      config: {
        metric: s.statMetric,
        ...(s.statViz !== "number" ? { viz: s.statViz } : {}),
        ...extras,
      },
    }
  if (s.x === "time")
    return {
      id: "w_preview",
      kind: "timeseries",
      grid: { x: 0, y: 0, w: 6, h: 5 },
      config: { viz: s.tsViz, metric: s.seriesMetric, ...extras },
    }
  return {
    id: "w_preview",
    kind: "breakdown",
    grid: { x: 0, y: 0, w: 6, h: 5 },
    config: {
      dimension: s.x,
      viz: s.bdViz,
      metric: s.seriesMetric,
      ...extras,
    },
  }
}

function FieldLabel({
  children,
  hint,
  hintLabel,
  id,
}: {
  children: React.ReactNode
  hint?: string
  hintLabel?: string
  // Anchor for aria-labelledby: Radix triggers render as buttons, so
  // htmlFor can't associate the visible label with the control.
  id?: string
}) {
  if (hint)
    return (
      <span className="flex items-center gap-1.5">
        <span
          id={id}
          className="label-mono block text-[10px] text-muted-foreground/70"
        >
          {children}
        </span>
        <InfoHint label={hintLabel ?? "More info"}>{hint}</InfoHint>
      </span>
    )
  return (
    <span
      id={id}
      className="label-mono block text-[10px] text-muted-foreground/70"
    >
      {children}
    </span>
  )
}

/** The form column, controlled. Field-coupling rules (map needs
    countries, gauges need the rate metric) live here so every owner
    gets them for free. `fieldRef` hands out per-field anchors — the
    marketing demo aims its cursor with them. */
export function ComposerForm({
  state,
  onChange,
  range,
  fieldRef,
}: {
  state: ComposerState
  onChange: (patch: Partial<ComposerState>) => void
  range: TimeRange
  fieldRef?: (field: string) => React.Ref<HTMLDivElement> | undefined
}) {
  const kind = composerKind(state.x)

  const chartOptions =
    kind === "stat"
      ? STAT_VIZ_META.filter(
          (v) => v.value !== "gauge" || state.statMetric === "unique_rate"
        )
      : kind === "timeseries"
        ? TS_VIZ
        : BD_VIZ.filter((v) => v.value !== "map" || state.x === "country")

  const handleX = (next: XAxis) => {
    // Map only exists for countries; fall back rather than carry a dead pick.
    onChange({
      x: next,
      ...(next !== "country" && state.bdViz === "map"
        ? { bdViz: "bars" as BreakdownViz }
        : {}),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2" ref={fieldRef?.("title")}>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={state.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Optional"
          maxLength={40}
          className="h-8 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2" ref={fieldRef?.("x")}>
          <FieldLabel
            id="composer-x-label"
            hintLabel="How the X axis works"
            hint="What each point or row represents: time buckets for a series, or a dimension's values for a breakdown."
          >
            X axis
          </FieldLabel>
          <Select value={state.x} onValueChange={(v) => handleX(v as XAxis)}>
            <SelectTrigger
              aria-labelledby="composer-x-label"
              className="w-full text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {X_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <o.icon className="size-3.5" strokeWidth={1.75} />
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2" ref={fieldRef?.("y")}>
          <FieldLabel
            id="composer-y-label"
            hintLabel="How the Y axis works"
            hint="The measure being counted: total clicks, unique visitors, or both."
          >
            Y axis
          </FieldLabel>
          {kind === "stat" ? (
            <Select
              value={state.statMetric}
              onValueChange={(v) => {
                const m = v as StatMetric
                onChange({
                  statMetric: m,
                  // Gauges only exist for the percentage metric.
                  ...(m !== "unique_rate" && state.statViz === "gauge"
                    ? { statViz: "number" as StatViz }
                    : {}),
                })
              }}
            >
              <SelectTrigger
                aria-labelledby="composer-y-label"
                className="w-full text-xs"
              >
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
              value={state.seriesMetric}
              onValueChange={(v) =>
                onChange({ seriesMetric: v as SeriesMetric })
              }
            >
              <SelectTrigger
                aria-labelledby="composer-y-label"
                className="w-full text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERIES_METRIC_META.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    <m.icon className="size-3.5" strokeWidth={1.75} />
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="space-y-2" ref={fieldRef?.("scope")}>
        <FieldLabel
          hintLabel="How scope works"
          hint="Filters only this widget's data; the board's shared filters still apply on top."
        >
          Scope
        </FieldLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {SCOPE_FIELDS.map((f) =>
            f.dim === "tag_id" ? (
              <TagPicker
                key={f.dim}
                variant="button"
                label={f.label}
                selected={state.scope.tag_id ?? []}
                onChange={(values) =>
                  onChange({ scope: { ...state.scope, tag_id: values } })
                }
                className="w-full justify-start"
                modal
              />
            ) : (
              <DimensionFilter
                key={f.dim}
                dimension={f.dim}
                label={f.label}
                icon={f.icon}
                range={range}
                selected={state.scope[f.dim] ?? []}
                onChange={(values) =>
                  onChange({ scope: { ...state.scope, [f.dim]: values } })
                }
                className="w-full justify-start"
                modal
              />
            )
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-3 border-border/60 border-t pt-5">
        <div className="space-y-2" ref={fieldRef?.("chart")}>
          <FieldLabel
            id="composer-chart-label"
            hintLabel="Choosing a chart"
            hint="How the data draws. Some charts need a minimum number of categories to read well."
          >
            Chart
          </FieldLabel>
          <Select
            value={
              kind === "stat"
                ? state.statViz
                : kind === "timeseries"
                  ? state.tsViz
                  : state.bdViz
            }
            onValueChange={(v) =>
              kind === "stat"
                ? onChange({ statViz: v as StatViz })
                : kind === "timeseries"
                  ? onChange({ tsViz: v as TimeseriesViz })
                  : onChange({ bdViz: v as BreakdownViz })
            }
          >
            <SelectTrigger
              aria-labelledby="composer-chart-label"
              className="w-full text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <o.icon className="size-3.5" strokeWidth={1.75} />
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2" ref={fieldRef?.("ink")}>
          <FieldLabel id="composer-accent-label">Chart accent</FieldLabel>
          <Select
            value={state.accent}
            onValueChange={(v) => onChange({ accent: v as Accent })}
          >
            <SelectTrigger
              aria-labelledby="composer-accent-label"
              className="w-full text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCENTS.map((a) => (
                <SelectItem key={a} value={a} className="text-xs">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: ACCENT_VARS[a] }}
                  />
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
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
  const [state, setState] = React.useState<ComposerState>(COMPOSER_DEFAULTS)
  const onChange = React.useCallback(
    (patch: Partial<ComposerState>) => setState((s) => ({ ...s, ...patch })),
    []
  )

  const kind = composerKind(state.x)
  const full = widgetCount >= MAX_WIDGETS
  const draft = React.useMemo(() => composerDraft(state), [state])

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
        <div className="grid items-start gap-8 sm:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── live preview ──────────────────────────────────────────── */}
          <div className="pattern-dots flex items-center justify-center self-stretch rounded-xl p-6">
            <div
              className="pointer-events-none w-full select-none"
              style={{ height: kind === "stat" ? 220 : 400, maxWidth: 620 }}
            >
              <WidgetCell
                widget={draft}
                ctx={ctx}
                preview
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
          <div className="pt-6">
            <ComposerForm state={state} onChange={onChange} range={range} />
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
