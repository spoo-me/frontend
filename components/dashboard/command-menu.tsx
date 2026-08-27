"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Command as CommandPrimitive } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  BookOpen,
  CornerDownLeft,
  Globe,
  Keyboard,
  LayoutGrid,
  Link2,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { trackUiAction } from "@/lib/analytics"
import { listCustomDomains, listUrls } from "@/lib/api"
import { linkSheetParam } from "@/lib/link-detail"
import { faviconUrl } from "@/lib/favicon"
import { Logo } from "@/components/shared/logo"
import { dashboardFlags, dashboardNav } from "@/components/dashboard/nav"
import { useFeatures } from "@/hooks/use-features"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { openShortcutsHelp } from "@/components/dashboard/shortcuts-help"
import { requestAnalyticsEditMode } from "@/components/dashboard/analytics/edit-mode"

const OPEN_EVENT = "spoo:dashboard-command-menu"

/** Imperative opener so any chrome element (sidebar search, etc.) can summon ⌘K. */
export function openDashboardCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** G-then-key chords for nav items, keyed by href. Rendered AND functional. */
const CHORDS: Record<string, string> = {
  "/dashboard": "O",
  "/dashboard/links": "L",
  "/dashboard/analytics": "A",
  "/dashboard/domains": "D",
  "/dashboard/apps": "P",
  "/dashboard/developer": "K",
}
const chordLabel = (href: string) => `G ${CHORDS[href]}`

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mono text-[11px] text-muted-foreground/80 tracking-[0.2em]">
      {children}
    </kbd>
  )
}

function Item({
  onSelect,
  icon: Icon,
  chord,
  children,
}: {
  onSelect: () => void
  icon: React.ElementType
  chord?: string
  children: React.ReactNode
}) {
  return (
    <CommandPrimitive.Item
      onSelect={onSelect}
      className="flex h-10 cursor-default select-none items-center gap-3 rounded-lg px-2.5 text-sm data-[selected=true]:bg-accent/70"
    >
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
      />
      <span className="flex-1 text-foreground">{children}</span>
      {chord && <Kbd>{chord}</Kbd>}
    </CommandPrimitive.Item>
  )
}

function LinkFavicon({ url }: { url: string | null }) {
  const domain = React.useMemo(() => {
    if (!url) return null
    try {
      return new URL(url).hostname
    } catch {
      return null
    }
  }, [url])
  const [failed, setFailed] = React.useState(false)
  if (!domain || failed)
    return (
      <Link2
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
      />
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(domain, 32)}
      alt=""
      className="size-4 shrink-0 rounded-[4px]"
      onError={() => setFailed(true)}
    />
  )
}

