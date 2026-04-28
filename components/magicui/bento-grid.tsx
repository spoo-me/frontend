"use client"

import { ArrowRightIcon } from "@radix-ui/react-icons"
import { motion, useInView } from "motion/react"
import { ComponentPropsWithoutRef, ReactNode, useRef } from "react"

import { Button } from "@/components/ui/button"
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
  href: string
  cta: string
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
  href,
  cta,
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
        "group border-border/60 bg-card/40 hover:border-border/90 relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors",
        className,
      )}
    >
      <div>{inView ? background : null}</div>
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-5 transition-all duration-300 group-hover:-translate-y-8">
        <Icon className="text-muted-foreground size-5 origin-left transform-gpu transition-all duration-300 ease-in-out" />
        <h3 className="text-foreground mt-2 text-base font-semibold tracking-tight">
          {name}
        </h3>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          {description}
        </p>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 z-10 flex w-full translate-y-6 transform-gpu flex-row items-center px-3 pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        <Button variant="ghost" asChild size="sm" className="pointer-events-auto h-7 px-2 text-xs">
          <a href={href}>
            {cta}
            <ArrowRightIcon className="ms-1 h-3 w-3 rtl:rotate-180" />
          </a>
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-foreground/[.02]" />
    </motion.div>
  )
}

export { BentoCard, BentoGrid }
