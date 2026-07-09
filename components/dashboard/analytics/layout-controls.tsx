"use client"

import * as React from "react"
import type { DraggableAttributes } from "@dnd-kit/core"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import {
  Columns2,
  Ellipsis,
  EyeOff,
  GripVertical,
  LayoutGrid,
  RotateCcw,
  Square,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { BlockId, BlockSpan } from "@/lib/analytics-layout"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The three affordances of the hybrid layout editor: a hover-revealed grip
 * (organic discovery, drags only from here), a per-card menu for click-safe
 * structural ops, and the page-level menu that owns visibility + reset.
 */

/** Card icon at rest; grip on card hover. Absolute overlay = zero shift. */
export function CardGrip({
  icon: Icon,
  attributes,
  listeners,
}: {
  icon: React.ElementType
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}) {
  return (
    <span className="relative flex size-3.5 items-center justify-center">
      <Icon
        className="text-muted-foreground/70 size-3.5 transition-opacity duration-150 group-hover/dim:opacity-0"
        strokeWidth={1.75}
      />
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className={cn(
          "text-muted-foreground hover:text-foreground absolute inset-0 -m-1 flex touch-none items-center justify-center rounded",
          "cursor-grab opacity-0 transition-opacity duration-150 active:cursor-grabbing",
          "group-hover/dim:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
        )}
      >
        <GripVertical className="size-3.5" strokeWidth={1.75} />
      </button>
    </span>
  )
}

/** Per-card structural ops: size, hide, reset. Same trigger recipe as the
    expand button so the action cluster reads as one family. */
export function CardMenu({
  title,
  span,
  onSpanChange,
  onHide,
  onReset,
}: {
  title: string
  /** Omit both span props for blocks whose width is locked (KPIs, hero). */
  span?: BlockSpan
  onSpanChange?: (span: BlockSpan) => void
  onHide: () => void
  onReset: () => void
}) {
  const resizable = span !== undefined && onSpanChange !== undefined
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${title} card options`}
          className="text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground aria-expanded:bg-accent/60 aria-expanded:text-foreground flex size-6 items-center justify-center rounded-md transition-colors duration-150"
        >
          <Ellipsis className="size-3.5" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {resizable && (
          <>
            <DropdownMenuLabel className="label-mono text-muted-foreground/60 text-[10px]">
              Size
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(span)}
              onValueChange={(v) => onSpanChange(v === "2" ? 2 : 1)}
            >
              <DropdownMenuRadioItem value="1">
                <Square className="size-3.5" />
                1 column
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="2">
                <Columns2 className="size-3.5" />
                2 columns
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={onHide}>
          <EyeOff className="size-3.5" />
          Hide card
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReset}>
          <RotateCcw className="size-3.5" />
          Reset card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Page-level layout menu: card visibility checklist + reset to default. */
export function LayoutToolbarMenu({
  cards,
  onToggle,
  onResetAll,
}: {
  cards: Array<{ id: BlockId; title: string; hidden: boolean }>
  onToggle: (id: BlockId, visible: boolean) => void
  onResetAll: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8"
          aria-label="Edit dashboard layout"
        >
          <LayoutGrid className="size-4" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LayoutGrid className="size-3.5" />
            Cards
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              {cards.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={!c.hidden}
                  onCheckedChange={(v) => onToggle(c.id, v === true)}
                  // Keep the menu open: hiding several cards is one errand.
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onResetAll}>
          <RotateCcw className="size-3.5" />
          Reset to default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
