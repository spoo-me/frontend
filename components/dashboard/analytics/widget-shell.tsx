"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  SCOPE_DIMENSIONS,
  type ScopeDimension,
  type WidgetScope,
} from "@/lib/analytics-layout"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"

/**
 * Shared widget frame: header + a panel whose height derives from the grid
 * cell (flex-1), which is what makes resize-for-density work without any
 * measurement. Quick controls render only in read mode; edit mode gets the
 * delete affordance instead.
 */
export function WidgetShell({
  icon,
  title,
  scope,
  editing,
  narrow,
  onRemove,
  quickControls,
  panelClassName,
  children,
}: {
  icon?: React.ElementType
  title: string
  /** The widget's own lens; rendered as a quiet chip after the title. */
  scope?: WidgetScope
  editing?: boolean
  /** Phone-width cell: the leading icon yields its room to the title so
      long titles ("Clicks over time") survive next to the quick controls. */
  narrow?: boolean
  onRemove?: () => void
  quickControls?: React.ReactNode
  panelClassName?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border/60 bg-shell relative flex h-full flex-col rounded-2xl border p-0.5">
      {/* Quick controls stay live in edit mode (data-no-drag keeps them from
          starting grid drags) — configuration happens in place, not in a
          side panel. */}
      <SectionHeader
        className="h-9 shrink-0 px-2.5"
        icon={narrow ? undefined : icon}
        title={title}
        badge={scope && <ScopeChip scope={scope} />}
        action={quickControls && <span data-no-drag>{quickControls}</span>}
      />
      <Panel
        className={cn(
          "bg-background relative mt-0 min-h-0 flex-1 overflow-hidden rounded-[14px]",
          panelClassName,
        )}
      >
        {children}
      </Panel>
      {editing && onRemove && (
        <WidgetRemoveButton title={title} onRemove={onRemove} />
      )}
    </div>
  )
}

/** The widget's lens as a quiet display-only chip: identity icon + first
    value, "+n" for the rest, everything in the title attr. The bar owns
    editing. */
export function ScopeChip({ scope }: { scope: WidgetScope }) {
  const entries = SCOPE_DIMENSIONS.flatMap((dim) => {
    const values = scope[dim]
    return values?.length ? ([[dim, values]] as const) : []
  })
  const total = entries.reduce((s, [, v]) => s + v.length, 0)
  if (!total) return null
  const [dim, values] = entries[0]
  const first = values[0]
  const full = entries
    .map(([d, v]) => v.map((x) => scopeLabel(d, x)).join(", "))
    .join(" · ")
  return (
    <span
      title={full}
      className="bg-muted/60 text-muted-foreground flex min-w-0 max-w-36 shrink items-center gap-1 rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums"
    >
      <DimensionIcon dimension={dim} value={first} className="size-3 shrink-0" />
      <span className="truncate">{scopeLabel(dim, first)}</span>
      {total > 1 && (
        <span className="text-muted-foreground/60 shrink-0">+{total - 1}</span>
      )}
    </span>
  )
}

function scopeLabel(dim: ScopeDimension, value: string) {
  return dim === "short_code" ? `/${value}` : dimensionLabel(dim, value)
}

/** The edit-mode delete affordance; also used by shell-less widgets (stats). */
export function WidgetRemoveButton({
  title,
  onRemove,
}: {
  title: string
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      data-no-drag
      aria-label={`Remove ${title}`}
      onClick={onRemove}
      className="border-border/60 bg-popover text-muted-foreground hover:border-destructive/40 hover:text-destructive absolute -top-2 -right-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors duration-150"
    >
      <X className="size-3.5" strokeWidth={1.75} />
    </button>
  )
}
