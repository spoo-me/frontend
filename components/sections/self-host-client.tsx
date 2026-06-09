"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowUpRight, Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
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
    <div className="relative px-5 py-24 sm:px-9 sm:py-32">
      <div
        aria-hidden
        className="pattern-dots pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]"
      />
      <div>
        <SectionHeading
          align="center"
          title={
            <>
              Run spoo.me on{" "}
              <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                your own metal.
              </span>
            </>
          }
          description="Free isn't a tier. The entire stack is open source: back it with your own database, deploy on your VPS, ship to a Kubernetes cluster. Your data. Your domain."
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-24"
        >
          <DeployDiagram onDockerClick={focusTerminal} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-20 max-w-xl"
        >
          <div
            ref={terminalRef}
            className={cn(
              "border-border/60 bg-background dark:bg-zinc-950 ring-offset-background flex items-center gap-3 rounded-xl border px-4 py-3 font-mono text-sm shadow-sm transition-all duration-500",
              pulse &&
                "shadow-[0_0_0_4px_rgba(16,185,129,0.18),0_0_30px_rgba(16,185,129,0.25)] border-emerald-500/60",
            )}
          >
            <span className="text-emerald-500 select-none">$</span>
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
              className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            or use{" "}
            <code className="bg-muted/60 text-foreground/80 rounded px-1.5 py-0.5 font-mono text-[11px]">
              docker compose up
            </code>{" "}
            with the included{" "}
            <code className="bg-muted/60 text-foreground/80 rounded px-1.5 py-0.5 font-mono text-[11px]">
              compose.yml
            </code>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
