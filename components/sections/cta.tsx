"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export function CTA() {
  return (
    <div className="relative px-5 py-24 sm:px-9 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-border/60 relative overflow-hidden rounded-2xl border px-6 py-16 text-center sm:py-24"
      >
        {/* Aurora echo — mirrors the hero glow, clipped inside the panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_100%,black,transparent)]"
        >
          <div className="bg-brand/20 absolute bottom-[-12rem] left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pattern-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-foreground text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Stop paying for{" "}
            <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
              link management.
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-balance text-base sm:text-lg">
            spoo.me is free, open source, and built to grow with you. From a single
            link to 100M clicks, same product, no upsell.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-10 px-4">
              <Link href="/signup">
                <Zap className="size-4" data-icon="inline-start" />
                Start free
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 px-4">
              <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
                <BrandIcons.github className="size-4" data-icon="inline-start" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
