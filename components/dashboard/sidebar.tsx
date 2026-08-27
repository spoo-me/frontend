"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  BookOpen,
  ChevronsUpDown,
  LogOut,
  PanelLeft,
  Search,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"
import { BrandIcons } from "@/components/icons/brand-icons"
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
import {
  dashboardFlags,
  dashboardNav,
  isNavItemActive,
  type DashboardNavItem,
} from "@/components/dashboard/nav"
import { openDashboardCommandMenu } from "@/components/dashboard/command-menu"
import { useFeatures } from "@/hooks/use-features"

const COLLAPSE_KEY = "spoo:sidebar-collapsed"

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
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.title : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg font-medium text-[13px] transition-colors duration-150",
        collapsed ? "justify-center px-0" : "px-2.5",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          // Only route changes animate the pill (its actual job). Rail
          // expand/collapse resizes it natively via inset-0 — letting
          // the layout projection re-measure then would make it chase
          // the CSS width transition and rubber-band.
          layoutDependency={pathname}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 rounded-lg border border-border/50 bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        />
      )}
      <item.icon className="relative size-[15px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="relative">{item.title}</span>}
    </Link>
  )
}

function ResourceRow({
  href,
  icon: Icon,
  label,
  collapsed,
}: {
  href: string
  icon: React.ElementType
  label: string
  collapsed: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-lg text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground",
        collapsed ? "justify-center px-0" : "px-2.5"
      )}
    >
      <Icon className="size-[15px] shrink-0" />
      {!collapsed && label}
    </a>
  )
}

/**
 * Identity pill anchoring the rail (refs 09/13/15): avatar + name/email +
 * stepper chevron, opening the account menu (ref-18 anatomy).
 */
