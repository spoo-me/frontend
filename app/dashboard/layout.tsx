"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useTheme } from "next-themes"
import { Toaster, type ToasterProps } from "sonner"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/components/auth/auth-context"
import { DashboardCommandMenu } from "@/components/dashboard/command-menu"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { LinkComposer } from "@/components/dashboard/links/composer"
import { SearchParamsKeeper } from "@/components/dashboard/search-params-keeper"
import { SetupChecklist } from "@/components/dashboard/setup-checklist"
import { ShortcutsHelp } from "@/components/dashboard/shortcuts-help"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { resolvedTheme } = useTheme()

  // Returning sessions skip the gate: render the shell optimistically
  // while /me revalidates; the flag is dropped on sign-out or a failed
  // check, so logged-out visitors still gate (and then redirect).
  // Two-pass on purpose: the first client render must match the SSR'd
  // gate (no localStorage branch during hydration); the flag flips the
  // shell in immediately after mount. Pre-paint text hiding is handled
  // by the inline .authed script, so nothing flashes in between.
  const [wasAuthed, setWasAuthed] = React.useState(false)
  React.useEffect(() => {
    setWasAuthed(localStorage.getItem("spoo:authed") === "1")
  }, [])
  React.useEffect(() => {
    if (user) localStorage.setItem("spoo:authed", "1")
    else if (!loading) localStorage.removeItem("spoo:authed")
  }, [user, loading])

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/dashboard")
  }, [loading, user, router])

  if ((loading && !wasAuthed) || (!loading && !user)) {
    return (
      <div className="bg-background flex min-h-dvh items-center justify-center">
        <span className="label-mono text-muted-foreground/60 gate-appear [.authed_&]:hidden">
          loading
        </span>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
    {/* Floating-sheet architecture (ref 10): chrome sits on the canvas,
        content is an elevated rounded sheet with its own scroll. */}
    <div className="bg-canvas flex h-dvh overflow-hidden">
      <DashboardSidebar />
      <div data-dashboard-scroller className="border-border bg-background m-3 flex min-w-0 flex-1 flex-col overflow-y-auto rounded-2xl border lg:ml-0">
        <DashboardTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        {/* Scrolling content dissolves into the sheet's bottom edge. Light
            only: dark-on-dark fades just dim the last row without reading
            as a fade. */}
        <div className="from-background pointer-events-none sticky bottom-0 -mt-8 h-8 shrink-0 bg-linear-to-t to-transparent dark:hidden" />
      </div>
      <DashboardCommandMenu />
      <LinkComposer />
      <SearchParamsKeeper />
      <SetupChecklist />
      <ShortcutsHelp />
      {/* Theme must be forwarded: sonner defaults to its light palette, so
          without it the description and action chip keep light-mode colors
          on a dark toast (unreadable). Tokens pin every slot to our theme. */}
      <Toaster
        position="bottom-right"
        theme={resolvedTheme as ToasterProps["theme"]}
        toastOptions={{
          classNames: {
            toast:
              "!bg-popover !text-popover-foreground !border-border/60 !shadow-lg !rounded-xl",
            description: "!text-muted-foreground",
            actionButton: "!bg-primary !text-primary-foreground",
            cancelButton: "!bg-muted !text-muted-foreground",
          },
        }}
      />
    </div>
    </TooltipProvider>
  )
}
