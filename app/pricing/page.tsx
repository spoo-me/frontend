import type { Metadata } from "next"
import Link from "next/link"
import { Server } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { PricingTiers, PricingTable, PricingFaq } from "./pricing-client"

export const metadata: Metadata = {
  title: "Pricing that scales with you",
  description:
    "Start free, upgrade when your links do. Transparent plans for the hosted cloud, full feature parity if you self-host.",
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-16">
        <PageFrame>
          <Section caption="Pricing">
            <div className="px-5 pt-28 pb-20 sm:px-9">
              <SectionHeading
                title={
                  <>
                    Pricing that scales{" "}
                    <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
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

              <div className="border-border/60 bg-card/40 mt-16 flex flex-col items-center gap-4 rounded-2xl border p-8 text-center sm:flex-row sm:gap-6 sm:text-left">
                <Server className="text-muted-foreground size-8 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-foreground text-base font-semibold tracking-tight">
                    Need a fully managed deployment for your enterprise?
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Custom domains, SSO, audit logs, SLA. Talk to us about a managed
                    deployment on your VPC.
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