function ProfilePill({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  if (!user) return <div aria-hidden className="h-[52px]" />
  const name = user.user_name?.trim() || user.email.split("@")[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={collapsed ? name : undefined}
          className={cn(
            // Fixed height in both states: the peek animation stays a
            // pure horizontal reveal, nothing above the pill moves.
            "flex h-[52px] w-full items-center gap-2.5 rounded-lg border border-border bg-card transition-colors duration-150 hover:bg-accent/40",
            collapsed
              ? "justify-center border-transparent bg-transparent p-0"
              : "px-2.5"
          )}
        >
          <UserAvatar user={user} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium text-[13px] text-foreground">
                  {name}
                </span>
                <span className="ph-no-capture block truncate text-[11px] text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/60" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate font-medium text-foreground text-xs">
            {name}
          </span>
          <span className="ph-no-capture block truncate font-normal text-[11px] text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
          <Settings />
          Settings
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
  peeking = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean
  peeking?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const { features } = useFeatures()
  return (
    <div className={cn("flex h-full flex-col", collapsed ? "px-2.5" : "px-4")}>
      <div
        className={cn(
          "flex h-18 shrink-0 items-center",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <span className="flex items-center gap-2">
            <Logo withText={false} href="/dashboard" className="size-6" />
            <span className="font-semibold text-[15px] text-foreground tracking-tight">
              spoo.me
            </span>
          </span>
        )}
        {collapsed ? (
          // Collapsed rail at rest: just the mark. Hovering the rail peeks
          // the whole sidebar open, so the logo needs no second job.
          <Logo withText={false} href="/dashboard" className="size-6" />
        ) : (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={peeking ? "Pin sidebar open" : "Collapse sidebar"}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => openDashboardCommandMenu()}
        aria-label="Search"
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border border-transparent bg-foreground/6 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/9 hover:text-foreground",
          collapsed ? "justify-center px-0" : "px-2.5"
        )}
      >
        <Search className="size-[15px] shrink-0" strokeWidth={1.75} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search</span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded border border-transparent bg-background/70 px-1 font-mono text-[10px] text-muted-foreground">
                ⌘
              </kbd>
              <kbd className="rounded border border-transparent bg-background/70 px-1 font-mono text-[10px] text-muted-foreground">
                K
              </kbd>
            </span>
          </>
        )}
      </button>

      <nav aria-label="Dashboard" className="mt-6">
        {dashboardNav.map((group, i) => {
          const items = group.items.filter(
            (item) =>
              (!item.flag || dashboardFlags[item.flag]) &&
              (!item.feature || features?.[item.feature] === "enabled")
          )
          if (!items.length) return null
          return (
            <div key={group.label}>
              {/* Groups separate by a hairline, not a header — identical
                  in both rail states so rows never shift while the peek
                  animates. */}
              {i > 0 && (
                <div className="mx-2 my-2.5 border-border/60 border-t" />
              )}
              <div className="space-y-0.5">
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

      {/* Breathing zone — the sidebar stays unfilled by design. */}
      <div className="min-h-[90px] flex-1" />

      <div
        className={cn(
          "border-border/60 border-t py-4",
          collapsed ? "-mx-2.5 px-2.5" : "-mx-4 px-4"
        )}
      >
        <div className="mb-3 space-y-0.5">
          <ResourceRow
            href="https://spoo.me/docs"
            icon={BookOpen}
            label="Docs"
            collapsed={collapsed}
          />
          <ResourceRow
            href="https://spoo.me/discord"
            icon={BrandIcons.discord}
            label="Discord"
            collapsed={collapsed}
          />
        </div>
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
      localStorage.getItem(COLLAPSE_KEY) === "1"
  )

  // Hover-to-peek: the collapsed rail expands as an OVERLAY (the layout
  // spacer keeps its 58px, content never reflows). Intent delay going in,
  // grace going out, and the peek holds while a menu it spawned is open.
  const [peek, setPeek] = React.useState(false)
  const enterT = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveT = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const peekIn = () => {
    if (!collapsed) return
    if (leaveT.current) {
      clearTimeout(leaveT.current)
      leaveT.current = null
    }
    if (!peek && !enterT.current)
      enterT.current = setTimeout(() => {
        enterT.current = null
        setPeek(true)
      }, 180)
  }

  const peekOut = () => {
    if (enterT.current) {
      clearTimeout(enterT.current)
      enterT.current = null
    }
    if (!peek || leaveT.current) return
    const attempt = () => {
      // A dropdown spawned from the rail portals outside it; closing the
      // peek under an open menu would orphan it.
      if (document.querySelector('[data-state="open"][role="menu"]')) {
        leaveT.current = setTimeout(attempt, 300)
      } else {
        leaveT.current = null
        setPeek(false)
      }
    }
    leaveT.current = setTimeout(attempt, 250)
  }

  React.useEffect(
    () => () => {
      if (enterT.current) clearTimeout(enterT.current)
      if (leaveT.current) clearTimeout(leaveT.current)
    },
    []
  )

  const toggle = () => {
    setPeek(false)
    if (enterT.current) {
      clearTimeout(enterT.current)
      enterT.current = null
    }
    if (leaveT.current) {
      clearTimeout(leaveT.current)
      leaveT.current = null
    }
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1")
      return !v
    })
  }

  // ⌘B / Ctrl+B toggles the rail (the editor-muscle-memory shortcut).
  const toggleRef = React.useRef(toggle)
  toggleRef.current = toggle
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key?.toLowerCase() === "b" &&
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <aside
      className={cn(
        "relative hidden h-dvh shrink-0 transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-[58px]" : "w-60"
      )}
    >
      <div
        onMouseEnter={peekIn}
        onMouseLeave={peekOut}
        onFocusCapture={peekIn}
        onBlurCapture={peekOut}
        className={cn(
          collapsed
            ? cn(
                "absolute inset-y-0 left-0 z-40 border-r bg-canvas transition-[width,box-shadow,border-color] duration-200 ease-out",
                peek
                  ? "w-60 border-border/60 shadow-[8px_0_32px_-12px_rgba(0,0,0,0.18)] dark:shadow-[8px_0_32px_-12px_rgba(0,0,0,0.55)]"
                  : "w-[58px] border-transparent shadow-none"
              )
            : "h-full w-60"
        )}
      >
        <SidebarContent
          collapsed={collapsed && !peek}
          peeking={peek}
          onToggleCollapse={toggle}
        />
      </div>
    </aside>
  )
}
