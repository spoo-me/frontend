"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Toaster } from "sonner"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/components/auth/auth-context"
import { DashboardCommandMenu } from "@/components/dashboard/command-menu"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { LinkComposer } from "@/components/dashboard/links/composer"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/dashboard")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="bg-background flex min-h-dvh items-center justify-center">
        <span className="label-mono text-muted-foreground/60">loading</span>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
    {/* Floating-sheet architecture (ref 10): chrome sits on the canvas,
        content is an elevated rounded sheet with its own scroll. */}
    <div className="bg-canvas flex h-dvh overflow-hidden">
      <DashboardSidebar />
      <div className="border-border bg-background m-3 flex min-w-0 flex-1 flex-col overflow-y-auto rounded-2xl border lg:ml-0">
        <DashboardTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
      <DashboardCommandMenu />
      <LinkComposer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-popover !text-popover-foreground !border-border/60 !shadow-lg !rounded-xl",
        }}
      />
    </div>
    </TooltipProvider>
  )
}
