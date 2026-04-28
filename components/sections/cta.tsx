"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Particles } from "@/components/ui/particles"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={60}
        ease={80}
        color="#ffffff"
        refresh
      />

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-foreground text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          Stop paying for{" "}
          <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
            link management.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground mx-auto mt-5 max-w-xl text-balance text-base sm:text-lg"
        >
          spoo.me is free, open source, and built to grow with you. From a single link
          to 100M clicks — same product, no upsell.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/signup">
              Get started free
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-5">
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              <BrandIcons.github className="size-4" data-icon="inline-start" />
              Star on GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
