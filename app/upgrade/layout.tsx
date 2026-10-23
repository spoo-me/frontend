"use client"

import type * as React from "react"

import { DashboardShell } from "@/components/dashboard/shell"

/** The upgrade pages live inside the signed-in shell: same gate, same chrome. */
export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
