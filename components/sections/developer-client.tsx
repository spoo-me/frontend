"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUpRight, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"
import { sdks } from "@/lib/apps-data"
import type { HighlightedSample } from "@/lib/code-samples"

const DEVICON_MAP: Record<string, string> = {
  python: "python",
  typescript: "typescript",
  rust: "rust",
  go: "go",
  cpp: "cplusplus",
}

/* Tabs read as files, like an editor */
const FILE_NAMES: Record<string, string> = {
  python: "shorten.py",
  ts: "shorten.ts",
  rust: "shorten.rs",
  go: "shorten.go",
  curl: "shorten.sh",
}

export function DeveloperClient({ samples }: { samples: HighlightedSample[] }) {
  const [active, setActive] = React.useState(samples[0].id)
  const [copied, setCopied] = React.useState(false)
  const sample = samples.find((s) => s.id === active)!

  async function copy() {
    await navigator.clipboard.writeText(sample.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          title={
            <>
              An API your team will{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                actually enjoy.
              </span>
            </>
          }
          description="Predictable REST. Type-safe SDKs. Idiomatic clients in every language you ship in."
        />
      </Band>

      {/* Split band — playground and SDK list as lattice cells; the gap-px
          line spans the full band height down to the next rule */}
      <Band rule>
        <div className="grid gap-px bg-border lg:grid-cols-[1.4fr_1fr]">
          {/* Code playground — editor file-tabs fused into the panel */}
          <div className="relative bg-background p-5 [--code-surface:var(--card)] sm:p-9 dark:[--code-surface:#09090b]">
            {/* File tabs — no overflow container here, it would trap the -mb-px fusion */}
            <div className="flex flex-wrap items-end gap-0.5 px-3">
              {samples.map((s) => {
                const Icon = s.iconKey ? BrandIcons[s.iconKey] : null
                const isActive = active === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    aria-selected={isActive}
                    className={cn(
                      "relative inline-flex shrink-0 items-center gap-1.5 rounded-t-lg border px-3 py-2 font-mono text-xs transition-colors",
                      isActive
                        ? "z-10 -mb-px border-border/60 border-b-transparent bg-[var(--code-surface)] text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon ? <Icon className="size-3" /> : null}
                    {FILE_NAMES[s.id] ?? s.label}
                  </button>
                )
              })}
            </div>

            {/* Code panel */}
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-[var(--code-surface)] shadow-card dark:shadow-2xl dark:shadow-black/40">
              <Button
                onClick={copy}
                size="icon-xs"
                variant="ghost"
                className="absolute top-2.5 right-2.5 z-10 text-muted-foreground hover:text-foreground"
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
              {/* Subtle inner glow — gives terminal depth */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 z-0 h-64 w-[120%] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-400/[0.04]"
              />
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={sample.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="shiki-host code-numbered h-[22rem] overflow-auto px-5 py-6 pb-10 text-[13px] leading-relaxed [scrollbar-width:thin]"
                    dangerouslySetInnerHTML={{ __html: sample.html }}
                  />
                </AnimatePresence>
                {/* Bottom fade — soft termination */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--code-surface)] to-transparent"
                />
              </div>
            </div>
          </div>

          {/* SDKs list */}
          <div className="space-y-4 bg-background p-5 sm:p-8">
            <div>
              <h3 className="font-semibold text-base text-foreground tracking-tight">
                Official SDKs
              </h3>
              <p className="mt-1 text-muted-foreground text-sm">
                One-line install. Type-safe. Edge-ready where applicable.
              </p>
            </div>
            <ul className="space-y-2">
              {sdks.map((sdk) => {
                const cmd = sdk.install?.[0]
                const deviconSlug = DEVICON_MAP[sdk.iconKey] ?? sdk.iconKey
                return (
                  <li key={sdk.slug}>
                    <Link
                      href={`/apps/${sdk.slug}`}
                      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 transition hover:border-border hover:bg-card"
                    >
                      <span className="flex size-7 items-center justify-center rounded-md transition-transform group-hover:scale-110">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${deviconSlug}/${deviconSlug}-original.svg`}
                          alt=""
                          className="size-5"
                          loading="lazy"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground text-sm">
                          {sdk.name}
                        </div>
                        {cmd && (
                          <code className="block truncate font-mono text-[11px] text-muted-foreground">
                            {cmd.command}
                          </code>
                        )}
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={siteConfig.links.docs} target="_blank" rel="noreferrer">
                Read the API reference
                <ArrowUpRight className="size-3.5" data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </Band>
    </>
  )
}
