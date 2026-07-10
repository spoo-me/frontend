"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, History, Plus } from "lucide-react"

import type { UrlListItem } from "@/lib/api"
import { displayUrl, formatCount, formatWhen } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/dashboard/copy-button"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { shortUrlOf } from "@/components/dashboard/links/link-actions"
import { Skeleton } from "@/components/ui/skeleton"

/** What I just made: the five newest links, copy-ready. */

export function RecentLinks({
  links,
  loading,
}: {
  links: UrlListItem[]
  loading: boolean
}) {
  const recent = links.filter((l) => l.alias).slice(0, 5)

  return (
    <div className="border-border/60 bg-shell flex h-full flex-col rounded-2xl border p-0.5">
      <SectionHeader
        className="h-9 px-2.5"
        icon={History}
        title="Recent links"
        action={
          <Link
            href="/dashboard/links"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150"
          >
            All links
            <ArrowUpRight className="size-3" />
          </Link>
        }
      />
      <Panel className="bg-background mt-0 flex-1 rounded-[14px] p-2">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : recent.length ? (
          <div className="space-y-1">
            {recent.map((l) => (
              <div
                key={l.id}
                className="hover:bg-accent/40 group flex h-9 items-center gap-2.5 rounded-lg px-2.5 transition-colors duration-150"
              >
                <Link
                  href={`/dashboard/links/${l.alias}`}
                  className="flex min-w-0 flex-1 items-baseline gap-2.5"
                >
                  <span className="text-foreground shrink-0 font-mono text-[13px]">
                    /{l.alias}
                  </span>
                  <span className="text-muted-foreground/70 min-w-0 truncate text-xs">
                    {l.long_url ? displayUrl(l.long_url) : ""}
                  </span>
                </Link>
                <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px]">
                  {formatWhen(l.created_at)}
                </span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {formatCount(l.total_clicks ?? 0)}
                </span>
                <CopyButton value={shortUrlOf(l)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="pattern-dots m-2 flex h-40 flex-col items-center justify-center gap-3 rounded-lg">
            <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
              No links yet
            </span>
            <Button size="sm" onClick={() => openLinkComposer()}>
              <Plus data-icon="inline-start" />
              New link
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
