import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Server } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Pricing, free forever",
  description:
    "spoo.me is free for everyone, forever. Self-host for full control or sponsor the project to fund development.",
}

const tiers = [
  {
    name: "Free",
    tagline: "Everything we ship — no asterisks.",
    price: "$0",
    suffix: "forever",
    cta: { label: "Sign up free", href: "/signup", variant: "default" as const },
    highlight: true,
    features: [
      "Unlimited links",
      "Unlimited clicks",
      "Full analytics dashboard",
      "Custom aliases",
      "Password protection",
      "Expiry & max-clicks",
      "QR codes",
      "API access (5 keys)",
      "All native apps included",
    ],
  },
  {
    name: "Self-hosted",
    tagline: "Run it on your own infra.",
    price: "$0",
    suffix: "Apache 2.0",
    cta: {
      label: "View on GitHub",
      href: siteConfig.links.github,
      external: true,
      variant: "outline" as const,
    },
    features: [
      "100% feature parity",
      "Your own database",
      "Your own domain",
      "Unlimited workspaces",
      "No telemetry",
      "Brand it as your own",
      "Modify the source",
      "Community support",
    ],
  },
  {
    name: "Sponsor",
    tagline: "Fund the project — get a badge.",
    price: "from $5",
    suffix: "/month",
    cta: {
      label: "Sponsor on GitHub",
      href: `${siteConfig.links.github}/sponsors`,
      external: true,
      variant: "outline" as const,
    },
    features: [
      "Everything in Free",
      "Sponsor badge on profile",
      "Priority issue triage",
      "Direct line to maintainers",
      "Roadmap input",
      "Warm fuzzy feeling included",
    ],
  },
]

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <PageFrame>
          <Section caption="Pricing">
            <div className="px-5 pt-28 pb-24 sm:px-9">
          <SectionHeading
            title={
              <>
                Free for you,{" "}
                <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                  always.
                </span>
              </>
            }
            description="spoo.me has no premium tier and no plan to add one. The whole platform (analytics, API, every native client) is free. Open source, self-hostable, sustainable."
          />

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={
                  "border-border/60 bg-card/40 relative flex flex-col rounded-2xl border p-7 " +
                  (t.highlight ? "ring-foreground/10 ring-2" : "")
                }
              >
                {t.highlight && (
                  <span className="bg-foreground text-background absolute -top-2 left-7 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <h3 className="text-foreground text-lg font-semibold tracking-tight">
                  {t.name}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">{t.tagline}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-foreground text-4xl font-semibold tabular-nums">
                    {t.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{t.suffix}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <Check className="text-foreground/70 mt-0.5 size-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    asChild
                    size="lg"
                    variant={t.cta.variant}
                    className="h-10 w-full"
                  >
                    {"external" in t.cta && t.cta.external ? (
                      <a href={t.cta.href} target="_blank" rel="noreferrer">
                        {t.name === "Self-hosted" && (
                          <BrandIcons.github className="size-4" data-icon="inline-start" />
                        )}
                        {t.cta.label}
                      </a>
                    ) : (
                      <Link href={t.cta.href}>
                        {t.cta.label}
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </Link>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-border/60 bg-card/40 mt-12 flex flex-col items-center gap-4 rounded-2xl border p-8 text-center sm:flex-row sm:gap-6 sm:text-left">
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
              <a href="https://spoo.me/contact" target="_blank" rel="noreferrer">
                Get in touch
              </a>
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
