"use client"

import { motion } from "motion/react"

import type { AbVariant, DimensionRow } from "@/lib/api"
import { displayUrl, domainOf, formatCount, formatPercent } from "@/lib/format"
import { DimensionIcon } from "@/components/dashboard/dim-icon"

export type VariantSlot = {
  key: string
  url: string | null
  /** Configured share in percent; null for clicks whose variant was removed. */
  weight: number | null
  clicks: number
  unique_clicks: number
}

/**
 * Join the link's configured variants with the clicks_by_variant rows. Every
 * configured variant gets a row even at zero clicks, the default destination
 * carries the unclaimed weight, and clicks stamped with an index that no
 * longer exists stay visible as removed variants so shares still sum.
 */
export function variantSlots(
  longUrl: string | null,
  variants: AbVariant[],
  rows: DimensionRow[]
): VariantSlot[] {
  const byKey = new Map(rows.map((r) => [r.value, r]))
  const pick = (key: string) => ({
    clicks: byKey.get(key)?.clicks ?? 0,
    unique_clicks: byKey.get(key)?.unique_clicks ?? 0,
  })
  const claimed = variants.reduce((a, v) => a + v.weight, 0)
  const slots: VariantSlot[] = variants.map((v, i) => ({
    key: String(i),
    url: v.url,
    weight: v.weight,
    ...pick(String(i)),
  }))
  slots.push({
    key: "(default)",
    url: longUrl,
    weight: 100 - claimed,
    ...pick("(default)"),
  })
  const known = new Set(slots.map((s) => s.key))
  for (const row of rows) {
    if (known.has(row.value)) continue
    slots.push({
      key: row.value,
      url: null,
      weight: null,
      clicks: row.clicks,
      unique_clicks: row.unique_clicks,
    })
  }
  return slots
}

/**
 * Per-variant clicks for an A/B link: configured split next to the observed
 * share, one row per destination. Same bar grammar as BreakdownList (the row
 * background is the bar), with the default destination as an ordinary row.
 */
export function VariantBreakdown({
  longUrl,
  variants,
  rows,
}: {
  longUrl: string | null
  variants: AbVariant[]
  rows: DimensionRow[]
}) {
  const slots = variantSlots(longUrl, variants, rows)
  const total = slots.reduce((a, s) => a + s.clicks, 0)
  const max = Math.max(...slots.map((s) => s.clicks), 1)
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-1.5 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em]">
        <span className="flex-1">destination</span>
        <span className="w-12 text-right">split</span>
        <span className="w-14 text-right">clicks</span>
        <span className="w-12 text-right">share</span>
      </div>
      {slots.map((slot, i) => (
        <div
          key={slot.key}
          className="relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-2.5"
        >
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-lg bg-muted/80"
            initial={{ width: "0%" }}
            animate={{
              width:
                slot.clicks > 0
                  ? `${Math.max((slot.clicks / max) * 100, 4)}%`
                  : "0%",
            }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
              delay: i * 0.035,
            }}
          />
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            <DimensionIcon
              dimension="variant"
              value={slot.url ? domainOf(slot.url) : ""}
              className="size-4"
            />
          </span>
          <span className="relative flex min-w-0 flex-1 items-baseline gap-2 text-[13px] text-foreground">
            <span className="truncate">
              {slot.url ? displayUrl(slot.url) : "removed variant"}
            </span>
            {slot.key === "(default)" && (
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
                default
              </span>
            )}
          </span>
          <span className="relative w-12 text-right font-mono text-muted-foreground text-xs tabular-nums">
            {slot.weight == null ? "–" : `${slot.weight}%`}
          </span>
          <span className="relative w-14 text-right font-mono text-foreground text-xs tabular-nums">
            {formatCount(slot.clicks)}
          </span>
          <span className="relative w-12 text-right font-mono text-muted-foreground text-xs tabular-nums">
            {formatPercent(
              total ? Math.round((slot.clicks / total) * 1000) / 10 : 0
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
