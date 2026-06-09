import type { Metadata } from "next"
import { ArrowUpRight, Building2 } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "About — the link platform built for developers",
  description:
    "spoo.me is an open-source, developer-first link management platform — free forever, self-hostable, API-first.",
}

type Person = { name: string; role: string; avatar: number }

const team: { label: string; people: Person[] }[] = [
  {
    label: "Leadership",
    people: [
      { name: "Zingzy", role: "Founder", avatar: 12 },
      { name: "Maya Chen", role: "Product Lead", avatar: 47 },
      { name: "Daniel Reyes", role: "Engineering Lead", avatar: 33 },
      { name: "Priya Rao", role: "Operations", avatar: 16 },
    ],
  },
  {
    label: "Engineering",
    people: [
      { name: "Theo Park", role: "Backend", avatar: 11 },
      { name: "Lin Cooper", role: "Frontend", avatar: 5 },
      { name: "Ben Hoffman", role: "Infrastructure", avatar: 60 },
      { name: "Sara Iyer", role: "Mobile", avatar: 25 },
    ],
  },
  {
    label: "Community & Support",
    people: [
      { name: "Jules Martin", role: "DevRel", avatar: 13 },
      { name: "Noor Patel", role: "Community", avatar: 49 },
      { name: "Kai Watanabe", role: "Support", avatar: 14 },
      { name: "Lara Brooks", role: "Docs", avatar: 9 },
    ],
  },
]

const pillars = [
  {
    title: "Open by default",
    body: "Every component of the platform is Apache 2.0 — the link service, dashboard, SDKs, native apps, and docs. Read the source, fork it, run it.",
  },
  {
    title: "Free, no asterisks",
    body: "No premium tier, no upsell, no metered limits. The complete feature set is available to every account — funded by sponsors, not subscriptions.",
  },
  {
    title: "API-first",
    body: "Every dashboard surface is backed by a documented public API. Six SDKs ship alongside the core platform. spoo is a building block, not a destination.",
  },
  {
    title: "Yours to host",
    body: "The entire stack runs on your own infrastructure with one command. Full feature parity, your domain, your database, no telemetry.",
  },
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
        {/* Hero */}
        <section className="pt-28 pb-12 sm:pt-32 sm:pb-16">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={
                <>
                  <Building2 className="size-3" /> About spoo
                </>
              }
              title={
                <>
                  A link platform,{" "}
                  <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                    built in the open.
                  </span>
                </>
              }
              description="spoo.me is open-source link infrastructure. Every component, every endpoint, every native client is free to read, run, and self-host. This is what we&apos;re building, and why."
            />
          </div>
        </section>

        {/* What spoo is */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex flex-col gap-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                What spoo is.
              </p>
              <p>
                spoo.me is a complete link management stack: a high-throughput redirect
                service, a dashboard for managing campaigns, a public API for automation, and
                an ecosystem of native clients across browser, desktop, mobile shortcuts,
                Discord, and Telegram. All of it open source. All of it free.
              </p>
              <p>
                The platform handles over 100 million clicks across every region with rolling
                99.99% uptime, and is used by independent developers, indie teams, and
                organizations that need link infrastructure without the lock-in of a SaaS
                vendor.
              </p>
            </div>
          </div>
        </section>

        {/* Why it exists */}
        <section className="border-border/40 border-y bg-card/20 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex flex-col gap-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                Why it exists.
              </p>
              <p>
                Link shorteners follow a predictable pattern: a free tier with caps, a paid
                plan with the features you actually need, and a quiet erosion of ownership
                over your own redirect data. spoo was built to flip that pattern.
              </p>
              <p>
                The complete feature set — analytics, custom domains, API access, every
                native client — ships free for every user. The entire stack is open source
                and self-hostable, so the option to leave is always one command away. The
                project is funded by sponsors who believe link infrastructure should be a
                public utility, not a subscription.
              </p>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              title={
                <>
                  What spoo stands{" "}
                  <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                    for.
                  </span>
                </>
              }
              description="The principles that shape every release of the platform."
            />
            <div className="mt-12 grid gap-3 sm:grid-cols-2">
              {pillars.map((p) => (
                <div
                  key={p.title}
                  className="border-border/60 bg-card/40 flex flex-col gap-3 rounded-2xl border p-7"
                >
                  <div className="text-foreground text-base font-semibold leading-tight">
                    {p.title}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our team */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Our team
            </h2>

            <div className="mt-14 flex flex-col gap-16">
              {team.map((group) => (
                <div key={group.label}>
                  <div className="text-foreground text-base font-medium">{group.label}</div>
                  <div className="border-border/60 mt-3 border-t pt-8">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
                      {group.people.map((p) => (
                        <PersonCard key={p.name} person={p} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="outline" className="h-10">
                <a
                  href={`${siteConfig.links.github}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BrandIcons.github className="size-4" data-icon="inline-start" />
                  Contribute on GitHub
                  <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-10">
                <a
                  href={`${siteConfig.links.github}/sponsors`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sponsor the project
                  <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </div>
        </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="flex flex-col items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.pravatar.cc/200?img=${person.avatar}`}
        alt={person.name}
        className="border-border/60 size-16 rounded-full border object-cover"
      />
      <div>
        <div className="text-foreground text-sm font-semibold leading-tight">
          {person.name}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">{person.role}</div>
      </div>
    </div>
  )
}
