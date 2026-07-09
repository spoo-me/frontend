"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import {
  listApiKeys,
  listAppGrants,
  listCustomDomains,
  listUrls,
} from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { TodayCards } from "@/components/dashboard/overview/today-cards"
import { Attention } from "@/components/dashboard/overview/attention"
import { HotLinks } from "@/components/dashboard/overview/hot-links"
import { RecentLinks } from "@/components/dashboard/overview/recent-links"
import { WorkspaceCard } from "@/components/dashboard/overview/workspace-card"

/**
 * The overview is a daily briefing, not a second analytics page: today's
 * numbers, what needs me, what's moving right now, what I just made, and
 * the state of my stuff. Windowed analysis lives on /dashboard/analytics;
 * setup lives in the floating checklist (dashboard layout).
 */

export default function DashboardOverviewPage() {
  const { user } = useAuth()
  const name = user?.user_name?.trim() || user?.email?.split("@")[0] || "there"

  // One scan powers the cards' count, the attention rules, recent links
  // and the workspace band's per-domain counts.
  const scan = useQuery({
    queryKey: ["urls", "overview-scan"],
    queryFn: () =>
      listUrls({ pageSize: 100, sortBy: "created_at", sortOrder: "desc" }),
  })
  const domains = useQuery({ queryKey: ["domains"], queryFn: listCustomDomains })
  const keys = useQuery({ queryKey: ["keys"], queryFn: listApiKeys })
  const grants = useQuery({ queryKey: ["apps"], queryFn: listAppGrants })

  const links = scan.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl">
      <span className="label-mono text-muted-foreground/60">Overview</span>
      <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
        Welcome back, {name}
      </h1>

      {/* Today's numbers, present tense */}
      <TodayCards linksTotal={scan.data?.total} />

      {/* What needs me (or one quiet all-clear line) */}
      <Attention
        links={links}
        domains={domains.data?.items ?? []}
        ready={Boolean(scan.data && domains.data)}
      />

      {/* Now + mine */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HotLinks />
        <RecentLinks links={links} loading={scan.isPending} />
      </div>

      {/* State of my stuff */}
      <div className="mt-8 pb-8">
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
