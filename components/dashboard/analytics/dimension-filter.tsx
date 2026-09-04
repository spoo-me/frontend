"use client"

import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Command as CommandPrimitive } from "cmdk"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { getStats, type StatsGroupBy } from "@/lib/api"
import { formatCount } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"

/**
 * Searchable multi-select for one stats dimension (SPEC §7): options are the
 * user's OWN data in the active time range, with counts; selected pin to top.
 */
export function DimensionFilter({
  dimension,
  label,
  icon: Icon,
  range,
  selected,
  onChange,
  compact,
  className,
  modal,
}: {
  dimension: Exclude<StatsGroupBy, "time">
  label: string
  icon: React.ElementType
  range: TimeRange
  selected: string[]
  onChange: (values: string[]) => void
  /** Icon-only trigger with a corner count — for tight hosts (edit bar). */
  compact?: boolean
  /** Extra classes for the trigger button (e.g. w-full in form grids). */
  className?: string
  /** Set when hosted inside a modal dialog: the dialog's scroll lock
      otherwise swallows wheel events in the portaled list. */
  modal?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  // Options load eagerly in the background (not on open) so the popover is
  // instant, and a range change keeps the old list visible while refetching.
  const options = useQuery({
    queryKey: ["stats", "dim-options", dimension, range.from, range.to],
    queryFn: () =>
      getStats({
        startDate: range.from,
        endDate: range.to,
        groupBy: [dimension],
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const rows = (options.data?.metrics?.[`clicks_by_${dimension}`] ??
    []) as Array<{
    value: string
    clicks: number
  }>
  const sorted = [
    ...rows.filter((r) => selected.includes(r.value)),
    ...rows.filter((r) => !selected.includes(r.value)),
  ]

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "default"}
          aria-label={label}
          title={compact ? label : undefined}
          className={cn(
            compact && "relative",
            selected.length > 0 && "border-brand/40",
            className
          )}
        >
          <Icon data-icon={compact ? undefined : "inline-start"} />
          {!compact && label}
          {selected.length > 0 &&
            (compact ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-brand/15 font-mono text-[9px] text-brand tabular-nums">
                {selected.length}
              </span>
            ) : (
              <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 font-mono text-[10px] text-brand tabular-nums">
                {selected.length}
              </span>
            ))}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <CommandPrimitive>
          <div className="border-border/60 border-b px-3">
            <CommandPrimitive.Input
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-10 w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1.5 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-20px),transparent)]">
            <CommandPrimitive.Empty className="px-2.5 py-6 text-center text-muted-foreground text-xs">
              {options.isPending ? "loading…" : "no matches"}
            </CommandPrimitive.Empty>
            {sorted.map((row) => {
              const active = selected.includes(row.value)
              return (
                <CommandPrimitive.Item
                  key={row.value}
                  value={`${row.value} ${dimensionLabel(dimension, row.value)}`}
                  onSelect={() => toggle(row.value)}
                  className="flex h-9 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-[13px] data-[selected=true]:bg-accent/70"
                >
                  <span
                    className={cn(
                      "flex size-[18px] items-center justify-center rounded-[5px] border border-border",
                      active && "border-primary bg-primary"
                    )}
                  >
                    {active && (
                      <Check className="size-3.5 text-primary-foreground" />
                    )}
                  </span>
                  <DimensionIcon
                    dimension={dimension}
                    value={row.value}
                    className="size-4"
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {dimensionLabel(dimension, row.value)}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                    {formatCount(row.clicks)}
                  </span>
                </CommandPrimitive.Item>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}
