"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  ArrowLeft,
  Building2,
  Compass,
  Copy,
  Ellipsis,
  Funnel,
  Globe2,
  History,
  Link2,
  MapPin,
  MonitorSmartphone,
  Plus,
  Redo2,
  RotateCcw,
  SquarePen,
  Trash2,
  Undo2,
  X,
} from "@/components/icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  trackBoardLayoutExported,
  trackBoardLayoutImported,
} from "@/lib/analytics"
import {
  ACCENTS,
  type AnalyticsLayout,
  type ScopeDimension,
  type SeriesMetric,
  type Widget,
  type WidgetConfigPatch,
} from "@/lib/analytics-layout"
import { DimensionFilter } from "@/components/dashboard/analytics/dimension-filter"
import { WidgetComposer } from "@/components/dashboard/analytics/widget-composer"
import type { WidgetStatsCtx } from "@/hooks/use-widget-stats"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"
import type { WidgetKind } from "@/lib/analytics-layout"
import {
  ACCENT_VARS,
  BD_VIZ,
  catalogMatch,
  catalogTitle,
  SERIES_METRIC_META as METRICS,
  STAT_VIZ_META,
  TS_VIZ,
  WIDGET_CATALOG,
  widgetIcon,
} from "@/components/dashboard/analytics/widget-meta"
import { Button } from "@/components/ui/button"
import { useModKey } from "@/components/dashboard/kbd"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

/**
 * The dynamic edit bar: one floating surface that owns everything about
 * editing. Board ops at rest (add, undo/redo, reset, meta); the moment a
 * widget is selected it morphs into that widget's controls (rename, default
 * view, accent, reset, delete). No panel, no drawer — a command bar.
 */

const METRIC_SHORT: Record<SeriesMetric, string> = {
  total: "Total",
  unique: "Unique",
  both: "Both",
}
/** The six scopeable dimensions, with filter-chip labels (not card titles). */
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

function BarDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-border/60" />
}

function BarIconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        destructive
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-accent/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function EditBar({
  layout,
  selected,
  range,
  cellCtx,
  rangeLabel,
  deltaLabel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAdd,
  onAddCustom,
  onDuplicate,
  onRemove,
  onResetWidget,
  onConfigChange,
  onResetAll,
  onReplaceLayout,
  onDeselect,
  onDone,
}: {
  layout: AnalyticsLayout
  selected: Widget | null
  /** The board's time range — scope pickers list values from it. */
  range: TimeRange
  /** The same data context the board's cells use; powers the constructor's
      live preview. */
  cellCtx: WidgetStatsCtx
  rangeLabel: string
  deltaLabel: string
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onAdd: (entryKey: string) => void
  onAddCustom: (kind: WidgetKind, seed: WidgetConfigPatch) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onResetWidget: (id: string) => void
  onConfigChange: (id: string, patch: WidgetConfigPatch) => void
  onResetAll: () => void
  onReplaceLayout: (doc: unknown) => boolean
  onDeselect: () => void
  onDone: () => void
}) {
  const modKey = useModKey()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [importError, setImportError] = React.useState(false)
  // Mounted on demand: the constructor's preview queries live only while
  // it's open, and every open starts from a fresh draft.
  const [composerOpen, setComposerOpen] = React.useState(false)
  // Scope sub-state is keyed to the widget it was opened for: selecting a
  // different widget (or deselecting) falls back to the widget state.
  const [scopeFor, setScopeFor] = React.useState<string | null>(null)
  const scopeOpen = !!selected && scopeFor === selected.id

  // Esc closes the scope state before the page's deselect handler runs.
  // Capture phase; an open picker popover gets to close itself first.
  React.useEffect(() => {
    if (!scopeOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return
      e.preventDefault()
      e.stopPropagation()
      setScopeFor(null)
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [scopeOpen])

  const exportLayout = async () => {
    await navigator.clipboard.writeText(JSON.stringify(layout, null, 2))
    trackBoardLayoutExported("analytics")
    toast.success("Layout copied", {
      description: "Paste it into Import layout anywhere.",
    })
  }

  const runImport = () => {
    try {
      const ok = onReplaceLayout(JSON.parse(importText))
      if (!ok) throw new Error("invalid")
      trackBoardLayoutImported("analytics")
      setImportOpen(false)
      setImportText("")
      setImportError(false)
      toast.success("Layout imported")
    } catch {
      setImportError(true)
    }
  }

  const vizOptions =
    selected?.kind === "timeseries"
      ? TS_VIZ
      : selected?.kind === "breakdown"
        ? BD_VIZ.filter(
            (v) => v.value !== "map" || selected.config.dimension === "country"
          )
        : selected?.kind === "stat"
          ? STAT_VIZ_META.filter(
              (v) =>
                v.value !== "gauge" || selected.config.metric === "unique_rate"
            )
          : null
  const selectedViz = selected
    ? selected.kind === "stat"
      ? (selected.config.viz ?? "number")
      : selected.config.viz
    : null
  const currentVizOption =
    vizOptions?.find((v) => v.value === selectedViz) ?? null
  // Stat tiles have a fixed metric identity; series widgets choose theirs.
  const seriesMetric =
    selected && selected.kind !== "stat" ? selected.config.metric : null
  const currentMetric = METRICS.find((m) => m.value === seriesMetric) ?? null
  const selectedAccent = selected?.config.accent ?? "violet"
  // createElement keeps the lint from reading an icon lookup as a component
  // definition-in-render.
  const selectedIconEl = selected
    ? React.createElement(widgetIcon(selected), {
        className: "text-muted-foreground/70 ml-2 size-3.5 shrink-0",
        strokeWidth: 1.75,
      })
    : null

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        data-edit-bar
        className="pointer-events-none fixed bottom-8 left-1/2 z-30 -translate-x-1/2"
      >
        <motion.div
          layout
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-popover/95 p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]"
        >
          {selected && scopeOpen ? (
            /* ── scope state: this widget's own lens ──────────────────── */
            <>
              <BarIconButton label="Back" onClick={() => setScopeFor(null)}>
                <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              {selectedIconEl}
              <span className="label-mono px-1 text-[10px] text-muted-foreground/60">
                Scope
              </span>
              <BarDivider />
              <span className="flex items-center gap-1.5 px-1">
                {SCOPE_FIELDS.map((f) => (
                  <DimensionFilter
                    key={f.dim}
                    compact
                    dimension={f.dim}
                    label={f.label}
                    icon={f.icon}
                    range={range}
                    selected={selected.config.scope?.[f.dim] ?? []}
                    onChange={(values) =>
                      onConfigChange(selected.id, {
                        scope: { ...selected.config.scope, [f.dim]: values },
                      })
                    }
                  />
                ))}
              </span>
              <BarDivider />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={!selected.config.scope}
                onClick={() => onConfigChange(selected.id, { scope: null })}
              >
                Clear
              </Button>
            </>
          ) : selected ? (
            /* ── widget state ─────────────────────────────────────────── */
            <>
              {selectedIconEl}
              <RenameInput
                key={selected.id}
                value={selected.config.title ?? ""}
                placeholder={catalogTitle(selected)}
                onCommit={(title) => onConfigChange(selected.id, { title })}
              />
              {vizOptions && selectedViz && (
                <>
                  <BarDivider />
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2"
                      >
                        {currentVizOption && (
                          <>
                            <currentVizOption.icon
                              className="size-3.5"
                              strokeWidth={1.75}
                            />
                            <span className="text-xs">
                              {currentVizOption.label}
                            </span>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    {/* Content width defaults to the trigger's; these
                        triggers are tiny, so size to the labels instead. */}
                    <DropdownMenuContent
                      align="center"
                      side="top"
                      className="w-40"
                    >
                      <DropdownMenuLabel className="label-mono text-[10px] text-muted-foreground/60">
                        Default view
                      </DropdownMenuLabel>
                      {vizOptions.map((v) => (
                        <DropdownMenuCheckboxItem
                          key={v.value}
                          className="whitespace-nowrap"
                          checked={selectedViz === v.value}
                          onCheckedChange={() =>
                            onConfigChange(selected.id, { viz: v.value })
                          }
                        >
                          <v.icon className="size-3.5" strokeWidth={1.75} />
                          {v.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {seriesMetric && currentMetric && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                    >
                      <currentMetric.icon
                        className="size-3.5"
                        strokeWidth={1.75}
                      />
                      <span className="text-xs">
                        {METRIC_SHORT[currentMetric.value]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    side="top"
                    className="w-44"
                  >
                    <DropdownMenuLabel className="label-mono text-[10px] text-muted-foreground/60">
                      Metric
                    </DropdownMenuLabel>
                    {METRICS.map((m) => (
                      <DropdownMenuCheckboxItem
                        key={m.value}
                        className="whitespace-nowrap"
                        checked={seriesMetric === m.value}
                        onCheckedChange={() =>
                          onConfigChange(selected.id, { metric: m.value })
                        }
                      >
                        <m.icon className="size-3.5" strokeWidth={1.75} />
                        {m.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {selected.kind === "timeseries" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          className="whitespace-nowrap"
                          checked={selected.config.compare === "previous"}
                          onCheckedChange={(on) =>
                            onConfigChange(selected.id, {
                              compare: on ? "previous" : null,
                            })
                          }
                        >
                          <History className="size-3.5" strokeWidth={1.75} />
                          vs previous
                        </DropdownMenuCheckboxItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <BarDivider />
              {/* Chart ink: applies to the visualization only, never chrome. */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Chart ink"
                    title="Chart ink"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-accent/60 aria-expanded:bg-accent/60"
                  >
                    <span
                      aria-hidden
                      className="size-3.5 rounded-full"
                      style={{ background: ACCENT_VARS[selectedAccent] }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  side="top"
                  className="w-auto"
                >
                  <DropdownMenuLabel className="label-mono text-[10px] text-muted-foreground/60">
                    Chart ink
                  </DropdownMenuLabel>
                  {/* One row: the spectrum reads as a ramp, never wraps. */}
                  <div className="flex items-center gap-1.5 px-2 pt-1 pb-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        aria-label={`${a} ink`}
                        title={a}
                        onClick={() =>
                          onConfigChange(selected.id, { accent: a })
                        }
                        className={cn(
                          "size-5 shrink-0 rounded-full transition-transform duration-150 hover:scale-110",
                          selectedAccent === a &&
                            "ring-1 ring-foreground/60 ring-offset-2 ring-offset-popover"
                        )}
                        style={{ background: ACCENT_VARS[a] }}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <BarDivider />
              <BarIconButton
                label="Scope"
                onClick={() => setScopeFor(selected.id)}
              >
                <span className="relative flex">
                  <Funnel className="size-3.5" strokeWidth={1.75} />
                  {selected.config.scope && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand"
                    />
                  )}
                </span>
              </BarIconButton>
              <BarIconButton
                label="Duplicate"
                onClick={() => onDuplicate(selected.id)}
              >
                <Copy className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              <BarIconButton
                label="Reset chart"
                onClick={() => onResetWidget(selected.id)}
              >
                <RotateCcw className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              <BarIconButton
                label="Delete widget"
                destructive
                onClick={() => onRemove(selected.id)}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              <BarDivider />
              <BarIconButton label="Deselect" onClick={onDeselect}>
                <X className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
            </>
          ) : (
            /* ── board state ──────────────────────────────────────────── */
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5"
                  >
                    <Plus className="size-3.5" strokeWidth={1.75} />
                    <span className="text-xs">Add widget</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-52">
                  {(["Summary", "Charts"] as const).map((group, gi) => (
                    <React.Fragment key={group}>
                      {gi > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="label-mono text-[10px] text-muted-foreground/60">
                        {group}
                      </DropdownMenuLabel>
                      {WIDGET_CATALOG.filter((e) => e.group === group).map(
                        (e) => {
                          const match = catalogMatch(layout.widgets, e)
                          return (
                            <DropdownMenuCheckboxItem
                              key={e.key}
                              checked={!!match}
                              // Keep the menu open: composing the board is one errand.
                              onSelect={(ev) => ev.preventDefault()}
                              onCheckedChange={(checked) => {
                                if (checked) onAdd(e.key)
                                else if (match) onRemove(match.id)
                              }}
                            >
                              <e.icon className="size-3.5" strokeWidth={1.75} />
                              {e.label}
                            </DropdownMenuCheckboxItem>
                          )
                        }
                      )}
                    </React.Fragment>
                  ))}
                  <DropdownMenuSeparator />
                  {/* The authoring door: scoped widgets aren't catalog items. */}
                  <DropdownMenuItem onSelect={() => setComposerOpen(true)}>
                    <SquarePen className="size-3.5" strokeWidth={1.75} />
                    Custom chart…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <BarDivider />
              <BarIconButton
                label={`Undo (${modKey}Z)`}
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              <BarIconButton
                label={`Redo (${modKey}⇧Z)`}
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="size-3.5" strokeWidth={1.75} />
              </BarIconButton>
              <BarDivider />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More"
                    title="More"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground aria-expanded:bg-accent/60 aria-expanded:text-foreground"
                  >
                    <Ellipsis className="size-3.5" strokeWidth={1.75} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-44">
                  <DropdownMenuItem onSelect={exportLayout}>
                    Export layout
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                    Import layout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmReset(true)}
                  >
                    Reset layout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <BarDivider />
              <Button
                size="sm"
                className="h-7 rounded-full px-3"
                onClick={onDone}
              >
                Done
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>

      {composerOpen && (
        <WidgetComposer
          onOpenChange={(v) => setComposerOpen(v)}
          ctx={cellCtx}
          range={range}
          rangeLabel={rangeLabel}
          deltaLabel={deltaLabel}
          widgetCount={layout.widgets.length}
          onAdd={onAddCustom}
        />
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset layout to default?</AlertDialogTitle>
            <AlertDialogDescription>
              Your arrangement, sizes, names and accents are replaced by the
              default dashboard. Undo can bring it back until you leave the
              page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onResetAll}>
              Reset layout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={importOpen}
        onOpenChange={(v) => {
          setImportOpen(v)
          setImportError(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import layout</DialogTitle>
            <DialogDescription>
              Paste a layout exported from any spoo.me dashboard. Your current
              arrangement is replaced (undo works).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value)
                setImportError(false)
              }}
              placeholder='{"version":1,"widgets":[...]}'
              spellCheck={false}
              className="max-h-48 min-h-32 font-mono text-xs"
            />
            {importError && (
              <p className="text-destructive text-xs">
                That doesn&apos;t look like a layout document.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" disabled={!importText.trim()} onClick={runImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Borderless inline rename: commits on blur or Enter, Esc reverts. */
function RenameInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string
  placeholder: string
  onCommit: (title: string) => void
}) {
  const [draft, setDraft] = React.useState(value)
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      // Read the DOM value: blur can land before the last onChange commits.
      onBlur={(e) => {
        const v = e.currentTarget.value.trim()
        if (v !== value) onCommit(v)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        if (e.key === "Escape") {
          setDraft(value)
          ;(e.target as HTMLInputElement).blur()
          e.stopPropagation()
        }
      }}
      placeholder={placeholder}
      maxLength={40}
      aria-label="Widget name"
      className="w-36 bg-transparent px-1 font-mono text-foreground text-xs outline-none placeholder:text-muted-foreground/60"
    />
  )
}
