"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  CircleHelp,
  LogOut,
  PanelLeft,
  Search,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/components/auth/auth-context"
import { UserAvatar } from "@/components/auth/user-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  dashboardFlags,
  dashboardNav,
  isNavItemActive,
  type DashboardNavItem,
} from "@/components/dashboard/nav"
import { openDashboardCommandMenu } from "@/components/dashboard/command-menu"

const COLLAPSE_KEY = "spoo:sidebar-collapsed"

/** Wrap a row in a tooltip only when the rail is collapsed. */
function MaybeTip({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: React.ReactElement
}) {
  if (!collapsed) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function NavRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: DashboardNavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = isNavItemActive(pathname, item)
  return (
    <MaybeTip label={item.title} collapsed={collapsed}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-lg border border-transparent text-[13px] font-medium transition-colors duration-150",
          collapsed ? "justify-center px-0" : "px-2.5",
          active
            ? "border-border bg-card text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <item.icon className="size-[15px] shrink-0" strokeWidth={1.75} />
        {!collapsed && item.title}
      </Link>
    </MaybeTip>
  )
}

/**
 * Identity pill anchoring the rail (refs 09/13/15): avatar + name/email +
 * stepper chevron, opening the account menu (ref-18 anatomy).
 */
function ProfilePill({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  if (!user) return null
  const name = user.user_name?.trim() || user.email.split("@")[0]
  return (
    <DropdownMenu>
      <MaybeTip label={name} collapsed={collapsed}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-border bg-card hover:bg-accent/40 flex w-full items-center gap-2.5 rounded-lg border transition-colors duration-150",
              collapsed ? "justify-center border-transparent bg-transparent p-1" : "px-2.5 py-2",
            )}
          >
            <UserAvatar user={user} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="text-foreground block truncate text-[13px] font-medium">
                    {name}
                  </span>
                  <span className="text-muted-foreground block truncate text-[11px]">
                    {user.email}
                  </span>
                </span>
                <ChevronsUpDown className="text-muted-foreground/60 size-3.5 shrink-0" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
      </MaybeTip>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>
          <span className="text-foreground block truncate text-xs font-medium">{name}</span>
          <span className="text-muted-foreground block truncate text-[11px] font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => window.open("https://docs.spoo.me", "_blank")}
        >
          <CircleHelp />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void signOut().then(() => router.push("/login"))}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Sidebar content, shared by the desktop rail and the mobile sheet.
 * Measurements follow the ref-13 size guide: 16px horizontal padding,
 * 4px between nav rows, 16px above group labels / 8px below, a flexible
 * breathing zone before the pinned footer, half-height utility rows.
 */
export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  return (
    <div className={cn("flex h-full flex-col", collapsed ? "px-2.5" : "px-4")}>
      <div
        className={cn(
          "flex h-18 shrink-0 items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <span className="flex items-center gap-2">
            <Logo withText={false} href="/dashboard" className="size-6" />
            <span className="text-foreground text-[15px] font-semibold tracking-tight">
              spoo.me
            </span>
          </span>
        )}
        {onToggleCollapse && (
          <MaybeTip label="Expand sidebar" collapsed={collapsed}>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="text-muted-foreground/70 hover:text-foreground hover:bg-accent/60 flex size-7 items-center justify-center rounded-lg transition-colors duration-150"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
          </MaybeTip>
        )}
      </div>

      <MaybeTip label="Search ⌘K" collapsed={collapsed}>
        <button
          type="button"
          onClick={() => openDashboardCommandMenu()}
          aria-label="Search"
          className={cn(
            "border-border bg-card dark:bg-input/30 text-muted-foreground hover:text-foreground hover:bg-accent/40 dark:hover:bg-input/50 flex h-9 items-center gap-2 rounded-lg border text-[13px] transition-colors duration-150",
            collapsed ? "justify-center px-0" : "px-2.5",
          )}
        >
          <Search className="size-[15px] shrink-0" strokeWidth={1.75} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <span className="flex items-center gap-0.5">
                <kbd className="border-border/60 bg-muted/40 text-muted-foreground rounded border px-1 font-mono text-[10px]">
                  ⌘
                </kbd>
                <kbd className="border-border/60 bg-muted/40 text-muted-foreground rounded border px-1 font-mono text-[10px]">
                  K
                </kbd>
              </span>
            </>
          )}
        </button>
      </MaybeTip>

      <nav aria-label="Dashboard" className="mt-6">
        {dashboardNav.map((group, i) => {
          const items = group.items.filter(
            (item) => !item.flag || dashboardFlags[item.flag],
          )
          if (!items.length) return null
          return (
            <div key={group.label} className={cn(i > 0 && "mt-4")}>
              {collapsed ? (
                i > 0 && <div className="border-border/60 mx-2 mb-3 border-t" />
              ) : (
                <div className="label-mono text-muted-foreground/60 px-2.5 pb-2">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Breathing zone — the sidebar stays unfilled by design (ref 13). */}
      <div className="min-h-[90px] flex-1" />

      <div
        className={cn(
          "border-border/60 border-t py-4",
          collapsed ? "-mx-2.5 px-2.5" : "-mx-4 px-4",
        )}
      >
        <ProfilePill collapsed={collapsed} />
      </div>
    </div>
  )
}

/** Desktop rail. Hidden below lg; the topbar's menu opens the sheet instead. */
export function DashboardSidebar() {
  // The dashboard tree only renders client-side (auth gate), so reading
  // localStorage in the initializer is hydration-safe here.
  const [collapsed, setCollapsed] = React.useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(COLLAPSE_KEY) === "1",
  )

  const toggle = () => {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1")
      return !v
    })
  }

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-[58px]" : "w-60",
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={toggle} />
    </aside>
  )
}
