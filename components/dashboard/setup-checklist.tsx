"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import {
  Check,
  ChevronDown,
  Globe2,
  KeyRound,
  Link2,
  ListChecks,
  Puzzle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  listApiKeys,
  listAppGrants,
  listCustomDomains,
  listUrls,
} from "@/lib/api"
import { openLinkComposer } from "@/components/dashboard/links/composer"

/**
 * Setup as a floating companion, not a page block: bottom-right card that
 * follows the user across the dashboard until the workspace is set up,
 * then disappears for good. Collapsible to a pill (remembered), done
 * items stay visible struck-through so progress reads as progress.
 */

const COLLAPSED_KEY = "spoo:setup-collapsed"
const COLLAPSED_EVENT = "spoo:setup-collapsed-change"

// localStorage mirror (use-analytics-layout pattern): render never guesses,
// the server snapshot is "collapsed" so hydration can't flash the card in.
const readCollapsed = () => localStorage.getItem(COLLAPSED_KEY) === "1"
function subscribeCollapsed(cb: () => void) {
  window.addEventListener("storage", cb)
  window.addEventListener(COLLAPSED_EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(COLLAPSED_EVENT, cb)
  }
}

export function SetupChecklist() {
  const urls = useQuery({
    queryKey: ["urls", "overview-scan"],
    queryFn: () =>
      listUrls({ pageSize: 100, sortBy: "created_at", sortOrder: "desc" }),
  })
  const domains = useQuery({ queryKey: ["domains"], queryFn: listCustomDomains })
  const keys = useQuery({ queryKey: ["keys"], queryFn: listApiKeys })
  const grants = useQuery({ queryKey: ["apps"], queryFn: listAppGrants })

  const collapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => true,
  )
  const toggle = () => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "0" : "1")
    window.dispatchEvent(new Event(COLLAPSED_EVENT))
  }

  const items = [
    {
      done: (urls.data?.total ?? 0) > 0,
      icon: Link2,
      label: "Create your first link",
      action: () => openLinkComposer(),
      cta: "Create",
    },
    {
      done:
        (domains.data?.items?.filter((d) => d.status === "ACTIVE").length ?? 0) > 0,
      icon: Globe2,
      label: "Connect a custom domain",
      href: "/dashboard/domains",
      cta: "Connect",
    },
    {
      done: (keys.data?.items?.filter((k) => !k.revoked).length ?? 0) > 0,
      icon: KeyRound,
      label: "Create an API key",
      href: "/dashboard/developer",
      cta: "Create",
    },
    {
      done: (grants.data?.items?.length ?? 0) > 0,
      icon: Puzzle,
      label: "Install an app or extension",
      href: "/dashboard/apps",
      cta: "Browse",
    },
  ]
  const doneCount = items.filter((i) => i.done).length
  const ready = Boolean(urls.data && domains.data && keys.data && grants.data)

  // Fully set up (or not yet known): the companion has no job.
  if (!ready || doneCount === items.length) return null

  return (
    <div className="fixed right-6 bottom-6 z-30 hidden sm:block">
      <AnimatePresence mode="popLayout" initial={false}>
        {collapsed ? (
          <motion.button
            key="pill"
            type="button"
            onClick={toggle}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="border-border/60 bg-popover/95 text-muted-foreground hover:text-foreground flex h-9 items-center gap-2 rounded-full border px-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-colors duration-150 dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]"
          >
            <ListChecks className="size-3.5" strokeWidth={1.75} />
            <span className="font-mono text-[11px] tabular-nums">
              setup {doneCount}/{items.length}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="border-border/60 bg-popover/95 w-80 rounded-2xl border shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]"
          >
            <div className="flex h-10 items-center gap-2 px-4">
              <span className="label-mono text-muted-foreground flex-1">
                Finish setting up
              </span>
              <span className="text-muted-foreground/70 font-mono text-[11px] tabular-nums">
                {doneCount}/{items.length}
              </span>
              <button
                type="button"
                aria-label="Collapse setup checklist"
                onClick={toggle}
                className="text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground flex size-6 items-center justify-center rounded-md transition-colors duration-150"
              >
                <ChevronDown className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="border-border/60 border-t px-2 py-1.5">
              {items.map((item) => (
                <div key={item.label} className="flex h-9 items-center gap-2.5 px-2">
                  {item.done ? (
                    <span className="bg-live/15 text-live flex size-4 shrink-0 items-center justify-center rounded-full">
                      <Check className="size-2.5" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="border-border/80 size-4 shrink-0 rounded-full border border-dashed" />
                  )}
                  <item.icon
                    className={cn(
                      "size-3.5 shrink-0",
                      item.done
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground/70",
                    )}
                    strokeWidth={1.75}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13px]",
                      item.done
                        ? "text-muted-foreground/60 line-through"
                        : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  {!item.done &&
                    (item.href ? (
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors duration-150"
                      >
                        {item.cta}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={item.action}
                        className="text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors duration-150"
                      >
                        {item.cta}
                      </button>
                    ))}
                </div>
              ))}
            </div>
            <div className="border-border/60 flex items-center gap-3 border-t px-4 py-2.5">
              <span className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-brand block h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${(doneCount / items.length) * 100}%` }}
                />
              </span>
              <span className="text-muted-foreground/70 font-mono text-[10px] tabular-nums">
                {Math.round((doneCount / items.length) * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
