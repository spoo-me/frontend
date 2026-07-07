"use client"

import * as React from "react"
import { CalendarDays, Check } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const fallback = React.useMemo(() => presetRange("30d")!, [])
  const [draft, setDraft] = React.useState<TimeRange>(value ?? fallback)
  const [expr, setExpr] = React.useState("")
  const parsed = expr ? parseExpression(expr) : null

  React.useEffect(() => {
    if (open) {
      setDraft(value ?? fallback)
      setExpr("")
    }
  }, [open, value, fallback])

  const effective = parsed ?? draft

  const apply = () => {
    onApply(effective)
    setOpen(false)
  }

  const calendarRange: DateRange = { from: effective.from, to: effective.to }
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
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        {/* Parse box — borderless, directly on the surface (ref 27); the
            resolved-range hint rides inline so the row never changes height */}
        <div className="border-border/60 flex items-center gap-3 border-b px-4">
          <input
            autoFocus
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && parsed) apply()
            }}
            placeholder="Custom range: 3h, last 7 days, now-3d to now-1d…"
            spellCheck={false}
            autoComplete="off"
            className="placeholder:text-muted-foreground/60 h-11 min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
          />
          {expr && (
            <span
              className={cn(
                "shrink-0 font-mono text-[11px]",
                parsed ? "text-muted-foreground/70" : "text-destructive",
              )}
            >
              {parsed ? `→ ${humanize(parsed)}` : "can't parse that yet"}
            </span>
          )}
        </div>

        {/* Calendar sized to content; preset rail takes the remainder */}
        <div className="flex">
          <div className="border-border/60 flex-1 border-r px-3 py-2">
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
              defaultMonth={effective.from}
              onSelect={(r) => {
                if (!r?.from) return
                const to = r.to ?? r.from
                setExpr("")
                setDraft({
                  from: new Date(new Date(r.from).setHours(0, 0, 0, 0)),
                  to: new Date(
                    Math.min(
                      new Date(to).setHours(23, 59, 59, 999),
                      Date.now(),
                    ),
                  ),
                })
              }}
            />
            </div>
          </div>
          <div className="w-40 shrink-0 p-1.5">
            {PRESETS.map((p) => {
              const active = effective.preset === p.token
              return (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => {
                    setExpr("")
                    setDraft(presetRange(p.token)!)
                  }}
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-[13px] transition-colors duration-150",
                    active
                      ? "bg-accent/70 text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
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
        <div className="border-border/60 grid grid-cols-2 gap-3 border-t px-3 py-3">
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">Start</span>
            <Input
              type="datetime-local"
              value={toLocalInput(effective.from)}
              onChange={(e) => {
                const d = new Date(e.target.value)
                if (!isNaN(d.getTime())) {
                  setExpr("")
                  setDraft({ from: d, to: effective.to })
                }
              }}
              className="h-8 font-mono text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">End</span>
            <Input
              type="datetime-local"
              value={toLocalInput(effective.to)}
              onChange={(e) => {
                const d = new Date(e.target.value)
                if (!isNaN(d.getTime())) {
                  setExpr("")
                  setDraft({ from: effective.from, to: d })
                }
              }}
              className="h-8 font-mono text-xs"
            />
          </label>
        </div>
        <div className="border-border/60 flex h-12 items-center justify-between border-t px-3">
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
            <Button size="sm" onClick={apply} disabled={effective.from >= effective.to}>
              Apply
            </Button>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
