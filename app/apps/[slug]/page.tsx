import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { AppGallery } from "@/components/sections/app-gallery"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { connectedApps } from "@/lib/apps-data"
import { cn } from "@/lib/utils"

type Params = { slug: string }

export function generateStaticParams() {
  return connectedApps.map((app) => ({ slug: app.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const app = connectedApps.find((a) => a.slug === slug)
  if (!app) return {}
  return { title: app.name, description: app.tagline }
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const app = connectedApps.find((a) => a.slug === slug)
  if (!app) return notFound()

  const Icon = BrandIcons[app.iconKey as BrandIconKey] ?? null

  return (
    <>
      <Header />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link
            href="/apps"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="size-3" />
            All apps
          </Link>

          <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <span
              className="border-border/60 bg-card flex size-16 shrink-0 items-center justify-center rounded-2xl border"
              style={{ color: app.color }}
            >
              {Icon ? <Icon className="size-8" /> : null}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  {app.name}
                </h1>
                {app.status !== "live" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      app.status === "beta"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {app.status}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-2 text-base sm:text-lg">
                {app.tagline}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {app.github && (
                <Button asChild variant="outline" size="default">
                  <a href={app.github} target="_blank" rel="noreferrer">
                    <BrandIcons.github className="size-3.5" data-icon="inline-start" />
                    Source
                  </a>
                </Button>
              )}
              <Button asChild size="default">
                <a href={app.url} target="_blank" rel="noreferrer">
                  Open
                  <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </header>

          <AppGallery gallery={app.gallery} appName={app.name} />

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              <section>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  About
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {app.description}
                </p>
              </section>

              <section>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  Features
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {app.features.map((f) => (
                    <li
                      key={f}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <Check className="text-foreground/70 mt-0.5 size-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>

            </div>

            <aside className="space-y-3">
              <div className="border-border/60 bg-card/40 space-y-2 rounded-lg border p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground capitalize">{app.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License</span>
                  <span className="text-foreground">Apache 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-foreground capitalize">{app.status}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
