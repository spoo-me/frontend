import Link from "next/link"
import { Bell, Copy } from "lucide-react"
import { BaseQr, encodeData } from "simple-qrbtf"

import { Logo } from "@/components/shared/logo"
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
    <div className="bg-background grid min-h-svh lg:grid-cols-[1.2fr_1fr]">
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
 * Brand pane — a floating collage of real product artifacts (link card with
 * sparkline, QR chip, webhook event) over the aurora. Evergreen, no quotes.
 */
function BrandPanel() {
  const figures = [
    { value: `${stats.clicks / 1_000_000}M+`, label: "clicks served" },
    { value: `${stats.uptime}%`, label: "uptime" },
    { value: "Apache 2.0", label: "open source" },
  ]

  return (
    <aside className="hidden p-4 lg:block">
      <div className="border-border/60 bg-card/40 relative flex h-full flex-col overflow-hidden rounded-2xl border p-10 dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* Aurora — layered brand tint, echoes the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_60%,black,transparent)]"
        >
          <div className="bg-brand/20 absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
          <div className="absolute right-[-6rem] bottom-[-8rem] size-[20rem] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pattern-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
        />

        {/* Artifact collage */}
        <div className="relative flex flex-1 items-center justify-center">
          <ArtifactCollage />
        </div>

        <dl className="relative grid grid-cols-3 gap-6">
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

function ArtifactCollage() {
  const qr = BaseQr({
    qrcode: encodeData({ text: "https://spoo.me/launch" }),
    otherColor: "currentColor",
    posColor: "currentColor",
  })

  // Static sparkline — clicks/day
  const points = [4, 7, 6, 10, 9, 14, 12, 18, 16, 22, 26, 24, 31, 36]
  const max = Math.max(...points)
  const w = 240
  const h = 48
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 6)}`)
    .join(" ")

  return (
    <div className="relative w-72">
      {/* Link card — the centerpiece */}
      <div className="border-border/70 bg-card relative z-20 rounded-xl border p-4 shadow-[0_24px_56px_-24px_rgba(0,0,0,0.55)] dark:[box-shadow:0_24px_56px_-24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-foreground font-mono text-sm font-medium">
            spoo.me/launch
          </span>
          <Copy className="text-muted-foreground/60 size-3.5" aria-hidden />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-foreground text-2xl font-semibold tabular-nums">
            12,408
          </span>
          <span className="label-mono text-muted-foreground">clicks</span>
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="mt-2 h-12 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="authSpark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#authSpark)" />
          <path
            d={path}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* QR chip — tucked behind, top right */}
      <div className="border-border/70 bg-card absolute -top-12 -right-8 z-10 rotate-6 rounded-lg border p-2.5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)]">
        <div
          aria-hidden
          className="text-foreground/80 size-16 [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      </div>

      {/* Webhook event chip — overlapping bottom left */}
      <div className="border-border/70 bg-card absolute -bottom-7 -left-10 z-30 flex -rotate-2 items-center gap-2.5 rounded-lg border px-3 py-2 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)]">
        <span className="border-border/60 bg-muted/40 flex size-6 shrink-0 items-center justify-center rounded-md border">
          <Bell className="text-foreground size-3" aria-hidden />
        </span>
        <code className="text-foreground/90 font-mono text-[11px]">clicks.threshold</code>
        <span className="bg-live size-1.5 shrink-0 rounded-full" aria-hidden />
      </div>
    </div>
  )
}
