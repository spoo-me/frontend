"use client"

import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Command as CommandPrimitive } from "cmdk"
import { Check, ChevronDown, Minus, Plus, Tag } from "lucide-react"

import { listTags, TAGS_MAX_PER_LINK, type Tag as TagRecord } from "@/lib/api"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  suggestTagColor,
  TagDialog,
  TAGS_QUERY_KEY,
} from "@/components/dashboard/tags/tag-dialog"
import { TagChip, TagLabel } from "@/components/dashboard/tags/tag-glyph"

export { TAGS_QUERY_KEY }

export function useTags(enabled = true) {
  return useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: listTags,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}

export type TagMatch = "any" | "all"

/**
 * The one tag chooser. A checklist of the account's tags (glyph, name,
 * link count) with search on top and `New tag` at the bottom, which opens
 * name, colour and icon inline and attaches the new tag on create.
 *
 * `variant`: `field` is a full-width form control showing the picked tags
 * inside it; `button` is a toolbar filter with a count; `compact` is the
 * icon-only edit-bar version. `mixed` marks ids that are on some but not
 * all of a selection (bulk); ticking one applies it to all, unticking
 * removes it from all.
 */
export function TagPicker({
  selected,
  onChange,
  variant = "field",
  label = "Tags",
  mixed,
  match,
  onMatchChange,
  max = TAGS_MAX_PER_LINK,
  className,
  placeholder = "Add tags",
  modal,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
  variant?: "field" | "button" | "compact"
  label?: string
  mixed?: ReadonlySet<string>
  match?: TagMatch
  onMatchChange?: (match: TagMatch) => void
  /** Selection cap; the field refuses more and says so. */
  max?: number
  className?: string
  placeholder?: string
  /** Set when hosted inside a modal dialog (see DimensionFilter). */
  modal?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [search, setSearch] = React.useState("")
  const tags = useTags(open || variant === "field")
  const rows = tags.data?.items ?? []
  const byId = new Map(rows.map((t) => [t.id, t]))
  const full = selected.length >= max
  const sorted = [
    ...rows.filter((t) => selected.includes(t.id) || mixed?.has(t.id)),
    ...rows.filter((t) => !selected.includes(t.id) && !mixed?.has(t.id)),
  ]
  const q = search.trim().toLowerCase()
  const exactExists = q ? rows.some((t) => t.name === q) : true

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((v) => v !== id))
    else if (!full) onChange([...selected, id])
  }

  // New tag closes the popover and opens the shared dialog, seeded with
  // whatever was typed in the search; the created tag is attached on save.
  const startCreate = () => {
    setCreateName(q)
    setOpen(false)
    setCreating(true)
  }

  const trigger =
    variant === "field" ? (
      <button
        type="button"
        aria-label={label}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-left outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          className
        )}
      >
        {selected.length ? (
          selected.map((id) => {
            const tag = byId.get(id)
            return tag ? <TagChip key={id} tag={tag} /> : null
          })
        ) : (
          <span className="font-mono text-muted-foreground/60 text-xs">
            {placeholder}
          </span>
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </button>
    ) : (
      <Button
        variant="outline"
        size="sm"
        aria-label={label}
        title={variant === "compact" ? label : undefined}
        className={cn(
          variant === "compact" ? "relative size-7 p-0" : "h-8",
          selected.length > 0 && "border-brand/40",
          className
        )}
      >
        <Tag data-icon={variant === "compact" ? undefined : "inline-start"} />
        {variant !== "compact" && label}
        {selected.length > 0 &&
          (variant === "compact" ? (
            <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-brand/15 font-mono text-[9px] text-brand tabular-nums">
              {selected.length}
            </span>
          ) : (
            <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 font-mono text-[10px] text-brand tabular-nums">
              {selected.length}
            </span>
          ))}
      </Button>
    )

  return (
    <>
      <Popover
        open={open}
        modal={modal}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setSearch("")
        }}
      >
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "p-0",
            variant === "field"
              ? "w-[var(--radix-popover-trigger-width)]"
              : "w-72"
          )}
        >
          <CommandPrimitive shouldFilter={false}>
            <div className="border-border/60 border-b px-3">
              <CommandPrimitive.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search tags…"
                className="h-9 w-full bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1.5">
              {tags.isPending ? (
                <div className="px-2.5 py-6 text-center text-muted-foreground text-xs">
                  loading…
                </div>
              ) : !rows.length ? (
                <div className="px-2.5 py-6 text-center text-muted-foreground text-xs">
                  No tags yet. Make the first one below.
                </div>
              ) : null}
              {sorted
                .filter((t) => !q || t.name.includes(q))
                .map((tag) => {
                  const active = selected.includes(tag.id)
                  const partial = !active && !!mixed?.has(tag.id)
                  const blocked = !active && !partial && full
                  return (
                    <CommandPrimitive.Item
                      key={tag.id}
                      value={tag.id}
                      disabled={blocked}
                      onSelect={() => toggle(tag.id)}
                      className={cn(
                        "flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-xs data-[selected=true]:bg-accent/70",
                        blocked && "opacity-40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-3.5 items-center justify-center rounded-[4px] border border-border",
                          (active || partial) && "border-primary bg-primary"
                        )}
                      >
                        {active && (
                          <Check className="size-2.5 text-primary-foreground" />
                        )}
                        {partial && (
                          <Minus className="size-2.5 text-primary-foreground" />
                        )}
                      </span>
                      <TagLabel
                        tag={tag}
                        className="min-w-0 flex-1"
                        nameClassName="text-foreground"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
                        {formatCount(tag.link_count)}
                      </span>
                    </CommandPrimitive.Item>
                  )
                })}
              {q && !rows.some((t) => t.name.includes(q)) && (
                <div className="px-2.5 py-3 text-center text-muted-foreground text-xs">
                  no matches
                </div>
              )}
            </CommandPrimitive.List>
            <div className="flex items-center justify-between border-border/60 border-t px-1.5 py-1.5">
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
              >
                <Plus className="size-3" />
                {q && !exactExists ? `New tag "${q}"` : "New tag"}
              </button>
              {onMatchChange && selected.length > 1 && (
                <span className="flex overflow-hidden rounded-md border border-border/60 font-mono text-[11px]">
                  {(["any", "all"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onMatchChange(m)}
                      aria-pressed={(match ?? "any") === m}
                      className={cn(
                        "px-2 py-0.5 transition-colors duration-150",
                        (match ?? "any") === m
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </span>
              )}
              {full && variant === "field" && (
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {max} tags max
                </span>
              )}
            </div>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
      <TagDialog
        open={creating}
        onOpenChange={setCreating}
        initialName={createName}
        initialColor={suggestTagColor(rows)}
        onSaved={(tag) => {
          if (!full && !selected.includes(tag.id))
            onChange([...selected, tag.id])
        }}
      />
    </>
  )
}

/** A link's tags as tinted chips, at most `limit` with a +n overflow. */
export function TagList({
  tags,
  limit = 3,
  onTagClick,
  className,
}: {
  tags: ReadonlyArray<Pick<TagRecord, "id" | "name" | "color" | "icon">>
  limit?: number
  onTagClick?: (id: string) => void
  className?: string
}) {
  if (!tags.length) return null
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {tags.slice(0, limit).map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          title={onTagClick ? `Filter by ${tag.name}` : undefined}
          onClick={
            onTagClick
              ? (e) => {
                  e.stopPropagation()
                  onTagClick(tag.id)
                }
              : undefined
          }
        />
      ))}
      {tags.length > limit && (
        <span className="font-mono text-[11px] text-muted-foreground/60">
          +{tags.length - limit}
        </span>
      )}
    </span>
  )
}
