"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowUpRight, Check, Copy } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { DeployDiagram } from "./deploy-diagram"

const DOCKER_CMD = "docker run -p 8000:8000 ghcr.io/spoo-me/spoo:latest"

export function SelfHostClient() {
  const [copied, setCopied] = React.useState(false)
  const [pulse, setPulse] = React.useState(false)
  const terminalRef = React.useRef<HTMLDivElement>(null)

  async function copy() {
    await navigator.clipboard.writeText(DOCKER_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function focusTerminal() {
    terminalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    setPulse(true)
    setTimeout(() => setPulse(false), 1800)
  }

  return (
    <>
      {/* Header band — heading + CTAs share the cell */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          align="center"
          title={
            <>
              Run spoo.me on{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                your own metal.
              </span>
            </>
          }
          description="The entire stack is open source: back it with your own database, deploy on your VPS, ship to a Kubernetes cluster. Your data. Your domain."
        />

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-10 px-4">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <BrandIcons.github className="size-4" data-icon="inline-start" />
              Star on GitHub
              <ArrowUpRight className="size-3.5" data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-10 px-4">
            <a
              href={`${siteConfig.links.docs}/self-hosting/introduction`}
              target="_blank"
              rel="noreferrer"
            >
              Read the deploy guide
            </a>
          </Button>
        </div>
      </Band>

      {/* Deploy band — diagram + docker one-liner share the cell */}
      <Band rule className="px-5 py-16 sm:px-9 sm:py-20">
        <div
          aria-hidden
          className="pattern-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <DeployDiagram onDockerClick={focusTerminal} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto mt-16 max-w-xl"
        >
          <div
            ref={terminalRef}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 font-mono text-sm shadow-soft ring-offset-background transition-all duration-500 dark:bg-zinc-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              pulse &&
                "border-emerald-500/60 shadow-[0_0_0_4px_rgba(16,185,129,0.18),0_0_30px_rgba(16,185,129,0.25)]"
            )}
          >
            <span className="select-none text-emerald-500">$</span>
            <code className="flex-1 truncate">
              <span className="text-orange-400">docker run</span>
              <span className="text-muted-foreground"> -p </span>
              <span className="text-foreground/90">8000:8000</span>
              <span className="text-muted-foreground">
                {" "}
                ghcr.io/spoo-me/spoo:latest
              </span>
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy command"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
          <p className="mt-4 text-center text-xs">
            <a
              href={`${siteConfig.links.docs}/self-hosting/docker-deployment`}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              full guide
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </p>
        </motion.div>
      </Band>
    </>
  )
}
