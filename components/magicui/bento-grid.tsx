"use client"

import { motion, useInView } from "motion/react"
import { ComponentPropsWithoutRef, ReactNode, useRef } from "react"

import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href?: string
  cta?: string
  index?: number
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-3 md:gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  index = 0,
}: BentoCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className={cn(
        "group border-border/60 bg-card/40 hover:border-border/90 shadow-card relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors dark:shadow-none",
        className,
      )}
    >
      <div>{inView ? background : null}</div>
      <div className="pointer-events-none z-10 flex flex-col gap-1 p-5">
        <Icon className="text-muted-foreground size-5" />
        <h3 className="text-foreground mt-2 text-base font-semibold tracking-tight">
          {name}
        </h3>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          {description}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-foreground/[.02]" />
    </motion.div>
  )
}

export { BentoCard, BentoGrid }
