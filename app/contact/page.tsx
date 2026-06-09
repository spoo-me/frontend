import type { Metadata } from "next"
import { CircleCheck } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { ContactForm } from "@/components/sections/contact-form"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Contact, talk to a human",
  description:
    "Questions, bug reports, feedback, partnerships. Every message is read by someone who can actually do something about it.",
}

const promises = [
  "Replies within 24 hours, usually much faster",
  "Read by maintainers, not ticket bots",
  "Bug reports go straight to the issue tracker",
  "No newsletters, no follow-up spam",
]

const channels = [
  { label: "General", value: "hello@spoo.me", href: "mailto:hello@spoo.me" },
  { label: "Security", value: "security@spoo.me", href: "mailto:security@spoo.me" },
  { label: "Discord", value: "spoo.me/discord", href: siteConfig.links.discord, external: true },
  { label: "GitHub", value: "@spoo-me", href: siteConfig.links.githubOrg, external: true },
  { label: "X / Twitter", value: "@spoo_me", href: siteConfig.links.x, external: true },
  { label: "Docs", value: "docs.spoo.me", href: siteConfig.links.docs, external: true },
]

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Contact">
            <div className="lg:divide-border/60 grid lg:grid-cols-[1fr_1.2fr] lg:divide-x">
              {/* Left — pitch */}
              <div className="px-5 pt-28 pb-10 sm:px-9 lg:pb-20">
                <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Talk to{" "}
                  <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                    a human.
                  </span>
                </h1>
                <p className="text-muted-foreground mt-5 max-w-md text-base leading-relaxed sm:text-lg">
                  Questions, bug reports, feedback, partnership ideas. Every message
                  lands in front of someone who can act on it.
                </p>

                <ul className="mt-8 flex flex-col gap-3">
                  {promises.map((p) => (
                    <li key={p} className="text-foreground/90 flex items-center gap-2.5 text-sm">
                      <CircleCheck className="text-live size-4 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>

                <p className="text-muted-foreground mt-10 text-sm">
                  Found a vulnerability?{" "}
                  <a
                    href="mailto:security@spoo.me"
                    className="text-foreground font-mono text-[13px] font-medium hover:underline"
                  >
                    security@spoo.me
                  </a>{" "}
                  for coordinated disclosure.
                </p>
              </div>

              {/* Right — form */}
              <div className="px-5 pb-20 sm:px-9 lg:pt-28">
                <div className="mx-auto max-w-xl">
                  <ContactForm />
                </div>
              </div>
            </div>
          </Section>

          {/* Channel grid — label-over-value cells with shared hairlines */}
          <Section caption="Channels">
            <div className="px-5 py-16 sm:px-9 sm:py-20">
              <div className="border-border/60 bg-border/60 shadow-card grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3 dark:shadow-none">
                {channels.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noreferrer" : undefined}
                    className="group bg-background hover:bg-muted/20 flex flex-col gap-2 p-7 transition-colors duration-300 sm:p-9"
                  >
                    <span className="label-mono text-muted-foreground">{c.label}</span>
                    <span className="text-foreground group-hover:underline text-lg font-medium tracking-tight underline-offset-4">
                      {c.value}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
