import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { QuoteText } from "@/app/testimonials/_components/quote-text"
import { testimonials } from "@/lib/testimonials"
import { stats } from "@/lib/site-config"

type Mode = "login" | "signup"

const crossLink: Record<Mode, { label: string; href: string }> = {
  login: { label: "Sign up", href: "/signup" },
  signup: { label: "Sign in", href: "/login" },
}

export function AuthLayout({
  mode,
  children,
}: {
  mode: Mode
  children: React.ReactNode
}) {
  const cross = crossLink[mode]
  return (
    <div className="bg-background grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      {/* Form pane */}
      <div className="flex flex-col px-6 pt-6 pb-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            href={cross.href}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {cross.label}
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-muted-foreground/70 text-center text-xs">
          By continuing, you agree to our{" "}
          <a
            href="https://spoo.me/tos"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://spoo.me/privacy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <BrandPanel />
    </div>
  )
}

/**
 * Brand pane — inset rounded panel with the aurora glow, a real customer
 * quote, and the platform's actual numbers. No stock photos.
 */
function BrandPanel() {
  const t = testimonials[0]
  const figures = [
    { value: `${stats.clicks / 1_000_000}M+`, label: "clicks served" },
    { value: `${stats.uptime}%`, label: "uptime" },
    { value: "Apache 2.0", label: "open source" },
  ]

  return (
    <aside className="hidden p-4 lg:block">
      <div className="border-border/60 bg-card/40 relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-10 dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* Aurora — brand glow rising from the panel floor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_100%,black,transparent)]"
        >
          <div className="bg-brand/15 absolute bottom-[-14rem] left-1/2 size-[34rem] -translate-x-1/2 rounded-full blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pattern-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        />

        <div className="label-mono text-muted-foreground relative">spoo.me</div>

        <figure className="relative max-w-md">
          <blockquote className="text-foreground/90 text-xl leading-relaxed text-pretty">
            <span aria-hidden className="text-muted-foreground/70">
              &ldquo;
            </span>
            <QuoteText segments={t.shortQuote} />
            <span aria-hidden className="text-muted-foreground/70">
              &rdquo;
            </span>
          </blockquote>
          <figcaption className="mt-5">
            <div className="text-foreground text-sm font-semibold">{t.person.name}</div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              {t.person.role}, {t.company.name}
            </div>
          </figcaption>
        </figure>

        <dl className="relative grid max-w-md grid-cols-3 gap-6">
          {figures.map((f) => (
            <div key={f.label}>
              <dt className="text-foreground text-lg font-semibold tracking-tight tabular-nums">
                {f.value}
              </dt>
              <dd className="label-mono text-muted-foreground mt-1">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
