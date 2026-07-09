"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel, SectionHeader } from "@/components/dashboard/section"

/**
 * Shared widget frame: header + a panel whose height derives from the grid
 * cell (flex-1), which is what makes resize-for-density work without any
 * measurement. Quick controls render only in read mode; edit mode gets the
 * delete affordance instead.
 */
export function WidgetShell({
  icon,
  title,
  editing,
  onRemove,
  quickControls,
  panelClassName,
  children,
}: {
  icon?: React.ElementType
  title: string
  editing?: boolean
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
        icon={icon}
        title={title}
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
