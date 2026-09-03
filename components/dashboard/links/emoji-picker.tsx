"use client"

import * as React from "react"
import { Search, Smile } from "lucide-react"

import { cn } from "@/lib/utils"
import { type EmojiItem } from "@/lib/api"
import {
  loadRecents,
  mergeRecent,
  saveRecents,
  validRecents,
} from "@/lib/emoji-recents"
import { useEmojiSet } from "@/hooks/use-emoji-set"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const COLS = 9
const CELL = 34 // px, square
const VIEWPORT_ROWS = 6
const OVERSCAN = 2

type Cell = { c: string; label: string; hay: string; g?: string }

/** codepoint hex of a grapheme (fallback filter, so pasting or typing a hex
    codepoint also narrows without leaning on a name dataset). */
function hexOf(grapheme: string): string {
  return Array.from(grapheme)
    .map((c) => c.codePointAt(0)?.toString(16) ?? "")
    .join(" ")
}

/**
 * Browse picker for emoji aliases, fed ONLY by GET /api/v1/emoji-set. The
 * emoji ARE the alias, so a grid of emoji is product content; the chrome
 * around it (search, recents, count) stays in the muted-mono house style.
 * Search by name is the primary path (1000+ glyphs do not browse well); the
 * grid is windowed so only visible rows mount. Renders nothing until the set
 * loads and stays absent if the endpoint has not deployed, so the field
 * degrades to type-and-validate without erroring.
 */
export function EmojiPicker({
  onPick,
  remaining,
}: {
  onPick: (emoji: string) => void
  remaining: number
}) {
  const { data } = useEmojiSet()

  const emoji = data?.emoji
  if (!emoji || emoji.length === 0) return null

  return <EmojiPickerBody emoji={emoji} onPick={onPick} remaining={remaining} />
}

