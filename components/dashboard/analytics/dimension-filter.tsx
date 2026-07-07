"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Command as CommandPrimitive } from "cmdk"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { getStats, type StatsDimension } from "@/lib/api"
import { formatCount } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DimensionIcon,
  dimensionLabel,
} from "@/components/dashboard/dim-icon"
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
}: {
  dimension: Exclude<StatsDimension, "time">
  label: string
  icon: React.ElementType
  range: TimeRange
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)

  const options = useQuery({
    queryKey: ["stats", "dim-options", dimension, range.from, range.to],
    queryFn: () =>
      getStats({
        startDate: range.from,
        endDate: range.to,
        groupBy: [dimension],
      }),
    enabled: open,
    staleTime: 60_000,
  })

  const rows = (options.data?.metrics?.[`clicks_by_${dimension}`] ?? []) as Array<{
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
        : [...selected, value],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8", selected.length > 0 && "border-brand/40")}
        >
          <Icon data-icon="inline-start" />
          {label}
          {selected.length > 0 && (
            <span className="bg-brand/10 text-brand ml-0.5 rounded-full px-1.5 font-mono text-[10px] tabular-nums">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <CommandPrimitive>
          <div className="border-border/60 border-b px-3">
            <CommandPrimitive.Input
              placeholder={`Search ${label.toLowerCase()}…`}
              className="placeholder:text-muted-foreground/60 h-9 w-full bg-transparent text-xs outline-none"
            />
          </div>
          <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1.5 [mask-image:linear-gradient(to_bottom,black,black_calc(100%-20px),transparent)]">
            <CommandPrimitive.Empty className="text-muted-foreground px-2.5 py-6 text-center text-xs">
              {options.isPending ? "loading…" : "no matches"}
            </CommandPrimitive.Empty>
            {sorted.map((row) => {
              const active = selected.includes(row.value)
              return (
                <CommandPrimitive.Item
                  key={row.value}
                  value={`${row.value} ${dimensionLabel(dimension, row.value)}`}
                  onSelect={() => toggle(row.value)}
                  className="data-[selected=true]:bg-accent/70 flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-xs select-none"
                >
                  <span
                    className={cn(
                      "border-border flex size-3.5 items-center justify-center rounded-[4px] border",
                      active && "bg-primary border-primary",
                    )}
                  >
                    {active && <Check className="text-primary-foreground size-2.5" />}
                  </span>
                  <DimensionIcon
                    dimension={dimension}
                    value={row.value}
                    className="size-3.5"
                  />
                  <span className="text-foreground min-w-0 flex-1 truncate">
                    {dimensionLabel(dimension, row.value)}
                  </span>
                  <span className="text-muted-foreground/70 font-mono text-[10px] tabular-nums">
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