export function DashboardCommandMenu() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const { features } = useFeatures()
  const domainsEnabled = features?.custom_domains === "enabled"
  const chordArmed = React.useRef<number | null>(null)

  // A reopened palette starts fresh; a stale query reads as a glitch.
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery("")
  }

  // Effect (not handleOpenChange) so direct setOpen(true) callers count too.
  React.useEffect(() => {
    if (open) trackUiAction("command_menu_opened")
  }, [open])

  const go = React.useCallback(
    (href: string) => {
      trackUiAction("command_executed", href)
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  // Dynamic results: real links (server search) and domains join the
  // palette once the query has shape. cmdk still scores/filters rows, so
  // the static commands and live data interleave under one ranking.
  const q = query.trim()
  const linkResults = useQuery({
    queryKey: ["urls", "palette", q],
    queryFn: () => listUrls({ pageSize: 5, filter: { search: q } }),
    enabled: open && q.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: open && domainsEnabled,
    staleTime: 60_000,
  })
  const domainResults =
    domainsEnabled && q.length >= 2
      ? (domainsQuery.data?.items ?? [])
          .filter((d) => d.fqdn.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 4)
      : []

  React.useEffect(() => {
    // G-then-letter chords are GLOBAL page shortcuts (GitHub/Linear style).
    // They stay off while any input is focused or the palette is open, so
    // they can never steal keystrokes from search typing.
    const typingTarget = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
        setQuery("")
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typingTarget(e.target)) return
      const dialogOpen = document.querySelector(
        "[role=dialog][data-state=open], [role=alertdialog][data-state=open]"
      )

      const now = Date.now()
      if (e.key === "g" || e.key === "G") {
        chordArmed.current = now
        return
      }
      // Bare-letter actions: only on a quiet page (no dialog, not typing).
      if (!dialogOpen && !chordArmed.current) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault()
          openLinkComposer()
          return
        }
        if (e.key === "/") {
          e.preventDefault()
          const search =
            document.querySelector<HTMLInputElement>("[data-page-search]")
          if (search) search.focus()
          else setOpen(true)
          return
        }
        if (e.key === "?") {
          e.preventDefault()
          openShortcutsHelp()
          return
        }
      }
      if (chordArmed.current && now - chordArmed.current < 800) {
        const hit = Object.entries(CHORDS).find(
          ([, key]) => key.toLowerCase() === e.key?.toLowerCase()
        )
        if (hit) {
          e.preventDefault()
          router.push(hit[0])
        }
      }
      chordArmed.current = null
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [router])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 z-50 bg-black/25 data-closed:animate-out data-open:animate-in dark:bg-black/50" />
        <DialogPrimitive.Content className="data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-[16%] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 outline-none data-closed:animate-out data-open:animate-in sm:max-w-xl">
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search the dashboard
          </DialogPrimitive.Description>

          <CommandPrimitive className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_-12px_rgba(0,0,0,0.18)] dark:bg-popover dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_16px_48px_-12px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2.5 px-4">
              <Search
                className="size-4 shrink-0 text-muted-foreground/70"
                strokeWidth={1.75}
              />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="mx-2 mb-1 rounded-xl border border-border/60 bg-popover dark:bg-secondary/50">
              <CommandPrimitive.List
                className={cn(
                  "max-h-[352px] overflow-y-auto overflow-x-hidden p-1.5",
                  "[mask-image:linear-gradient(to_bottom,black,black_calc(100%-16px),transparent)]"
                )}
              >
                <CommandPrimitive.Empty className="px-2.5 py-8 text-center text-muted-foreground text-sm">
                  no results
                </CommandPrimitive.Empty>

                <CommandPrimitive.Group>
                  <Item
                    icon={Plus}
                    chord="N"
                    onSelect={() => {
                      setOpen(false)
                      openLinkComposer()
                    }}
                  >
                    New link
                  </Item>
                  <Item
                    icon={LayoutGrid}
                    onSelect={() => {
                      setOpen(false)
                      // Land on analytics first; the page's listener flips it
                      // into edit mode once mounted.
                      if (window.location.pathname !== "/dashboard/analytics") {
                        router.push("/dashboard/analytics")
                        setTimeout(requestAnalyticsEditMode, 400)
                      } else {
                        requestAnalyticsEditMode()
                      }
                    }}
                  >
                    Edit dashboard layout
                  </Item>
                </CommandPrimitive.Group>

                {dashboardNav.map((group) => {
                  const items = group.items.filter(
                    (item) =>
                      (!item.flag || dashboardFlags[item.flag]) &&
                      (!item.feature || features?.[item.feature] === "enabled")
                  )
                  if (!items.length) return null
                  return (
                    <CommandPrimitive.Group
                      key={group.label}
                      heading={group.label}
                      className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs"
                    >
                      {items.map((item) => (
                        <Item
                          key={item.href}
                          icon={item.icon}
                          chord={
                            CHORDS[item.href]
                              ? chordLabel(item.href)
                              : undefined
                          }
                          onSelect={() => go(item.href)}
                        >
                          {item.title}
                        </Item>
                      ))}
                    </CommandPrimitive.Group>
                  )
                })}

                {q.length >= 2 && (linkResults.data?.items.length ?? 0) > 0 && (
                  <CommandPrimitive.Group
                    heading="Links"
                    className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs"
                  >
                    {linkResults.data!.items.map((l) => (
                      <CommandPrimitive.Item
                        key={l.id}
                        value={`${l.alias} ${l.long_url ?? ""} ${q}`}
                        onSelect={() =>
                          go(
                            `/dashboard/links?link=${encodeURIComponent(linkSheetParam(l))}`
                          )
                        }
                        className="flex h-10 cursor-default select-none items-center gap-3 rounded-lg px-2.5 text-sm data-[selected=true]:bg-accent/70"
                      >
                        <LinkFavicon url={l.long_url} />
                        <span className="shrink-0 font-mono text-foreground text-xs">
                          {l.domain ?? "spoo.me"}/{l.alias}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground/70 text-xs">
                          {(l.long_url ?? "").replace(/^https?:\/\//, "")}
                        </span>
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                )}

                {domainResults.length > 0 && (
                  <CommandPrimitive.Group
                    heading="Domains"
                    className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs"
                  >
                    {domainResults.map((d) => (
                      <CommandPrimitive.Item
                        key={d.id}
                        value={`${d.fqdn} ${q}`}
                        onSelect={() => go(`/dashboard/domains/${d.id}`)}
                        className="flex h-10 cursor-default select-none items-center gap-3 rounded-lg px-2.5 text-sm data-[selected=true]:bg-accent/70"
                      >
                        <Globe
                          className="size-4 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                        <span className="flex-1 font-mono text-foreground text-xs">
                          {d.fqdn}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 lowercase">
                          {d.status.toLowerCase()}
                        </span>
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                )}

                <CommandPrimitive.Group
                  heading="Help"
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs"
                >
                  <Item
                    icon={Keyboard}
                    chord="?"
                    onSelect={() => {
                      setOpen(false)
                      openShortcutsHelp()
                    }}
                  >
                    Keyboard shortcuts
                  </Item>
                  <Item
                    icon={BookOpen}
                    onSelect={() => {
                      setOpen(false)
                      window.open(
                        "https://spoo.me/docs/introduction",
                        "_blank",
                        "noreferrer"
                      )
                    }}
                  >
                    API docs
                  </Item>
                </CommandPrimitive.Group>

                <CommandPrimitive.Group
                  heading="Theme"
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs"
                >
                  <Item
                    icon={Sun}
                    onSelect={() => {
                      trackUiAction("command_executed", "theme:light")
                      setOpen(false)
                      setTheme("light")
                    }}
                  >
                    Light
                  </Item>
                  <Item
                    icon={Moon}
                    onSelect={() => {
                      trackUiAction("command_executed", "theme:dark")
                      setOpen(false)
                      setTheme("dark")
                    }}
                  >
                    Dark
                  </Item>
                  <Item
                    icon={Monitor}
                    onSelect={() => {
                      trackUiAction("command_executed", "theme:system")
                      setOpen(false)
                      setTheme("system")
                    }}
                  >
                    System
                  </Item>
                </CommandPrimitive.Group>
              </CommandPrimitive.List>
            </div>

            <div className="flex h-9 items-center justify-between px-3.5 text-muted-foreground">
              <Logo withText={false} className="size-4 opacity-60 grayscale" />
              <span className="flex items-center gap-1.5 text-xs">
                Go to page
                <span className="flex size-5 items-center justify-center rounded border border-border/60 bg-muted/50">
                  <CornerDownLeft className="size-3" />
                </span>
              </span>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
