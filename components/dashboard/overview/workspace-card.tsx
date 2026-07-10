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
import { InfoHint } from "@/components/dashboard/info-hint"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/dashboard/status-pill"

/**
 * State of my stuff: one full-width band, three columns with room to
 * breathe — domains with health, connected apps with last use, API keys.
 * Hairline-divided; quiet text actions only.
 */

const GRANT_ICONS: Record<string, React.ElementType> = {
  terminal: SquareTerminal,
  puzzle: Puzzle,
  command: Command,
}

function ColumnHeader({
  label,
  href,
  action,
}: {
  label: string
  href: string
  /** Omitted when the column is empty — the empty CTA owns the action. */
  action?: string
}) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="label-mono text-muted-foreground/60 text-[10px]">
        {label}
      </span>
      {action && (
        <Link
          href={href}
          className="text-muted-foreground/70 hover:text-foreground flex items-center gap-0.5 text-[11px] transition-colors duration-150"
        >
          {action}
          <ArrowUpRight className="size-3" />
        </Link>
      )}
    </div>
  )
}

/** Empty columns get a verb, not a shrug. */
function EmptyCta({
  note,
  href,
  cta,
}: {
  note: string
  href: string
  cta: string
}) {
  return (
    <div className="flex h-10 items-center justify-between gap-2">
      <span className="text-muted-foreground/70 text-xs">{note}</span>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
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

  return (
    <div className="border-border/60 bg-shell rounded-2xl border p-0.5">
      <SectionHeader
        className="h-9 px-2.5"
        icon={Boxes}
        title="Workspace"
        badge={
          <InfoHint label="What this card shows">
            The state of your domains, connected apps, and API keys.
          </InfoHint>
        }
      />
      <Panel className="bg-background divide-border/60 mt-0 grid grid-cols-1 divide-y rounded-[14px] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Domains */}
        <div className="px-4 py-3">
          <ColumnHeader
            label="Domains"
            href="/dashboard/domains"
            action={domains.length ? "Manage" : undefined}
          />
          {domains.length ? (
            domains.map((d) => {
              const count = links.filter((l) => l.domain === d.fqdn).length
              return (
                <Link
                  key={d.id}
                  href={`/dashboard/domains/${d.id}`}
                  className="hover:bg-accent/40 -mx-2 flex h-10 items-center gap-2.5 rounded-lg px-2 transition-colors duration-150"
                >
                  <span className="text-foreground min-w-0 flex-1 truncate font-mono text-[13px]">
                    {d.fqdn}
                  </span>
                  <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px] tabular-nums">
                    {formatCount(count)} links
                  </span>
                  <StatusPill status={d.status} kind="domain" explain />
                </Link>
              )
            })
          ) : (
            <EmptyCta
              note="no custom domains"
              href="/dashboard/domains"
              cta="Add domain"
            />
          )}
        </div>

        {/* Connected apps */}
        <div className="px-4 py-3">
          <ColumnHeader
            label="Apps"
            href="/dashboard/apps"
            action={grants.length ? "Browse" : undefined}
          />
          {grants.length ? (
            grants.map((g) => {
              const Icon = GRANT_ICONS[g.icon] ?? Puzzle
              return (
                <div key={g.id} className="-mx-2 flex h-10 items-center gap-2.5 px-2">
                  <Icon
                    className="text-muted-foreground/70 size-4 shrink-0"
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
            <EmptyCta
              note="nothing connected"
              href="/dashboard/apps"
              cta="Browse apps"
            />
          )}
        </div>

        {/* API keys */}
        <div className="px-4 py-3">
          <ColumnHeader
            label="API keys"
            href="/dashboard/developer"
            action={activeKeys.length ? "Manage" : undefined}
          />
          {activeKeys.length ? (
            activeKeys.map((k) => (
              <div key={k.id} className="-mx-2 flex h-10 items-center gap-2.5 px-2">
                <KeyRound
                  className="text-muted-foreground/70 size-4 shrink-0"
                  strokeWidth={1.75}
                />
                <span className="text-foreground min-w-0 flex-1 truncate text-[13px]">
                  {k.name}
                </span>
                <span className="text-muted-foreground/70 shrink-0 font-mono text-[11px]">
                  {k.last_used_at ? `used ${formatWhen(k.last_used_at)}` : "unused"}
                </span>
              </div>
            ))
          ) : (
            <EmptyCta
              note="no API keys"
              href="/dashboard/developer"
              cta="Create key"
            />
          )}
        </div>
      </Panel>
    </div>
  )
}
