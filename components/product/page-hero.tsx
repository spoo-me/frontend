import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Band } from "@/components/shared/section-shell"

/**
 * The product-page opener: one claim, one subhead, the standing CTA
 * pair. Bigger voice than a chapter's SectionHeading, quieter than the
 * landing hero — a page about one pillar, not the whole product.
 */
export function ProductPageHero({
  title,
  description,
  secondaryCta,
}: {
  title: ReactNode
  description: string
  /** Page-specific second button; defaults to nothing. */
  secondaryCta?: ReactNode
}) {
  return (
    <Band className="relative overflow-hidden px-5 pt-36 pb-24 text-center sm:px-9 sm:pt-44 sm:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_70%_70%_at_50%_30%,black,transparent)]"
      >
        <div className="absolute top-[-6rem] left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/signup">
              <Zap className="size-4" data-icon="inline-start" />
              Start free
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
          {secondaryCta}
        </div>
      </div>
    </Band>
  )
}
