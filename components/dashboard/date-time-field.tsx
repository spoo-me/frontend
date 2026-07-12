"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Modern replacement for `<input type="datetime-local">`: a mono trigger
 * opening a calendar + time popover. Value stays in the datetime-local
 * string format ("YYYY-MM-DDTHH:mm", or "") so call sites don't change.
 */

const pad = (n: number) => String(n).padStart(2, "0")

function parseLocal(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function toLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDisplay(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function DateTimeField({
  value,
  onChange,
  placeholder = "Pick date and time",
  defaultTime = "23:59",
  defaultOpen = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Time applied when a day is picked with no time set yet. */
  defaultTime?: string
  /** Open the picker as soon as the field mounts (e.g. after "Custom"). */
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const date = parseLocal(value)

  // Time is edited as raw text so partial input isn't fought mid-keystroke.
  const timeOf = (d: Date | null) =>
    d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : defaultTime
  const [rawTime, setRawTime] = React.useState(timeOf(date))
  React.useEffect(() => {
    if (open) setRawTime(timeOf(parseLocal(value)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value])

  const commitTime = (raw: string) => {
    const m = raw.trim().match(TIME_RE)
    if (!m || !date) {
      setRawTime(timeOf(date))
      return
    }
    const next = new Date(date)
    next.setHours(Number(m[1]), Number(m[2]))
    onChange(toLocal(next))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            // Mirrors the Input recipe so "Never" reads as an editable field,
            // not a disabled button.
            "flex h-9 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 font-mono text-xs shadow-soft outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
            date ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          <CalendarDays
            className="size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          {date ? formatDisplay(date) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          defaultMonth={date ?? undefined}
          disabled={{ before: new Date() }}
          onSelect={(day) => {
            if (!day) return
            const m = rawTime.match(TIME_RE) ?? defaultTime.match(TIME_RE)!
            const next = new Date(day)
            next.setHours(Number(m[1]), Number(m[2]))
            onChange(toLocal(next))
          }}
        />
        <div className="flex items-center justify-between gap-3 border-border/60 border-t px-3 py-2.5">
          <span className="text-muted-foreground text-xs">Time</span>
          <span className="flex items-center gap-1.5">
            <Input
              value={rawTime}
              onChange={(e) => setRawTime(e.target.value)}
              onBlur={(e) => commitTime(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTime(e.currentTarget.value)
              }}
              placeholder="23:59"
              spellCheck={false}
              disabled={!date}
              className="h-7 w-16 text-center font-mono text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => {
                commitTime(rawTime)
                setOpen(false)
              }}
            >
              Done
            </Button>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
