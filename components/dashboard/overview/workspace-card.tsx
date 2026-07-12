"use client"

import * as React from "react"
import Link from "next/link"
import {
  AppWindow,
  ArrowUpRight,
  Boxes,
  Command,
  Globe,
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
  icon: Icon,
  label,
  href,
  action,
}: {
  icon: React.ElementType
  label: string
  href: string
  /** Omitted when the column is empty — the empty CTA owns the action. */
  action?: string
}) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground/60">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="label-mono text-[10px]">{label}</span>
      </span>
      {action && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 transition-colors duration-150 hover:text-foreground"
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
    // Centered stack in the column body: the note carries the state, the
    // verb sits under it.
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
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
    <div className="rounded-2xl border border-border/60 bg-shell p-0.5">
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
      <Panel className="mt-0 grid grid-cols-1 divide-y divide-border/60 rounded-[14px] bg-background lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Domains */}
        <div className="flex min-h-[192px] flex-col px-4 py-3">
          <ColumnHeader
            icon={Globe}
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
                  className="-mx-2 flex h-10 items-center gap-2.5 rounded-lg px-2 transition-colors duration-150 hover:bg-accent/40"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
                    {d.fqdn}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                    {formatCount(count)} links
                  </span>
                  <StatusPill status={d.status} kind="domain" explain />
                </Link>
              )
            })
          ) : (
            <EmptyCta
              note="No Custom Domains"
              href="/dashboard/domains"
              cta="Add Domain"
            />
          )}
        </div>

        {/* Connected apps */}
        <div className="flex min-h-[192px] flex-col px-4 py-3">
          <ColumnHeader
            icon={AppWindow}
            label="Apps"
            href="/dashboard/apps"
            action={grants.length ? "Browse" : undefined}
          />
          {grants.length ? (
            grants.map((g) => {
              const Icon = GRANT_ICONS[g.icon] ?? Puzzle
              return (
                <div
                  key={g.id}
                  className="-mx-2 flex h-10 items-center gap-2.5 px-2"
                >
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground/70"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                    {g.app_name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
                    {formatWhen(g.last_used_at)}
                  </span>
                </div>
              )
            })
          ) : (
            <EmptyCta
              note="Nothing Connected"
              href="/dashboard/apps"
              cta="Browse Apps"
            />
          )}
        </div>

        {/* API keys */}
        <div className="flex min-h-[192px] flex-col px-4 py-3">
          <ColumnHeader
            icon={KeyRound}
            label="API keys"
            href="/dashboard/developer"
            action={activeKeys.length ? "Manage" : undefined}
          />
          {activeKeys.length ? (
            activeKeys.map((k) => (
              <div
                key={k.id}
                className="-mx-2 flex h-10 items-center gap-2.5 px-2"
              >
                <KeyRound
                  className="size-4 shrink-0 text-muted-foreground/70"
                  strokeWidth={1.75}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  {k.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
                  {k.last_used_at
                    ? `used ${formatWhen(k.last_used_at)}`
                    : "unused"}
                </span>
              </div>
            ))
          ) : (
            <EmptyCta
              note="No API Keys"
              href="/dashboard/developer"
              cta="Create Key"
            />
          )}
        </div>
      </Panel>
    </div>
  )
}
