"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type Props = {
  /** A page's own hero heading is its h1; every other use stays an h2. */
  level?: 1 | 2
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  level = 2,
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: Props) {
  const Heading = level === 1 ? motion.h1 : motion.h2
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 font-medium text-muted-foreground text-xs"
        >
          {eyebrow}
        </motion.span>
      )}
      <Heading
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={cn(
          "text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl",
          align === "center" ? "max-w-2xl" : "max-w-3xl"
        )}
      >
        {title}
      </Heading>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className={cn(
            "max-w-2xl text-balance text-base text-muted-foreground sm:text-lg",
            align === "center" ? "mx-auto" : ""
          )}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
