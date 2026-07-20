"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ChartLine, Check, Copy } from "lucide-react"

import { trackRecentLinkClicked } from "@/lib/analytics"
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
      <ul className="divide-y divide-border/40 border-border/40 border-y">
        {links.slice(0, 3).map((l) => (
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
              href={`https://spoo.me/stats/${l.code}`}
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
    </motion.div>
  )
}
