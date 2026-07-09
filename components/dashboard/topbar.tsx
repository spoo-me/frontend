"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, Menu, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { UserMenu } from "@/components/auth/user-menu"
import { SidebarContent } from "@/components/dashboard/sidebar"
import { dashboardNav } from "@/components/dashboard/nav"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { Kbd } from "@/components/dashboard/kbd"

const SEGMENT_TITLES: Record<string, string> = Object.fromEntries(
  dashboardNav.flatMap((g) =>
    g.items.map((i) => [i.href.split("/").pop() as string, i.title]),
  ),
)
SEGMENT_TITLES.settings = "Settings"

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean).slice(1) // drop "dashboard"
  const leaf = segments[0]
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
      <Link
        href="/dashboard"
        className={
          leaf
            ? "text-muted-foreground hover:text-foreground transition-colors duration-150"
            : "text-foreground font-medium"
        }
      >
        Dashboard
      </Link>
      {leaf && (
        <>
          <ChevronRight className="text-muted-foreground/50 size-3.5 shrink-0" />
          <span className="text-foreground truncate font-medium">
            {SEGMENT_TITLES[leaf] ?? leaf}
          </span>
        </>
      )}
    </div>
  )
}

export function DashboardTopbar() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  return (
    <header className="border-border/60 bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
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
        <SheetContent side="left" className="bg-sidebar w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" onClick={() => openLinkComposer()}>
          <Plus data-icon="inline-start" />
          New link
          <Kbd className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/80 ml-1">
            N
          </Kbd>
        </Button>
        <span className="lg:hidden">
          <UserMenu />
        </span>
      </div>
    </header>
  )
}
