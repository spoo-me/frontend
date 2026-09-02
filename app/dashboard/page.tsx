"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { listCustomDomains, listUrls } from "@/lib/api"
import { CreateBox } from "@/components/dashboard/overview/create-box"
import { TodayCards } from "@/components/dashboard/overview/today-cards"
import { Attention } from "@/components/dashboard/overview/attention"
import { TopLinks } from "@/components/dashboard/overview/top-links"
import { RecentLinks } from "@/components/dashboard/overview/recent-links"

/**
 * The overview is a daily briefing, not a second analytics page: make a
 * link, today's numbers, what needs me, what's moving, what I just made.
 * Windowed analysis lives on /dashboard/analytics; setup lives in the
 * floating checklist (dashboard layout).
 */

export default function DashboardOverviewPage() {
  // One scan powers the cards' count, the attention rules and recent links.
  const scan = useQuery({
    queryKey: ["urls", "overview-scan"],
    queryFn: () =>
      listUrls({ pageSize: 100, sortBy: "created_at", sortOrder: "desc" }),
  })
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
  })

  const links = scan.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl">
      <CreateBox />

      <TodayCards linksTotal={scan.data?.total} />

      <Attention
        links={links}
        domains={domains.data?.items ?? []}
        ready={Boolean(scan.data && domains.data)}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2">
        <TopLinks />
        <RecentLinks links={links} loading={scan.isPending} />
      </div>
    </div>
  )
}
