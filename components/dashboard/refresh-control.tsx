"use client"

import * as React from "react"
import { ChevronDown, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  REFRESH_OPTIONS,
  type RefreshInterval,
} from "@/hooks/use-auto-refresh"

/**
 * Grafana-style split control: the icon refreshes now, the chevron picks
 * the auto-refresh cadence. No countdown chrome — freshness shows up as
 * data, the control only exists so the cadence is a choice.
 */
export function RefreshControl({
  intervalMs,
  onIntervalChange,
  onRefresh,
  refreshing,
  className,
}: {
  intervalMs: RefreshInterval
  onIntervalChange: (v: RefreshInterval) => void
  onRefresh: () => void
  refreshing?: boolean
  className?: string
}) {
  const active = REFRESH_OPTIONS.find((o) => o.ms === intervalMs)
  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-r-none"
        aria-label="Refresh now"
        onClick={onRefresh}
      >
        <RefreshCw
          className={cn("size-3.5", refreshing && "animate-spin")}
          strokeWidth={1.75}
        />
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-l-none border-l-0 px-1.5"
            aria-label="Auto-refresh interval"
          >
            {intervalMs !== false && (
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {active?.label}
              </span>
            )}
            <ChevronDown className="size-3 text-muted-foreground/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Auto-refresh
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={intervalMs === false ? "off" : String(intervalMs)}
            onValueChange={(v) =>
              onIntervalChange(v === "off" ? false : Number(v))
            }
          >
            {REFRESH_OPTIONS.map((o) => (
              <DropdownMenuRadioItem
                key={o.label}
                value={o.ms === false ? "off" : String(o.ms)}
              >
                {o.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
