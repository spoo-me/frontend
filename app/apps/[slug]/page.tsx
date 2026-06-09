import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Button } from "@/components/ui/button"
import { AppGallery } from "@/components/sections/app-gallery"
import { InstallSteps } from "@/components/sections/install-steps"
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
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption={app.category}>
            <div className="px-5 pt-14 pb-20 sm:px-9">
              <Link
                href="/apps"
                className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
                All apps
              </Link>

              <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
                <span
                  className="border-border/60 bg-card shadow-card flex size-16 shrink-0 items-center justify-center rounded-2xl border dark:shadow-none dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)]"
                  style={{ color: app.color }}
                >
                  {Icon ? <Icon className="size-8" /> : null}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                      {app.name}
                    </h1>
                    {app.status !== "live" && (
                      <span
                        className={cn(
                          "label-mono rounded-full border px-2 py-0.5",
                          app.status === "beta"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-border/60 bg-muted/40 text-muted-foreground",
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

              <div className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-10">
                  <section>
                    <h2 className="text-foreground text-lg font-semibold tracking-tight">
                      About
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
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
                          <Check className="text-live mt-0.5 size-3.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {app.install && app.install.length > 0 && (
                  <aside>
                    <h2 className="text-foreground text-lg font-semibold tracking-tight">
                      Install
                    </h2>
                    <div className="mt-3">
                      <InstallSteps install={app.install} />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
