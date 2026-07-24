import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Server } from "@/components/icons"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { PRICING_ENABLED } from "@/lib/flags"
import { PricingTiers, PricingTable, PricingFaq } from "./pricing-client"

export const metadata: Metadata = {
  title: "Pricing that scales with you",
  description:
    "Start free, upgrade when your links do. Transparent plans for the hosted cloud, full feature parity if you self-host.",
}

export default function PricingPage() {
  if (!PRICING_ENABLED) notFound()

  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Pricing">
            <div className="px-5 pt-28 pb-20 sm:px-9">
              <SectionHeading
                title={
                  <>
                    Pricing that scales{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
                      with you.
                    </span>
                  </>
                }
                description="Start free, upgrade when your links do. Every plan runs on the same open-source core."
              />
              <div className="mt-12">
                <PricingTiers />
              </div>
            </div>
          </Section>

          <Section caption="Compare plans">
            <div className="px-5 py-20 sm:px-9">
              <PricingTable />
            </div>
          </Section>

          <Section caption="Questions">
            <div className="px-5 py-20 sm:px-9">
              <PricingFaq />

              <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/40 p-8 text-center sm:flex-row sm:gap-6 sm:text-left">
                <Server className="size-8 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-foreground tracking-tight">
                    Need a fully managed deployment for your enterprise?
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Custom domains, SSO, audit logs, SLA. Talk to us about a
                    managed deployment on your VPC.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
