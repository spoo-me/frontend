"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InstantShortener } from "@/components/sections/instant-shortener"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
      {/* Aurora — layered brand-tint blobs, slow drift */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,black,transparent)]"
      >
        <motion.div
          className="absolute top-[55%] left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B5CF6]/25 blur-3xl"
          animate={{ x: [0, 40, -20, 0], y: [0, -25, 15, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[15%] right-[10%] size-[28rem] rounded-full bg-indigo-500/15 blur-3xl"
          animate={{ x: [0, -30, 20, 0], y: [0, 30, -10, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[18%] left-[8%] size-[22rem] rounded-full bg-rose-500/10 blur-3xl"
          animate={{ x: [0, 25, -15, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative w-full px-5 sm:px-9">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.05 },
            },
          }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-6xl md:text-7xl"
          >
            The link platform
            <br />
            <span className="font-normal text-muted-foreground italic [font-family:var(--font-serif)]">
              built for developers.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            Free, open-source link management platform with advanced analytics,
            an API-first design, and an entire ecosystem of apps and SDKs.
            Self-hostable in one command.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-8 flex w-full max-w-lg flex-col items-stretch gap-3"
          >
            <InstantShortener />
            <p className="text-muted-foreground text-xs">
              No sign-up required. Try it right here.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="h-10 px-4">
              <Link href="/signup">
                <Zap className="size-4" data-icon="inline-start" />
                Start free
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 px-4">
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
              >
                <BrandIcons.github
                  className="size-4"
                  data-icon="inline-start"
                />
                View on GitHub
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
