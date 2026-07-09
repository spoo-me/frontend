"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"
import {
  ArrowUpRight,
  Calendar,
  Filter,
  Globe2,
  Layers,
  LineChart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
import { siteConfig } from "@/lib/site-config"

const callouts = [
  {
    icon: LineChart,
    title: "Per-link dashboards",
    description:
      "Open any short link and get a complete time series — clicks, unique visitors, conversion windows.",
  },
  {
    icon: Filter,
    title: "Slice by anything",
    description:
      "Filter by country, city, device, browser, OS, referrer, UTM. Combine filters arbitrarily deep.",
  },
  {
    icon: Globe2,
    title: "Geo heatmaps",
    description:
      "World-level click distribution out of the box. Ideal for global launches and campaign attribution.",
  },
  {
    icon: Calendar,
    title: "Time-window controls",
    description:
      "Hour / day / week / month / custom range. Saved views per workspace.",
  },
]

export function Analytics() {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"])
  const rotate = useTransform(scrollYProgress, [0, 1], [-1, 1])

  return (
    <section id="analytics" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={
            <>
              <Layers className="size-3" /> Advanced analytics
            </>
          }
          title={
            <>
              Click insights without{" "}
              <span className="text-muted-foreground italic font-serif font-normal">
                a separate tool.
              </span>
            </>
          }
          description="A real analytics product, included free in every link. No third-party scripts. No cookie banners."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6 lg:order-1">
            {callouts.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex gap-4"
              >
                <span className="border-border/60 bg-background text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <c.icon className="size-4" />
                </span>
                <div>
                  <h4 className="text-foreground text-sm font-semibold tracking-tight">
                    {c.title}
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </motion.div>
            ))}
            <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
              <a href={siteConfig.app.dashboard} target="_blank" rel="noreferrer">
                See live demo
                <ArrowUpRight className="size-3.5" data-icon="inline-end" />
              </a>
            </Button>
          </div>

          <motion.div
            ref={ref}
            style={{ y, rotate }}
            className="relative lg:order-2"
          >
            <div className="relative">
              {/* dashboard screenshot */}
              <div className="border-border/60 bg-card relative overflow-hidden rounded-xl border shadow-2xl">
                <div className="border-border/60 flex items-center gap-1.5 border-b px-3 py-2">
                  <span className="bg-muted size-2.5 rounded-full" />
                  <span className="bg-muted size-2.5 rounded-full" />
                  <span className="bg-muted size-2.5 rounded-full" />
                  <span className="text-muted-foreground ml-3 font-mono text-xs">
                    spoo.me/dashboard
                  </span>
                </div>
                <Image
                  src="/demos/stats_demo.jpeg"
                  alt="spoo.me analytics dashboard"
                  width={1600}
                  height={1000}
                  className="h-auto w-full"
                  priority={false}
                />
              </div>

              {/* secondary screenshot floating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="border-border/60 bg-card absolute -bottom-6 -left-6 hidden w-48 overflow-hidden rounded-lg border shadow-xl sm:block"
              >
                <Image
                  src="/demos/geo_stats_demo.jpeg"
                  alt="Geo distribution"
                  width={400}
                  height={260}
                  className="h-auto w-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="border-border/60 bg-card absolute -top-4 -right-4 hidden w-44 overflow-hidden rounded-lg border shadow-xl sm:block"
              >
                <Image
                  src="/demos/time_filter_demo.jpeg"
                  alt="Time-window filter"
                  width={400}
                  height={260}
                  className="h-auto w-full"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
