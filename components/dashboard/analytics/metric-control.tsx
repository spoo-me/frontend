"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SeriesMetric } from "@/lib/analytics-layout"
import { Segmented } from "@/components/dashboard/segmented"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Header controls that fold when the header genuinely runs out of pixels.
 *
 * The old mechanic keyed off grid units (w < 6), which lied in both
 * directions: a 4-unit widget on a wide monitor has plenty of room yet got
 * the dropdown, and a full-width widget on a phone got the segmented and
 * pushed the title out. HeaderControls measures the real header instead:
 * an invisible probe renders the cluster with every adaptive control in its
 * full segmented form, and the controls collapse only when
 * (untruncated title + gutter + probe) exceeds the header's content width.
 * One decision per header, so multiple adaptive controls swap together and
 * can never oscillate. Both forms are h-7, so swapping shifts no rows.
 */

const METRICS: SeriesMetric[] = ["total", "unique", "both"]

const FitContext = React.createContext(true)

export function HeaderControls({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const probeRef = React.useRef<HTMLSpanElement>(null)
  const [fits, setFits] = React.useState(true)

  React.useLayoutEffect(() => {
    const el = ref.current
    const probe = probeRef.current
    const header = el?.closest<HTMLElement>("[data-section-header]")
    if (!el || !probe || !header) return
    const measure = () => {
      const title = header.querySelector<HTMLElement>("[data-section-title]")
      const lead = title?.parentElement
      if (!title || !lead) return
      const style = getComputedStyle(header)
      const available =
        header.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      // The title is the header's only shrinkable piece; its scrollWidth is
      // the untruncated need. 12px keeps a visible gutter between sides.
      const leadNeeded =
        lead.offsetWidth - title.clientWidth + title.scrollWidth
      setFits(available >= leadNeeded + 12 + probe.offsetWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    ro.observe(probe)
    return () => ro.disconnect()
  }, [])

  return (
    <FitContext.Provider value={fits}>
      <span
        ref={ref}
        className={cn("relative flex items-center gap-1.5", className)}
      >
        {children}
        {/* The probe: same cluster, adaptive controls forced to segmented
            (FitContext true). Its width feeds the fit test, so the decision
            never depends on which form is currently visible. */}
        <span
          ref={probeRef}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 right-0 flex items-center gap-1.5"
        >
          <FitContext.Provider value={true}>{children}</FitContext.Provider>
        </span>
      </span>
    </FitContext.Provider>
  )
}

/** A segmented control that folds into a compact mono dropdown when its
    HeaderControls cluster doesn't fit. Same 28px height either way. */
export function AdaptiveSegmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  ariaLabel: string
}) {
  const fits = React.useContext(FitContext)
  if (fits) {
    return <Segmented value={value} onChange={onChange} options={options} />
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-7 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-1.5 font-mono text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground aria-expanded:text-foreground"
        >
          {options.find((o) => o.value === value)?.label ?? value}
          <ChevronDown className="size-3 opacity-60" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-28">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={value === o.value}
            onCheckedChange={() => onChange(o.value)}
            className="font-mono text-xs"
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The metric switch: total / unique / both, folding with its header. */
export function MetricControl({
  value,
  onChange,
}: {
  value: SeriesMetric
  onChange: (value: SeriesMetric) => void
}) {
  return (
    <AdaptiveSegmented
      value={value}
      onChange={onChange}
      options={METRICS.map((m) => ({ value: m, label: m }))}
      ariaLabel="Metric"
    />
  )
}
