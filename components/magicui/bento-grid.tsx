"use client"

import { useInView } from "motion/react"
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

/**
 * Lattice bento — cells share hairlines via the gap-px trick: the grid's
 * border-tint background shows through 1px gaps between opaque cells.
 * Full-strength border so short gap segments stay crisp between busy cells.
 * Outer edges stay open; the frame's rails and rules provide them.
 */
const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "bg-border grid w-full auto-rows-[22rem] grid-cols-3 gap-px",
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
}: BentoCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  // Gate only the demo mount (lazy world map etc.) — the cell itself is
  // static: lattice cells don't fade or slide, they're part of the sheet.
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <div
      ref={ref}
      className={cn(
        "group bg-background relative col-span-1 flex flex-col justify-between overflow-hidden",
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
    </div>
  )
}

export { BentoCard, BentoGrid }
