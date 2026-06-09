import type { Metadata } from "next"
import {
  ArrowUpRight,
  Bug,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { ContactForm } from "@/components/sections/contact-form"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Contact, get in touch",
  description:
    "Talk to the team behind spoo.me. Discord for community, GitHub for bugs, email for everything else.",
}

const channels = [
  {
    icon: BrandIcons.discord,
    title: "Join the Discord",
    description:
      "The fastest way to reach us. Maintainers, contributors, and power users all hang out here.",
    href: siteConfig.links.discord,
    cta: "Open Discord",
    external: true,
  },
  {
    icon: Bug,
    title: "Report a bug",
    description:
      "Found something broken? File an issue on GitHub with steps to reproduce. Triaged within 48h.",
    href: `${siteConfig.links.github}/issues/new`,
    cta: "Open an issue",
    external: true,
  },
  {
    icon: ShieldCheck,
    title: "Security disclosure",
    description:
      "Spotted a vulnerability? Email us privately. Coordinated disclosure, with credit and thanks for responsible reports.",
    href: "mailto:security@spoo.me",
    cta: "security@spoo.me",
  },
  {
    icon: Sparkles,
    title: "Press & partnerships",
    description:
      "Writing about spoo, integrating with us, or sponsoring the project? Drop a note and we'll route it.",
    href: "mailto:hello@spoo.me",
    cta: "hello@spoo.me",
  },
]

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <PageFrame>
        {/* Hero */}
        <section className="pt-28 pb-12 sm:pt-32 sm:pb-16">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={
                <>
                  <Mail className="size-3" /> Contact
                </>
              }
              title={
                <>
                  Talk to{" "}
                  <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                    a human.
                  </span>
                </>
              }
              description="Every message is read by someone who can actually do something about it. Send a note below, or pick a faster channel."
            />
          </div>
        </section>

        {/* Form */}
        <section className="pb-20 sm:pb-24">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ContactForm />
          </div>
        </section>

        {/* Channels */}
        <section className="pb-24 sm:pb-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                Other ways to reach us
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                Faster than the form for most things.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {channels.map((c) => (
                <ChannelCard key={c.title} {...c} />
              ))}
            </div>
          </div>
        </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}

function ChannelCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  external,
}: {
  icon: React.ElementType
  title: string
  description: string
  href: string
  cta: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group border-border/60 bg-card/40 hover:bg-card/60 flex flex-col gap-3 rounded-2xl border p-6 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="border-border/60 bg-muted/30 flex size-10 items-center justify-center rounded-md border">
          <Icon className="text-foreground/85 size-4" />
        </div>
        <ArrowUpRight className="text-muted-foreground/60 group-hover:text-foreground size-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <div className="text-foreground text-base font-semibold leading-tight">{title}</div>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      <div className="text-foreground mt-1 text-xs font-mono">{cta}</div>
    </a>
  )
}