function EmojiPickerBody({
  emoji,
  onPick,
  remaining,
}: {
  emoji: EmojiItem[]
  onPick: (emoji: string) => void
  remaining: number
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [group, setGroup] = React.useState<string | null>(null)
  const [active, setActive] = React.useState(0)
  const [recents, setRecents] = React.useState<string[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const capped = remaining <= 0

  const cells = React.useMemo<Cell[]>(
    () =>
      emoji.map((e) => ({
        c: e.c,
        label: e.n,
        hay: `${e.n} ${(e.k ?? []).join(" ")}`.toLowerCase(),
        g: e.g,
      })),
    [emoji]
  )
  const byChar = React.useMemo(() => {
    const m = new Map<string, Cell>()
    for (const c of cells) m.set(c.c, c)
    return m
  }, [cells])

  // Category tabs are a bonus: only when the endpoint tags items with `g`.
  const groups = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of cells) if (c.g) set.add(c.g)
    return [...set]
  }, [cells])

  // Re-validate stored recents against the live accepted set (policy shrinks).
  React.useEffect(() => {
    setRecents(validRecents(loadRecents(), byChar.keys()))
  }, [byChar])

  const q = query.trim().toLowerCase()
  const rawQ = query.trim()
  const filtered = React.useMemo(() => {
    const base = group ? cells.filter((c) => c.g === group) : cells
    if (!q) return base
    return cells.filter(
      (c) =>
        c.hay.includes(q) ||
        (rawQ !== "" && c.c.includes(rawQ)) ||
        hexOf(c.c).includes(q)
    )
  }, [cells, group, q, rawQ])

  const showRecents = q === "" && !group && recents.length > 0

  React.useEffect(() => {
    setActive(0)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setScrollTop(0)
  }, [q, group])

  const rows = Math.ceil(filtered.length / COLS)
  const viewportH = VIEWPORT_ROWS * CELL
  const startRow = Math.max(0, Math.floor(scrollTop / CELL) - OVERSCAN)
  const endRow = Math.min(
    rows,
    Math.ceil((scrollTop + viewportH) / CELL) + OVERSCAN
  )

  const scrollActiveIntoView = React.useCallback((index: number) => {
    const el = scrollRef.current
    if (!el) return
    const row = Math.floor(index / COLS)
    const top = row * CELL
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + CELL > el.scrollTop + el.clientHeight)
      el.scrollTop = top + CELL - el.clientHeight
  }, [])

  // The picker is portaled to the body, outside the composer Dialog, whose
  // react-remove-scroll lock cancels native wheel/trackpad scrolling for
  // anything not inside the dialog subtree. So drive the windowed grid's
  // scroll manually with a non-passive wheel listener (React's onWheel is
  // passive and cannot preventDefault). A callback ref (re)attaches it every
  // time the grid mounts, including when the popover reopens.
  const wheelCleanup = React.useRef<(() => void) | null>(null)
  const setScrollNode = React.useCallback((node: HTMLDivElement | null) => {
    wheelCleanup.current?.()
    wheelCleanup.current = null
    scrollRef.current = node
    if (!node) return
    const onWheel = (e: WheelEvent) => {
      const step =
        e.deltaMode === 1
          ? e.deltaY * CELL // lines
          : e.deltaMode === 2
            ? e.deltaY * node.clientHeight // pages
            : e.deltaY // pixels (trackpad + most mice)
      const max = node.scrollHeight - node.clientHeight
      const next = Math.min(max, Math.max(0, node.scrollTop + step))
      if (next !== node.scrollTop) {
        node.scrollTop = next
        setScrollTop(next)
      }
      e.preventDefault()
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    wheelCleanup.current = () => node.removeEventListener("wheel", onWheel)
  }, [])

  const pick = (c: string) => {
    if (capped) return
    onPick(c)
    const next = mergeRecent(recents, c)
    setRecents(next)
    saveRecents(next)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return
    let next = active
    if (e.key === "ArrowRight") next = Math.min(filtered.length - 1, active + 1)
    else if (e.key === "ArrowLeft") next = Math.max(0, active - 1)
    else if (e.key === "ArrowDown")
      next = Math.min(filtered.length - 1, active + COLS)
    else if (e.key === "ArrowUp") next = Math.max(0, active - COLS)
    else if (e.key === "Enter") {
      e.preventDefault()
      pick(filtered[active].c)
      return
    } else return
    e.preventDefault()
    setActive(next)
    scrollActiveIntoView(next)
  }

  const cell = (c: Cell, index: number, activeMatch: boolean) => (
    <button
      key={`${c.c}-${index}`}
      type="button"
      disabled={capped}
      onClick={() => pick(c.c)}
      onMouseEnter={() => setActive(index)}
      title={c.label}
      aria-label={`Add ${c.label}`}
      className={cn(
        "flex items-center justify-center rounded-md text-lg leading-none transition-colors duration-100 disabled:opacity-40",
        activeMatch ? "bg-accent" : "hover:bg-accent/60"
      )}
      style={{ width: CELL, height: CELL }}
    >
      {c.c}
    </button>
  )

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) {
          setQuery("")
          setGroup(null)
          setActive(0)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Browse emoji"
        >
          <Smile />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[19rem] gap-2 p-2"
        onKeyDown={onKeyDown}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const el = e.currentTarget as HTMLElement | null
          el?.querySelector("input")?.focus()
        }}
      >
        <div className="flex items-center gap-1.5 rounded-md border border-input px-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji"
            spellCheck={false}
            autoComplete="off"
            className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {groups.length > 1 && q === "" && (
          // One tidy horizontal row: scroll, never wrap, hidden scrollbar.
          <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto whitespace-nowrap px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryChip
              active={group === null}
              title="All emoji"
              onClick={() => setGroup(null)}
            >
              All
            </CategoryChip>
            {groups.map((g) => (
              <CategoryChip
                key={g}
                active={group === g}
                title={g}
                onClick={() => setGroup(g)}
              >
                {shortGroupLabel(g)}
              </CategoryChip>
            ))}
          </div>
        )}

        {showRecents && (
          <div className="space-y-1">
            <p className="label-mono px-1 text-[10px] text-muted-foreground/50">
              Recent
            </p>
            <div className="flex flex-wrap">
              {recents.map((c, i) =>
                cell(byChar.get(c) ?? { c, label: c, hay: "" }, -1 - i, false)
              )}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="px-1 py-6 text-center text-muted-foreground/60 text-xs">
            No matches.
          </p>
        ) : (
          <div
            ref={setScrollNode}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            className="relative overflow-y-auto overscroll-contain"
            style={{ height: viewportH }}
            role="grid"
          >
            <div style={{ height: rows * CELL }} className="relative">
              {Array.from(
                { length: Math.max(0, endRow - startRow) },
                (_, r) => {
                  const row = startRow + r
                  return (
                    <div
                      key={row}
                      className="absolute flex w-full"
                      style={{ top: row * CELL, height: CELL }}
                    >
                      {filtered
                        .slice(row * COLS, row * COLS + COLS)
                        .map((c, ci) => {
                          const index = row * COLS + ci
                          return cell(c, index, index === active)
                        })}
                    </div>
                  )
                }
              )}
            </div>
          </div>
        )}

        {/* No resting-state total (that reads as helper-chrome). The cap note
            is actionable (it explains the disabled cells); a result count
            appears only while a search is active. */}
        {capped ? (
          <p className="label-mono px-1 text-[10px] text-muted-foreground/50">
            15 emoji max
          </p>
        ) : q !== "" && filtered.length > 0 ? (
          <p className="label-mono px-1 text-[10px] text-muted-foreground/50">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Short display labels for the canonical CLDR group names, so the tab row
 * stays a single tidy line. The backend group VALUES are unchanged; this only
 * affects the rendered label. Unknown values (e.g. the mock's already-short
 * names) fall through as-is.
 */
const GROUP_LABELS: Record<string, string> = {
  "Smileys & Emotion": "Smileys",
  "People & Body": "People",
  "Animals & Nature": "Animals",
  "Food & Drink": "Food",
  "Travel & Places": "Travel",
  Activities: "Activities",
  Objects: "Objects",
  Symbols: "Symbols",
  Flags: "Flags",
}
function shortGroupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group
}

function CategoryChip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  /** Full canonical group name, kept for a11y while the label is shortened. */
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "label-mono shrink-0 rounded-md px-1.5 py-0.5 text-[10px] capitalize transition-colors duration-100",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
