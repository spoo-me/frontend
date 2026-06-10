"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUpRight, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
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
    <div className="relative px-5 py-24 sm:px-9 sm:py-28">
      <div>
        <SectionHeading
          title={
            <>
              An API your team will{" "}
              <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                actually enjoy.
              </span>
            </>
          }
          description="Predictable REST. Type-safe SDKs. Idiomatic clients in every language you ship in."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Code playground — editor file-tabs fused into the panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="relative self-start [--code-surface:var(--card)] dark:[--code-surface:#09090b]"
          >
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
                        ? "border-border/60 text-foreground z-10 -mb-px border-b-transparent bg-[var(--code-surface)]"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    {/* Wedge flares — the tab pours into the panel */}
                    {isActive && (
                      <>
                        <span
                          aria-hidden
                          className="absolute -left-2 bottom-0 size-2"
                          style={{
                            background:
                              "radial-gradient(circle at 0 0, transparent 0.5rem, var(--code-surface) 0.5rem)",
                          }}
                        />
                        <span
                          aria-hidden
                          className="absolute -right-2 bottom-0 size-2"
                          style={{
                            background:
                              "radial-gradient(circle at 100% 0, transparent 0.5rem, var(--code-surface) 0.5rem)",
                          }}
                        />
                      </>
                    )}
                    {Icon ? <Icon className="size-3" /> : null}
                    {FILE_NAMES[s.id] ?? s.label}
                  </button>
                )
              })}
            </div>

            {/* Code panel */}
            <div className="border-border/60 shadow-card relative overflow-hidden rounded-xl border bg-[var(--code-surface)] dark:shadow-2xl dark:shadow-black/40">
              <Button
                onClick={copy}
                size="icon-xs"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10"
                aria-label="Copy code"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
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
          </motion.div>

          {/* SDKs list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-foreground text-base font-semibold tracking-tight">
                Official SDKs
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
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
                      className="group border-border/60 bg-card/50 hover:bg-card hover:border-border flex items-center gap-3 rounded-lg border px-3 py-2.5 transition"
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
                        <div className="text-foreground text-sm font-medium">
                          {sdk.name}
                        </div>
                        {cmd && (
                          <code className="text-muted-foreground block truncate font-mono text-[11px]">
                            {cmd.command}
                          </code>
                        )}
                      </div>
                      <ArrowUpRight className="text-muted-foreground/40 group-hover:text-foreground size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}
