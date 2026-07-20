"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ChartLine, Check, Copy } from "lucide-react"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  trackManagePitchClicked,
  trackRecentLinkClicked,
} from "@/lib/analytics"
import {
  onRecentLinksChanged,
  readRecentLinks,
  type RecentLink,
} from "@/lib/recent-links"

/**
 * The anonymous retention loop: links made on this device, still here on
 * the next visit. Renders nothing until history exists, and sits at the
 * end of the hero column so its appearance never reflows what's above.
 */
export function RecentLinksShelf() {
  const [links, setLinks] = React.useState<RecentLink[]>([])
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLinks(readRecentLinks())
    return onRecentLinksChanged(() => setLinks(readRecentLinks()))
  }, [])

  if (links.length === 0) return null

  async function copy(link: RecentLink) {
    await navigator.clipboard.writeText(link.short)
    trackRecentLinkClicked("copy")
    setCopiedCode(link.code)
    setTimeout(() => setCopiedCode(null), 1600)
  }

  const visible = links.slice(0, 3)
  const overflow = links.slice(3, 5)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-10 w-full max-w-lg"
    >
      <div className="label-mono mb-2 text-left text-muted-foreground/70">
        your recent links
      </div>
      <ul className="divide-y divide-border/40 border-border/40 border-t">
        {visible.map((l) => (
          <li key={l.code} className="group flex h-9 items-center gap-3">
            <a
              href={l.short}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackRecentLinkClicked("open")}
              className="shrink-0 font-medium font-mono text-foreground/90 text-xs transition-colors hover:text-foreground"
            >
              {l.short.replace(/^https?:\/\//, "")}
            </a>
            <span className="min-w-0 flex-1 truncate text-left text-muted-foreground/60 text-xs">
              {l.original.replace(/^https?:\/\//, "")}
            </span>
            <a
              href={`/stats/${l.code}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackRecentLinkClicked("stats")}
              aria-label={`Stats for ${l.short}`}
              className="text-muted-foreground/50 opacity-0 transition-all duration-150 hover:text-foreground group-hover:opacity-100"
            >
              <ChartLine className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={() => copy(l)}
              aria-label={`Copy ${l.short}`}
              className="text-muted-foreground/50 opacity-0 transition-all duration-150 hover:text-foreground group-hover:opacity-100"
            >
              {copiedCode === l.code ? (
                <Check className="size-3.5 text-live" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </li>
        ))}
      </ul>
      {overflow.length > 0 ? (
        /* The rest pours under a fade, the dashboard-preview move: the
           list keeps going, an account is how you keep up with it. */
        <div className="relative">
          <ul
            aria-hidden
            className="pointer-events-none divide-y divide-border/40 border-border/40 border-t [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
          >
            {overflow.map((l) => (
              <li key={l.code} className="flex h-9 items-center gap-3">
                <span className="shrink-0 font-medium font-mono text-foreground/90 text-xs">
                  {l.short.replace(/^https?:\/\//, "")}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-muted-foreground/60 text-xs">
                  {l.original.replace(/^https?:\/\//, "")}
                </span>
              </li>
            ))}
          </ul>
          <div className="absolute inset-0 flex items-center justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/login" onClick={() => trackManagePitchClicked()}>
                Sign in to manage all
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-border/40 border-t" />
      )}
    </motion.div>
  )
}
