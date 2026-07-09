"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Boxes,
  Command,
  KeyRound,
  Puzzle,
  SquareTerminal,
} from "lucide-react"

import type { ApiKey, AppGrant, CustomDomain, UrlListItem } from "@/lib/api"
import { formatCount, formatWhen } from "@/lib/format"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"

/**
 * State of my stuff, in ONE card: custom domains with health, connected
 * apps with last use, API keys in a single line. Hairline-divided
 * sections, quiet text actions — the rail never competes with the
 * briefing's main column.
 */

const GRANT_ICONS: Record<string, React.ElementType> = {
  terminal: SquareTerminal,
  puzzle: Puzzle,
  command: Command,
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="label-mono text-muted-foreground/60 text-[10px]">
      {children}
    </span>
  )
}

export function WorkspaceCard({
  domains,
  grants,
  keys,
  links,
}: {
  domains: CustomDomain[]
  grants: AppGrant[]
  keys: ApiKey[]
  links: UrlListItem[]
}) {
  const activeKeys = keys.filter((k) => !k.revoked)
  const lastKeyUse = activeKeys
    .map((k) => k.last_used_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div className="border-border/60 bg-shell self-start rounded-2xl border p-0.5">
      <SectionHeader className="h-9 px-2.5" icon={Boxes} title="Workspace" />
      <Panel className="bg-background divide-border/60 mt-0 divide-y rounded-[14px]">
        {/* Domains */}
        <div className="space-y-1 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <RailLabel>Domains</RailLabel>
            <Link
              href="/dashboard/domains"
              className="text-muted-foreground/70 hover:text-foreground flex items-center gap-0.5 text-[11px] transition-colors duration-150"
            >
              {domains.length ? "Manage" : "Add domain"}
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {domains.length ? (
            domains.map((d) => {
              const count = links.filter((l) => l.domain === d.fqdn).length
              return (
                <Link
                  key={d.id}
                  href={`/dashboard/domains/${d.id}`}
                  className="hover:bg-accent/40 -mx-1.5 flex h-9 items-center gap-2 rounded-lg px-1.5 transition-colors duration-150"
                >
                  <span className="text-foreground min-w-0 flex-1 truncate font-mono text-[13px]">
                    {d.fqdn}
                  </span>
                  <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px] tabular-nums">
                    {formatCount(count)} links
                  </span>
                  <StatusPill status={d.status} kind="domain" />
                </Link>
              )
            })
          ) : (
            <p className="text-muted-foreground/70 py-1 text-xs">
              no custom domains
            </p>
          )}
        </div>

        {/* Connected apps */}
        <div className="space-y-1 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <RailLabel>Apps</RailLabel>
            <Link
              href="/dashboard/apps"
              className="text-muted-foreground/70 hover:text-foreground flex items-center gap-0.5 text-[11px] transition-colors duration-150"
            >
              Browse
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {grants.length ? (
            grants.map((g) => {
              const Icon = GRANT_ICONS[g.icon] ?? Puzzle
              return (
                <div key={g.id} className="-mx-1.5 flex h-9 items-center gap-2 px-1.5">
                  <Icon
                    className="text-muted-foreground/70 size-3.5 shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="text-foreground min-w-0 flex-1 truncate text-[13px]">
                    {g.app_name}
                  </span>
                  <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px]">
                    {formatWhen(g.last_used_at)}
                  </span>
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground/70 py-1 text-xs">
              nothing connected
            </p>
          )}
        </div>

        {/* API keys */}
        <Link
          href="/dashboard/developer"
          className="hover:bg-accent/40 flex h-11 items-center gap-2 px-3 transition-colors duration-150"
        >
          <KeyRound
            className="text-muted-foreground/70 size-3.5 shrink-0"
            strokeWidth={1.75}
          />
          <span className="text-foreground flex-1 text-[13px]">
            {activeKeys.length
              ? `${activeKeys.length} active ${activeKeys.length === 1 ? "key" : "keys"}`
              : "no API keys"}
          </span>
          {lastKeyUse && (
            <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px]">
              used {formatWhen(lastKeyUse)}
            </span>
          )}
        </Link>
      </Panel>
    </div>
  )
}
