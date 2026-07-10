"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"

import { listCustomDomains, type UrlListItem } from "@/lib/api"
import { formatCount, formatWhen } from "@/lib/format"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"
import { LinkActions, shortUrlOf } from "@/components/dashboard/links/link-actions"
import { LinkSettingsForm } from "@/components/dashboard/links/link-settings-form"

/**
 * Quick sheet — URL-addressable (?link=alias, wired by the links page).
 * At-a-glance stats + the SAME settings form the detail page renders.
 */
export function LinkSheet({
  link,
  open,
  onOpenChange,
}: {
  link: UrlListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: open,
    staleTime: 60_000,
  })
  const domainOptions = [
    "spoo.me",
    ...(domains.data?.items.filter((d) => d.status === "ACTIVE").map((d) => d.fqdn) ??
      []),
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Full width on phones: the base primitive's w-3/4 leaves a useless
          blurred sliver of the list and starves the form. The data-variant
          override is what actually beats data-[side=right]:w-3/4; ≥sm the
          sheet widens past the primitive's max-w-sm, which read cramped
          for the settings form. */}
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        {!link ? (
          <>
            <SheetTitle className="sr-only">Link details</SheetTitle>
            <div className="text-muted-foreground/60 p-6 font-mono text-xs">
              loading…
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="border-border/60 bg-muted border-b px-5 pt-5 pb-4 dark:bg-muted/40">
              <SheetTitle className="flex items-center gap-2 pr-8 text-left">
                <span className="text-foreground truncate font-mono text-sm font-medium">
                  {(link.domain ?? "spoo.me") + "/" + link.alias}
                </span>
                <CopyButton value={shortUrlOf(link)} />
                <span className="ml-auto flex items-center gap-1">
                  <StatusPill status={link.status} />
                  <LinkActions link={link} onDeleted={() => onOpenChange(false)} />
                </span>
              </SheetTitle>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {link.long_url}
              </p>

              <div className="border-border/60 bg-card mt-4 grid grid-cols-3 divide-x divide-border/60 rounded-xl border">
                <div className="px-3 py-2.5">
                  <div className="label-mono text-muted-foreground/70 text-[10px]">
                    Clicks
                  </div>
                  <div className="text-foreground mt-0.5 font-mono text-lg font-semibold tabular-nums">
                    {formatCount(link.total_clicks)}
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="label-mono text-muted-foreground/70 text-[10px]">
                    Last click
                  </div>
                  <div className="text-foreground mt-0.5 truncate text-xs leading-7">
                    {formatWhen(link.last_click)}
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="label-mono text-muted-foreground/70 text-[10px]">
                    Created
                  </div>
                  <div className="text-foreground mt-0.5 truncate text-xs leading-7">
                    {formatWhen(link.created_at)}
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard/links/${link.alias}`}
                className="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-1 text-xs underline underline-offset-4 transition-colors duration-150"
              >
                Open full page for analytics and history
                <ArrowUpRight className="size-3" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              className="px-5 py-5"
            >
              <LinkSettingsForm link={link} domains={domainOptions} />
            </motion.div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
