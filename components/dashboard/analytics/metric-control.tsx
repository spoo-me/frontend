"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import type { SeriesMetric } from "@/lib/analytics-layout"
import { Segmented } from "@/components/dashboard/segmented"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The metric switch, size-aware: wide widgets keep the three-way segmented
 * (one glance, one click), narrow ones fold it into a compact dropdown so
 * the title keeps its room. Same border/mono grammar either way.
 */

const METRICS: SeriesMetric[] = ["total", "unique", "both"]

export function MetricControl({
  value,
  onChange,
  compact,
}: {
  value: SeriesMetric
  onChange: (value: SeriesMetric) => void
  compact?: boolean
}) {
  if (!compact) {
    return (
      <Segmented
        value={value}
        onChange={onChange}
        options={METRICS.map((m) => ({ value: m, label: m }))}
      />
    )
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Metric"
          className="border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground aria-expanded:text-foreground flex h-7 items-center gap-1 rounded-lg border px-2 font-mono text-[11px] transition-colors duration-150"
        >
          {value}
          <ChevronDown className="size-3 opacity-60" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-28">
        {METRICS.map((m) => (
          <DropdownMenuCheckboxItem
            key={m}
            checked={value === m}
            onCheckedChange={() => onChange(m)}
            className="font-mono text-xs"
          >
            {m}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
