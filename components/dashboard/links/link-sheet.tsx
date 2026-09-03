"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"

import { listCustomDomains, type UrlListItem } from "@/lib/api"
import { linkDetailPath } from "@/lib/link-detail"
import { formatCount, formatWhen } from "@/lib/format"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { StatusPill } from "@/components/dashboard/status-pill"
import { ScheduledState } from "@/components/dashboard/links/scheduled-state"
import { useFeature } from "@/hooks/use-features"
import { CopyButton } from "@/components/dashboard/copy-button"
import {
  LinkActions,
  shortUrlOf,
} from "@/components/dashboard/links/link-actions"
import { LinkSettingsForm } from "@/components/dashboard/links/link-settings-form"

/**
 * Quick sheet — URL-addressable (?link=alias, wired by the links page).
 * At-a-glance stats + the SAME settings form the detail page renders.
 */
export function LinkSheet({
  link,
  open,
  onOpenChange,
  onSaved,
}: {
  link: UrlListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The saved link. The page re-addresses ?link= with it: a rename moves
      the link out from under the old param, which otherwise resolves to a
      404 and leaves the sheet stuck on "loading…" forever. */
  onSaved?: (next: UrlListItem) => void
}) {
  const showDomains = useFeature("custom_domains") === "enabled"
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: open && showDomains,
    staleTime: 60_000,
  })
  const domainOptions = [
    "spoo.me",
    ...(domains.data?.items
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn) ?? []),
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
            <div className="p-6 font-mono text-muted-foreground/60 text-xs">
              loading…
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05,
              }}
              className="border-border/60 border-b bg-muted px-5 pt-5 pb-4 dark:bg-muted/40"
            >
              <SheetTitle className="flex items-center gap-2 pr-8 text-left">
                <span className="truncate font-medium font-mono text-foreground text-sm">
                  {(link.domain ?? "spoo.me") + "/" + link.alias}
                </span>
                <CopyButton
                  value={shortUrlOf(link)}
                  trackAs="copy_short_link"
                />
                <span className="ml-auto flex items-center gap-1">
                  {link.status === "SCHEDULED" && link.starts_at != null ? (
                    <ScheduledState startsAt={link.starts_at} />
                  ) : (
                    <StatusPill status={link.status} />
                  )}
                  <LinkActions
                    link={link}
                    onDeleted={() => onOpenChange(false)}
                  />
                </span>
              </SheetTitle>
              <p className="ph-no-capture mt-1 truncate text-muted-foreground text-xs">
                {link.long_url}
              </p>

              <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-card">
                <div className="px-3 py-2.5">
                  <div className="label-mono text-[10px] text-muted-foreground/70">
                    Clicks
                  </div>
                  <div className="mt-0.5 font-mono font-semibold text-foreground text-lg tabular-nums">
                    {formatCount(link.total_clicks)}
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="label-mono text-[10px] text-muted-foreground/70">
                    Last click
                  </div>
                  <div className="mt-0.5 truncate text-foreground text-xs leading-7">
                    {formatWhen(link.last_click)}
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="label-mono text-[10px] text-muted-foreground/70">
                    Created
                  </div>
                  <div className="mt-0.5 truncate text-foreground text-xs leading-7">
                    {formatWhen(link.created_at)}
                  </div>
                </div>
              </div>

              <Link
                href={linkDetailPath(link)}
                className="mt-3 inline-flex items-center gap-1 text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
              >
                Open full page for analytics and history
                <ArrowUpRight className="size-3" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.12,
              }}
              className="px-5 py-5"
            >
              <LinkSettingsForm
                link={link}
                domains={domainOptions}
                onSaved={onSaved}
              />
            </motion.div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
