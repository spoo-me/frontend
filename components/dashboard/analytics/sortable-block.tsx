"use client"

import * as React from "react"
import type { DraggableAttributes } from "@dnd-kit/core"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { BlockSpan } from "@/lib/analytics-layout"

/**
 * Grid cell that owns the useSortable call. Render-prop children receive the
 * attributes/listeners so the page can mount them on the grip INSIDE the card
 * header — one hook call, listeners travel as plain props, the card component
 * never learns about dnd-kit.
 */
export function SortableBlock({
  id,
  span,
  expanded,
  hiddenCell,
  disabled,
  dragActive,
  children,
}: {
  id: string
  span: BlockSpan
  expanded: boolean
  /** Focus mode hides non-focused cells via CSS (never unmount). */
  hiddenCell: boolean
  disabled: boolean
  dragActive: boolean
  children: (bits: {
    attributes: DraggableAttributes
    listeners: SyntheticListenerMap | undefined
    isDragging: boolean
  }) => React.ReactNode
}) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging, over } =
    useSortable({ id, disabled })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        hiddenCell && "hidden",
        (span === 2 || expanded) && "lg:col-span-2",
        "rounded-2xl",
        isDragging && "relative z-30",
        // Blueprint reveal: every resting cell shows its dashed slot; the
        // one under the pointer firms up to a full border-tier outline.
        dragActive &&
          !isDragging &&
          "outline outline-1 -outline-offset-1 outline-dashed outline-border/70",
        dragActive && !isDragging && over?.id === id && "outline-border",
      )}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  )
}
