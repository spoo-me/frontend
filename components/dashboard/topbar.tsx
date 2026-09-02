"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Menu, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/dashboard/sidebar"
import { dashboardNav } from "@/components/dashboard/nav"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { Kbd } from "@/components/dashboard/kbd"

const SEGMENT_TITLES: Record<string, string> = Object.fromEntries(
  dashboardNav.flatMap((g) =>
    g.items.map((i) => [i.href.split("/").pop() as string, i.title])
  )
)
SEGMENT_TITLES.settings = "Settings"

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean).slice(1) // drop "dashboard"
  const leaf = segments[0]
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
      {/* Below sm the root crumb yields its room to the leaf — "Analytics",
          not "Dashboard > Anal…". The sheet already links back to Overview. */}
      <Link
        href="/dashboard"
        className={
          leaf
            ? "text-muted-foreground transition-colors duration-150 hover:text-foreground max-sm:hidden"
            : "font-medium text-foreground"
        }
      >
        Dashboard
      </Link>
      {leaf && (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50 max-sm:hidden" />
          <span className="truncate font-medium text-foreground">
            {SEGMENT_TITLES[leaf] ?? leaf}
          </span>
        </>
      )}
    </div>
  )
}

export function DashboardTopbar() {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  // The overview carries its own create box; two primary buttons in one
  // viewport would fight. Every other page keeps the topbar entry point.
  const onOverview = usePathname() === "/dashboard"

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-border/60 border-b bg-background px-4 sm:px-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            className="lg:hidden"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2">
        {!onOverview && (
          <Button onClick={() => openLinkComposer()}>
            <Plus data-icon="inline-start" />
            New link
            {/* Keyboard hint means nothing on touch and eats breadcrumb room. */}
            <Kbd className="ml-1 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/80 max-sm:hidden">
              N
            </Kbd>
          </Button>
        )}
        {/* No avatar here: the account menu lives in the sidebar on desktop
            and in the same sidebar (as the sheet) on mobile — one home. */}
      </div>
    </header>
  )
}
