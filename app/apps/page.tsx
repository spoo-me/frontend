import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Boxes } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SectionHeading } from "@/components/shared/section-heading"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { connectedApps, type ConnectedApp } from "@/lib/apps-data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Apps & SDKs",
  description:
    "Every official spoo.me client — Raycast, Chrome, Discord, Telegram, Windows, mobile, plus SDKs in Python, TypeScript, Rust, Go and C++.",
}

const groups: { id: string; title: string; description: string; categories: ConnectedApp["category"][] }[] = [
  {
    id: "extensions",
    title: "Extensions",
    description: "Browser and launcher extensions for shortening from anywhere.",
    categories: ["extension"],
  },
  {
    id: "native",
    title: "Native apps",
    description: "First-class desktop and mobile clients.",
    categories: ["desktop", "mobile"],
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
    categories: ["sdk", "cli"],
  },
]

export default function AppsPage() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={
              <>
                <Boxes className="size-3" /> Ecosystem
              </>
            }
            title={
              <>
                One link platform.{" "}
                <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                  Every surface.
                </span>
              </>
            }
            description="Pick the surface where you actually work — every client talks to the same API."
          />

          <div className="mt-16 space-y-16">
            {groups.map((group) => {
              const apps = connectedApps.filter((a) =>
                group.categories.includes(a.category),
              )
              return (
                <section key={group.id} id={group.id} className="space-y-6">
                  <header className="flex items-end justify-between gap-6">
                    <div>
                      <h2 className="text-foreground flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                        {group.title}
                        <span className="text-muted-foreground/70 font-mono text-xs font-normal">
                          {apps.length.toString().padStart(2, "0")}
                        </span>
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
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
      </main>
      <Footer />
    </>
  )
}

function AppCard({ app }: { app: ConnectedApp }) {
  const Icon = BrandIcons[app.iconKey as BrandIconKey] ?? null
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group border-border/60 bg-card/40 hover:bg-card hover:border-border relative flex items-center gap-4 rounded-xl border p-4 transition"
    >
      <span
        className="border-border/60 bg-background flex size-11 shrink-0 items-center justify-center rounded-lg border"
        style={{ color: app.color }}
      >
        {Icon ? <Icon className="size-5" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground truncate text-sm font-semibold tracking-tight">
            {app.name}
          </h3>
          {app.status !== "live" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                app.status === "beta"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {app.status}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {app.tagline}
        </p>
      </div>
      <ArrowUpRight className="text-muted-foreground/40 group-hover:text-foreground size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  )
}
