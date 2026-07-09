"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Activity,
  ChartArea,
  ChartBar,
  ChartColumn,
  ChartLine,
  ChartPie,
  Donut,
  Ellipsis,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  MousePointerClick,
  Plus,
  Redo2,
  RotateCcw,
  Table2,
  Trash2,
  TrendingUp,
  Undo2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  ACCENTS,
  type AnalyticsLayout,
  type BreakdownViz,
  type SeriesMetric,
  type TimeseriesViz,
  type Widget,
  type WidgetConfigPatch,
} from "@/lib/analytics-layout"
import {
  ACCENT_VARS,
  catalogMatch,
  catalogTitle,
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

const TS_VIZ: Array<{ value: TimeseriesViz; icon: React.ElementType; label: string }> = [
  { value: "area", icon: ChartArea, label: "Area" },
  { value: "line", icon: ChartLine, label: "Line" },
  { value: "step", icon: Activity, label: "Step" },
  { value: "bars", icon: ChartColumn, label: "Bars" },
  { value: "cumulative", icon: TrendingUp, label: "Cumulative" },
  { value: "table", icon: Table2, label: "Table" },
]
const BD_VIZ: Array<{ value: BreakdownViz; icon: React.ElementType; label: string }> = [
  { value: "bars", icon: ChartBar, label: "Bars" },
  { value: "columns", icon: ChartColumn, label: "Columns" },
  { value: "donut", icon: Donut, label: "Donut" },
  { value: "pie", icon: ChartPie, label: "Pie" },
  { value: "treemap", icon: LayoutDashboard, label: "Treemap" },
  { value: "map", icon: MapIcon, label: "Map" },
  { value: "table", icon: Table2, label: "Table" },
]
const METRICS: Array<{ value: SeriesMetric; icon: React.ElementType; label: string }> = [
  { value: "total", icon: MousePointerClick, label: "Total clicks" },
  { value: "unique", icon: Users, label: "Unique visitors" },
  { value: "both", icon: Layers, label: "Both" },
]
const METRIC_SHORT: Record<SeriesMetric, string> = {
  total: "Total",
  unique: "Unique",
  both: "Both",
}

function BarDivider() {
  return <span aria-hidden className="bg-border/60 mx-0.5 h-4 w-px shrink-0" />
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
        "text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        destructive
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function EditBar({
  layout,
  selected,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAdd,
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
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onAdd: (entryKey: string) => void
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

  const exportLayout = async () => {
    await navigator.clipboard.writeText(JSON.stringify(layout, null, 2))
    toast.success("Layout copied", {
      description: "Paste it into Import layout anywhere.",
    })
  }

  const runImport = () => {
    try {
      const ok = onReplaceLayout(JSON.parse(importText))
      if (!ok) throw new Error("invalid")
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
            (v) => v.value !== "map" || selected.config.dimension === "country",
          )
        : null
  const selectedViz =
    selected && selected.kind !== "stat" ? selected.config.viz : null
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
          className="border-border/60 bg-popover/95 pointer-events-auto flex items-center gap-1 rounded-full border p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]"
        >
          {selected ? (
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
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2">
                        {currentVizOption && (
                          <>
                            <currentVizOption.icon
                              className="size-3.5"
                              strokeWidth={1.75}
                            />
                            <span className="text-xs">{currentVizOption.label}</span>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    {/* Content width defaults to the trigger's; these
                        triggers are tiny, so size to the labels instead. */}
                    <DropdownMenuContent align="center" side="top" className="w-40">
                      <DropdownMenuLabel className="label-mono text-muted-foreground/60 text-[10px]">
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
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2">
                      <currentMetric.icon className="size-3.5" strokeWidth={1.75} />
                      <span className="text-xs">
                        {METRIC_SHORT[currentMetric.value]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" side="top" className="w-44">
                    <DropdownMenuLabel className="label-mono text-muted-foreground/60 text-[10px]">
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
                    className="hover:bg-accent/60 aria-expanded:bg-accent/60 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
                  >
                    <span
                      aria-hidden
                      className="size-3.5 rounded-full"
                      style={{ background: ACCENT_VARS[selectedAccent] }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-auto">
                  <DropdownMenuLabel className="label-mono text-muted-foreground/60 text-[10px]">
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
                        onClick={() => onConfigChange(selected.id, { accent: a })}
                        className={cn(
                          "size-5 shrink-0 rounded-full transition-transform duration-150 hover:scale-110",
                          selectedAccent === a &&
                            "ring-foreground/60 ring-offset-popover ring-1 ring-offset-2",
                        )}
                        style={{ background: ACCENT_VARS[a] }}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <BarDivider />
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
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2.5">
                    <Plus className="size-3.5" strokeWidth={1.75} />
                    <span className="text-xs">Add widget</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-52">
                  {(["Summary", "Charts"] as const).map((group, gi) => (
                    <React.Fragment key={group}>
                      {gi > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="label-mono text-muted-foreground/60 text-[10px]">
                        {group}
                      </DropdownMenuLabel>
                      {WIDGET_CATALOG.filter((e) => e.group === group).map((e) => {
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
                      })}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <BarDivider />
              <BarIconButton label={`Undo (${modKey}Z)`} onClick={onUndo} disabled={!canUndo}>
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
                    className="text-muted-foreground hover:bg-accent/60 hover:text-foreground aria-expanded:bg-accent/60 aria-expanded:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
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
              <Button size="sm" className="h-7 rounded-full px-3" onClick={onDone}>
                Done
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>

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
      className="text-foreground placeholder:text-muted-foreground/60 w-36 bg-transparent px-1 font-mono text-xs outline-none"
    />
  )
}
