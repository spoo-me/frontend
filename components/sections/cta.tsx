"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export function CTA() {
  return (
    <Band className="px-6 py-24 text-center sm:py-32">
      {/* Hatched gutters — the drafting margin fills in beside the closing band */}
      <GutterHatch />

      {/* Aurora echo — mirrors the hero glow; clipped to a box wider than the
          frame so the bloom visibly bleeds across the rails */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-40 inset-y-0 overflow-hidden [mask-image:radial-gradient(ellipse_70%_80%_at_50%_100%,black,transparent)]"
      >
        <div className="absolute bottom-[-12rem] left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
      </div>
      <div
        aria-hidden
        className="pattern-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto max-w-2xl"
      >
        <h2 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          From one link{" "}
          <span className="font-normal font-serif text-muted-foreground italic">
            to a hundred million.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          spoo.me is open source, analytics-first, and built to grow with you.
          The product you start with is the product at scale.
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
      </motion.div>
    </Band>
  )
}
