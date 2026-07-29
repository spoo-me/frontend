import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { IMAGE_ICONS } from "@/components/icons/image-icons"
import { connectedApps, type ConnectedApp } from "@/lib/apps-data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Apps & SDKs",
  description:
    "Every official spoo.me client: Raycast, Chrome, Discord, Telegram, Windows, mobile, plus SDKs in Python, TypeScript, Rust, Go and C++.",
}

const groups: {
  id: string
  title: string
  description: string
  categories: ConnectedApp["category"][]
}[] = [
  {
    id: "extensions",
    title: "Extensions",
    description:
      "Browser and launcher extensions for shortening from anywhere.",
    categories: ["extension"],
  },
  {
    id: "native",
    title: "Native apps",
    description: "First-class desktop, terminal, and mobile clients.",
    categories: ["desktop", "cli", "mobile"],
  },
  {
    id: "bots",
    title: "Bots",
    description: "Shorten and track without leaving your chat.",
    categories: ["bot"],
  },
  {
    id: "sdks",
    title: "Official SDKs",
    description: "Type-safe clients in every language we ship in.",
    categories: ["sdk"],
  },
]

export default function AppsPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Ecosystem">
            <div className="px-5 pt-28 pb-20 sm:px-9">
              <SectionHeading
                title={
                  <>
                    One link platform.{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
                      Every surface.
                    </span>
                  </>
                }
                description="Pick the surface where you actually work. Every client talks to the same API."
              />

              <div className="mt-16 space-y-16">
                {groups.map((group) => {
                  const apps = connectedApps.filter((a) =>
                    group.categories.includes(a.category)
                  )
                  return (
                    <section key={group.id} id={group.id} className="space-y-6">
                      <header className="flex items-end justify-between gap-6">
                        <div>
                          <h2 className="flex items-center gap-2 font-semibold text-foreground text-xl tracking-tight sm:text-2xl">
                            {group.title}
                            <span className="font-mono font-normal text-muted-foreground/70 text-xs">
                              {apps.length.toString().padStart(2, "0")}
                            </span>
                          </h2>
                          <p className="mt-1 text-muted-foreground text-sm">
                            {group.description}
                          </p>
                        </div>
                      </header>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {apps.map((app) => (
                          <AppCard key={app.slug} app={app} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}

function AppCard({ app }: { app: ConnectedApp }) {
  const Icon = BrandIcons[app.iconKey as BrandIconKey] ?? null
  const image = IMAGE_ICONS[app.iconKey]
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group relative flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-4 transition hover:border-border hover:bg-card"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background"
        style={{ color: app.color }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-5" loading="lazy" />
        ) : Icon ? (
          <Icon className="size-5" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-foreground text-sm tracking-tight">
            {app.name}
          </h3>
          {app.status !== "live" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-medium text-[9px] uppercase tracking-wider",
                app.status === "beta"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {app.status}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-muted-foreground text-xs">
          {app.tagline}
        </p>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
    </Link>
  )
}
