"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp } from "lucide-react"

import {
  listApiKeys,
  listAppGrants,
  listCustomDomains,
  listUrls,
} from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { TodayStrip } from "@/components/dashboard/overview/today-strip"
import { Attention } from "@/components/dashboard/overview/attention"
import { HotLinks } from "@/components/dashboard/overview/hot-links"
import { RecentLinks } from "@/components/dashboard/overview/recent-links"
import { WorkspaceCard } from "@/components/dashboard/overview/workspace-card"

/**
 * The overview is a daily briefing, not a second analytics page: what's
 * happening right now, what needs me, what did I just make, and the state
 * of my stuff. Windowed analysis lives on /dashboard/analytics. Most
 * blocks are conditional — on a healthy, set-up account this page is one
 * band of numbers, an all-clear line, two short lists and a card.
 */

export default function DashboardOverviewPage() {
  const { user } = useAuth()
  const name = user?.user_name?.trim() || user?.email?.split("@")[0] || "there"

  // One scan powers the strip's count, the attention rules, recent links
  // and the workspace card's per-domain counts.
  const scan = useQuery({
    queryKey: ["urls", "overview-scan"],
    queryFn: () =>
      listUrls({ pageSize: 100, sortBy: "created_at", sortOrder: "desc" }),
  })
  const domains = useQuery({ queryKey: ["domains"], queryFn: listCustomDomains })
  const keys = useQuery({ queryKey: ["keys"], queryFn: listApiKeys })
  const grants = useQuery({ queryKey: ["apps"], queryFn: listAppGrants })

  const links = scan.data?.items ?? []

  const checklist = [
    {
      done: (scan.data?.total ?? 0) > 0,
      label: "Create your first link",
      action: () => openLinkComposer(),
      cta: "Create",
    },
    {
      done: (domains.data?.items.filter((d) => d.status === "ACTIVE").length ?? 0) > 0,
      label: "Connect a custom domain",
      href: "/dashboard/domains",
      cta: "Connect",
    },
    {
      done: (keys.data?.items.filter((k) => !k.revoked).length ?? 0) > 0,
      label: "Create an API key",
      href: "/dashboard/developer",
      cta: "Create",
    },
    {
      done: (grants.data?.items.length ?? 0) > 0,
      label: "Install an app or extension",
      href: "/dashboard/apps",
      cta: "Browse",
    },
  ]
  const remaining = checklist.filter((c) => !c.done)
  // Every source must have answered before the checklist may render:
  // pending queries read as "not done" and the block would flash in.
  const checklistReady = Boolean(
    scan.data && domains.data && keys.data && grants.data,
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <span className="label-mono text-muted-foreground/60">Overview</span>
      <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
        Welcome back, {name}
      </h1>

      {/* Today: one ruled band, present tense */}
      <TodayStrip linksTotal={scan.data?.total} />

      {/* Setup checklist, only while something remains */}
      {checklistReady && remaining.length > 0 && (
        <div className="mt-8">
          <SectionHeader
            icon={TrendingUp}
            title="Finish setting up"
            action={
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {checklist.length - remaining.length}/{checklist.length}
              </span>
            }
          />
          <Panel className="divide-border/60 mt-2 divide-y">
            {remaining.map((item) => (
              <div key={item.label} className="flex h-12 items-center gap-3 px-4">
                <span className="border-border/60 size-4 shrink-0 rounded-full border border-dashed" />
                <span className="text-foreground flex-1 text-sm">{item.label}</span>
                {item.href ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.href}>{item.cta}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={item.action}>
                    {item.cta}
                  </Button>
                )}
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* What needs me (or one quiet all-clear line) */}
      <Attention
        links={links}
        domains={domains.data?.items ?? []}
        ready={Boolean(scan.data && domains.data)}
      />

      {/* Now + mine, with the workspace rail */}
      <div className="mt-8 grid grid-cols-1 gap-6 pb-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <HotLinks />
          <RecentLinks links={links} loading={scan.isPending} />
        </div>
        <WorkspaceCard
          domains={domains.data?.items ?? []}
          grants={grants.data?.items ?? []}
          keys={keys.data?.items ?? []}
          links={links}
        />
      </div>
    </div>
  )
}
