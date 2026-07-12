"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: React.ReactNode
  /** chapter number rendered as a bracketed mono prefix: [01] */
  num?: string
  /** mono chapter caption set beside the number: [01] ANALYTICS */
  caption?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  num,
  caption,
  title,
  description,
  align = "center",
  className,
}: Props) {
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
      {caption && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.4 }}
          className="label-mono mb-1 text-muted-foreground"
        >
          {num && (
            <span className="text-muted-foreground/50">
              [<span className="text-muted-foreground/80"> {num} </span>]{" "}
            </span>
          )}
          {caption}
        </motion.span>
      )}
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
      <motion.h2
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
      </motion.h2>
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
