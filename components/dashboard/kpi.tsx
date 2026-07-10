import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { InfoHint } from "@/components/dashboard/info-hint"
import { Panel } from "@/components/dashboard/section"

/**
 * KPI card, ref-20 anatomy: caps-mono label + big mono tabular value in the
 * body, delta in a muted footer strip (delta as a card ZONE, not a pill).
 */
export function KpiCard({
  label,
  badge,
  value,
  sub,
  delta,
  deltaLabel = "vs previous period",
  footer,
  chart,
  className,
}: {
  label: string
  /** Quiet annotation after the label (e.g. a stat widget's scope chip). */
  badge?: React.ReactNode
  value: React.ReactNode
  sub?: string
  /** Percent change; sign carries direction. */
  delta?: number | null
  deltaLabel?: string
  /** Quiet footer text for cards without a delta (keeps heights uniform). */
  footer?: string
  /** Optional trend zone between body and footer (stat widgets ≥3h). */
  chart?: React.ReactNode
  className?: string
}) {
  const hasFooterRow = delta != null || footer != null
  return (
    <Panel className={cn("bg-shell flex flex-col", className)}>
      <div className="px-4 pt-3.5 pb-3">
        <div className="label-mono text-muted-foreground flex min-w-0 items-center gap-1.5">
          <span className="truncate">{label}</span>
          {badge}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-foreground font-mono text-[26px] leading-none font-semibold tracking-tight tabular-nums">
            {value}
          </span>
          {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
        </div>
      </div>
      <div className="min-h-0 flex-1">{chart}</div>
      {hasFooterRow && (
        <div className="border-border/60 bg-muted/30 flex h-8 items-center justify-between border-t px-4">
          {delta != null ? (
            <>
              <DeltaText value={delta} />
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground/70 text-[11px]">
                  {deltaLabel}
                </span>
                <InfoHint label="How the delta is computed" className="-mr-1">
                  Compared with the equal-length window just before this range.
                </InfoHint>
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/70 text-[11px]">{footer}</span>
          )}
        </div>
      )}
    </Panel>
  )
}

/** Plain colored delta text (the quiet treatment — refs 08/20). */
export function DeltaText({ value }: { value: number }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 font-mono text-[11px] font-medium tabular-nums",
        up ? "text-live" : "text-destructive",
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}
