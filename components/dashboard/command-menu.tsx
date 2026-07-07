"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"
import { CornerDownLeft, Monitor, Moon, Plus, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"
import { dashboardFlags, dashboardNav } from "@/components/dashboard/nav"
import { openLinkComposer } from "@/components/dashboard/links/composer"

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

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="text-muted-foreground/80 font-mono text-[11px] tracking-[0.2em]">
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
      className="data-[selected=true]:bg-accent/70 flex h-10 cursor-default items-center gap-3 rounded-lg px-2.5 text-sm select-none"
    >
      <Icon className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
      <span className="text-foreground flex-1">{children}</span>
      {chord && <Kbd>G {chord}</Kbd>}
    </CommandPrimitive.Item>
  )
}

export function DashboardCommandMenu() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const chordArmed = React.useRef<number | null>(null)

  const go = React.useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

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
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typingTarget(e.target)) return

      const now = Date.now()
      if (e.key === "g" || e.key === "G") {
        chordArmed.current = now
        return
      }
      if (chordArmed.current && now - chordArmed.current < 800) {
        const hit = Object.entries(CHORDS).find(
          ([, key]) => key.toLowerCase() === e.key.toLowerCase(),
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
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/25 dark:bg-black/50" />
        <DialogPrimitive.Content
          className="data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-[16%] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 outline-none sm:max-w-xl"
        >
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search the dashboard
          </DialogPrimitive.Description>

          <CommandPrimitive className="border-border/60 bg-muted dark:bg-popover flex flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_16px_48px_-12px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2.5 px-4">
              <Search
                className="text-muted-foreground/70 size-4 shrink-0"
                strokeWidth={1.75}
              />
              <CommandPrimitive.Input
                placeholder="Type a command or search…"
                className="placeholder:text-muted-foreground/60 h-12 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="border-border/60 bg-popover dark:bg-secondary/50 mx-2 mb-2 rounded-xl border">
              <CommandPrimitive.List
                className={cn(
                  "max-h-[352px] overflow-x-hidden overflow-y-auto p-1.5",
                  "[mask-image:linear-gradient(to_bottom,black,black_calc(100%-16px),transparent)]",
                )}
              >
                <CommandPrimitive.Empty className="text-muted-foreground px-2.5 py-8 text-center text-sm">
                  No results.
                </CommandPrimitive.Empty>

                <CommandPrimitive.Group>
                  <Item
                    icon={Plus}
                    onSelect={() => {
                      setOpen(false)
                      openLinkComposer()
                    }}
                  >
                    New link
                  </Item>
                </CommandPrimitive.Group>

                {dashboardNav.map((group) => {
                  const items = group.items.filter(
                    (item) => !item.flag || dashboardFlags[item.flag],
                  )
                  if (!items.length) return null
                  return (
                    <CommandPrimitive.Group
                      key={group.label}
                      heading={group.label}
                      className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs"
                    >
                      {items.map((item) => (
                        <Item
                          key={item.href}
                          icon={item.icon}
                          chord={CHORDS[item.href]}
                          onSelect={() => go(item.href)}
                        >
                          {item.title}
                        </Item>
                      ))}
                    </CommandPrimitive.Group>
                  )
                })}

                <CommandPrimitive.Group
                  heading="Theme"
                  className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs"
                >
                  <Item
                    icon={Sun}
                    onSelect={() => {
                      setOpen(false)
                      setTheme("light")
                    }}
                  >
                    Light
                  </Item>
                  <Item
                    icon={Moon}
                    onSelect={() => {
                      setOpen(false)
                      setTheme("dark")
                    }}
                  >
                    Dark
                  </Item>
                  <Item
                    icon={Monitor}
                    onSelect={() => {
                      setOpen(false)
                      setTheme("system")
                    }}
                  >
                    System
                  </Item>
                </CommandPrimitive.Group>
              </CommandPrimitive.List>
            </div>

            <div className="text-muted-foreground flex h-10 items-center justify-between px-3.5 pb-1">
              <Logo withText={false} className="size-4 opacity-60 grayscale" />
              <span className="flex items-center gap-1.5 text-xs">
                Go to page
                <span className="border-border/60 bg-muted/50 flex size-5 items-center justify-center rounded border">
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
