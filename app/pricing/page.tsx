import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Band, PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { type FaqItem, FaqJsonLd, FaqList } from "@/components/shared/faq"
import { BrandIcons } from "@/components/icons/brand-icons"
import { Button } from "@/components/ui/button"
import { PRICING_ENABLED } from "@/lib/flags"
import { siteConfig } from "@/lib/site-config"
import { PricingTable, PricingTiers } from "./pricing-client"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free for every link and every click. Pro for your domain, your preview card and your routing rules. Self-host for free with full parity.",
}

const FAQ: FaqItem[] = [
  {
    q: "Can I get a refund?",
    a: "Yes. Any payment, monthly or one year, can be refunded within 14 days. Write to support@spoo.me from the account's email address.",
  },
  {
    q: "What does the founding price mean?",
    a: "While the founding window is open, Pro is discounted for a limited number of accounts. The price you join at stays yours for as long as you stay subscribed. If the subscription lapses, the regular price applies when you come back.",
  },
  {
    q: "Does the one year option renew?",
    a: "No. You pay once for twelve months. We email you before it ends and you decide whether to pay again. Nothing is charged on its own.",
  },
  {
    q: "What happens when Pro ends?",
    a: "Nothing is deleted. Your links keep redirecting and your clicks keep counting. Pro-only settings switch off until you renew, then switch back on as they were.",
  },
  {
    q: "Does self-hosting include the Pro features?",
    a: "Yes. The open source release is the same code that serves spoo.me, with every feature on this page and no plan to buy. Paid plans are for the hosted service.",
  },
  {
    q: "When does Business open?",
    a: "There is no date yet. Business adds team seats and conversion tracking on top of Pro. Join the waitlist and we email you the day it opens.",
  },
]

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
                level={1}
                title={
                  <>
                    Your domain, your card,{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
                      your rules.
                    </span>
                  </>
                }
                description="Free covers every link you make and every click on it. Pro adds the parts that carry your brand: a domain you own, the card people see when a link is shared, and rules for where visitors go."
              />
              <div className="mt-12">
                <PricingTiers />
              </div>
              <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
                14-day refund on monthly and annual. Prices in USD; local
                methods at checkout.
              </p>
            </div>
          </Section>

          <Section caption="Compare plans">
            <div className="px-5 py-20 sm:px-9">
              <PricingTable />
            </div>
          </Section>

          <Section caption="Self-host">
            <Band className="grid gap-8 px-5 py-16 sm:px-9 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
              <div>
                <span className="label-mono text-muted-foreground">
                  Open source
                </span>
                <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                  Same core, your server.
                </h2>
              </div>
              <div className="lg:pt-1">
                <p className="max-w-[36rem] text-muted-foreground">
                  Every plan runs on the same open source code. Self-hosting is
                  free, with full parity: every feature on this page, including
                  the Pro ones, on your own domain and your own database. Paid
                  plans are for the hosted service at spoo.me.
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <a
                    href={siteConfig.links.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BrandIcons.github
                      className="size-4"
                      data-icon="inline-start"
                    />
                    Self-host from source
                    <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            </Band>
          </Section>

          <Section caption="Questions">
            <Band className="grid gap-10 px-5 py-16 sm:px-9 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
              <FaqJsonLd items={FAQ} />
              <div className="lg:sticky lg:top-28 lg:self-start">
                <span className="label-mono text-muted-foreground">FAQ</span>
                <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                  Before you pay
                </h2>
                <p className="mt-4 text-muted-foreground">
                  The parts of billing worth knowing up front.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-1 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
                >
                  Ask us anything else
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              <div className="lg:-mt-3.5">
                <FaqList items={FAQ} answerClassName="max-w-[36rem]" />
              </div>
            </Band>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
