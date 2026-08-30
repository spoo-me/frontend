"use client"

import * as React from "react"
import { CalendarDays, Check } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  humanize,
  parseExpression,
  presetRange,
  PRESETS,
  toLocalInput,
  type TimeRange,
} from "@/components/dashboard/analytics/time-range"

/**
 * The ref-27 (Cloudflare) time-range control: three modalities editing one
 * draft — parse box / calendar + presets / start-end inputs — committed by
 * Apply. Trigger shows the humanized applied value.
 */

/**
 * Editable "YYYY-MM-DD HH:mm" text field. The calendar above owns date
 * picking; this is for precise text entry, so it never opens the native
 * datetime popup. Commits on blur or Enter, reverts on invalid input.
 */
function DateTimeText({
  label,
  value,
  onCommit,
}: {
  label: string
  value: Date | null
  onCommit: (d: Date) => void
}) {
  const fmt = (d: Date | null) => (d ? toLocalInput(d).replace("T", " ") : "")
  const [raw, setRaw] = React.useState(fmt(value))
  const time = value?.getTime() ?? null
  React.useEffect(() => {
    setRaw(time === null ? "" : fmt(new Date(time)))
  }, [time])

  const commit = (next: string) => {
    const t = next.trim()
    if (!t) return setRaw(fmt(value))
    const d = new Date(t.replace(" ", "T"))
    if (!isNaN(d.getTime())) onCommit(d)
    else setRaw(fmt(value))
  }

  return (
    <label className="space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value)
        }}
        placeholder="2026-01-01 00:00"
        spellCheck={false}
        className="h-8 font-mono text-xs"
      />
    </label>
  )
}
export function TimeRangePicker({
  value,
  onApply,
  onClear,
  placeholder,
}: {
  /** Null = unset (only when clearable via onClear + placeholder). */
  value: TimeRange | null
  onApply: (range: TimeRange) => void
  onClear?: () => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Null draft = nothing selected yet; the popover must not pretend a range
  // is active when the applied value is "all time".
  const [draft, setDraft] = React.useState<TimeRange | null>(value)
  const [expr, setExpr] = React.useState("")
  const parsed = expr ? parseExpression(expr) : null

  React.useEffect(() => {
    if (open) {
      setDraft(value)
      setExpr("")
    }
  }, [open, value])

  const effective = parsed ?? draft

  const apply = () => {
    if (!effective) return
    onApply(effective)
    setOpen(false)
  }

  const calendarRange: DateRange | undefined = effective
    ? { from: effective.from, to: effective.to }
    : undefined
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", !value && "text-muted-foreground")}
        >
          <CalendarDays data-icon="inline-start" />
          {value ? humanize(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
      >
        {/* Parse box — borderless, directly on the surface; the
            resolved-range hint rides inline so the row never changes height */}
        <div className="flex items-center gap-3 border-border/60 border-b px-4">
          <input
            autoFocus
            aria-label="Custom time range"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && parsed) apply()
            }}
            placeholder="Custom range: 3h, last 7 days, now-3d to now-1d…"
            spellCheck={false}
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/60"
          />
          {expr && (
            <span
              className={cn(
                "shrink-0 font-mono text-[11px]",
                parsed ? "text-muted-foreground/70" : "text-destructive"
              )}
            >
              {parsed ? `→ ${humanize(parsed)}` : "can't parse that yet"}
            </span>
          )}
        </div>

        {/* Calendar sized to content; preset rail takes the remainder.
            Below sm the pair can't share a row (calendar + 10rem rail beats
            the viewport), so the rail becomes a wrapping chip row under the
            calendar instead of clipping off-screen. */}
        <div className="flex max-sm:flex-col">
          <div className="flex-1 border-border/60 px-3 py-2 max-sm:border-b sm:border-r">
            <div className="relative w-full">
              <Calendar
                mode="range"
                numberOfMonths={1}
                className="w-full p-2"
                classNames={{
                  month: "flex w-full flex-col gap-3",
                  month_caption: "flex h-7 items-center pl-1",
                  nav: "absolute top-2 right-2 flex items-center gap-1",
                  weekdays: "flex justify-between",
                  week: "mt-1.5 flex w-full justify-between",
                  range_middle:
                    "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
                }}
                selected={calendarRange}
                defaultMonth={effective?.from}
                onSelect={(r) => {
                  if (!r?.from) return
                  const to = r.to ?? r.from
                  setExpr("")
                  setDraft({
                    from: new Date(new Date(r.from).setHours(0, 0, 0, 0)),
                    to: new Date(
                      Math.min(
                        new Date(to).setHours(23, 59, 59, 999),
                        Date.now()
                      )
                    ),
                  })
                }}
              />
            </div>
          </div>
          <div className="shrink-0 p-1.5 max-sm:flex max-sm:flex-wrap max-sm:gap-1 max-sm:p-2 sm:w-40">
            {PRESETS.map((p) => {
              const active = effective?.preset === p.token
              return (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => {
                    setExpr("")
                    setDraft(presetRange(p.token)!)
                  }}
                  className={cn(
                    "flex h-8 items-center justify-between rounded-lg px-2.5 text-left text-[13px] transition-colors duration-150 max-sm:gap-1.5 max-sm:border sm:w-full",
                    active
                      ? "bg-accent/70 text-foreground max-sm:border-border"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground max-sm:border-border/60"
                  )}
                >
                  {p.label}
                  {active && <Check className="size-3.5" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Start / End + footer */}
        <div className="grid grid-cols-2 gap-3 border-border/60 border-t px-3 py-3">
          <DateTimeText
            label="Start"
            value={effective?.from ?? null}
            onCommit={(d) => {
              setExpr("")
              setDraft({ from: d, to: effective?.to ?? new Date() })
            }}
          />
          <DateTimeText
            label="End"
            value={effective?.to ?? null}
            onCommit={(d) => {
              setExpr("")
              setDraft({
                from:
                  effective?.from ?? new Date(new Date(d).setHours(0, 0, 0, 0)),
                to: d,
              })
            }}
          />
        </div>
        <div className="flex h-12 items-center justify-between border-border/60 border-t px-3">
          <span className="text-muted-foreground text-xs">{tz}</span>
          <span className="flex items-center gap-1.5">
            {onClear && value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={apply}
              disabled={!effective || effective.from >= effective.to}
            >
              Apply
            </Button>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
