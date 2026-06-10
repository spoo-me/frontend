"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"
import { HEARD_FROM_OPTIONS, type OnboardingStash } from "@/lib/onboarding"

export function DoneStep({
  stash,
  onFinish,
}: {
  stash: OnboardingStash
  onFinish: (heardFrom?: string) => void
}) {
  const { user } = useAuth()
  const [heardFrom, setHeardFrom] = React.useState<string | null>(null)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onFinish(heardFrom ?? undefined)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [heardFrom, onFinish])

  const setup: {
    label: string
    done: boolean
    detail?: string
    cta?: { label: string; href: string }
  }[] = [
    {
      label: "Create a short link",
      done: stash.artifact?.kind === "link",
      detail:
        stash.artifact?.kind === "link"
          ? stash.artifact.shortUrl.replace(/^https?:\/\//, "")
          : undefined,
      cta:
        stash.artifact?.kind === "link"
          ? undefined
          : { label: "Create", href: "/dashboard/links" },
    },
    {
      label: "Get an API key",
      done: stash.artifact?.kind === "key",
      detail:
        stash.artifact?.kind === "key"
          ? `${stash.artifact.tokenPrefix}…`
          : undefined,
      cta:
        stash.artifact?.kind === "key"
          ? undefined
          : { label: "Generate", href: "/dashboard/keys" },
    },
    {
      label: "Connect a custom domain",
      done: false,
      cta: { label: "Connect", href: "/onboarding/domain" },
    },
    {
      label: "Explore analytics",
      done: false,
      cta: { label: "View", href: "/dashboard/analytics" },
    },
  ]

  const resources = [
    { label: "Documentation", href: siteConfig.links.docs, external: true },
    { label: "Discord community", href: siteConfig.links.discord, external: true },
    { label: "GitHub", href: siteConfig.links.github, external: true },
    { label: "Support", href: "/contact", external: false },
  ]

  return (
    <div className="flex w-full flex-col items-center text-center">
      <Image
        src="/icons-3d/party_popper_3D.png"
        alt=""
        width={56}
        height={56}
        className="size-14 object-contain drop-shadow-[0_6px_20px_rgba(139,92,246,0.3)]"
      />
      <h1 className="text-foreground mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        You&apos;re in
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        {user?.email ? (
          <>
            Your workspace is ready,{" "}
            <span className="text-foreground font-medium">
              {user.user_name ?? user.email.split("@")[0]}
            </span>
            . Pick up where this leaves off:
          </>
        ) : (
          "Your workspace is ready. Pick up where this leaves off:"
        )}
      </p>

      <Button onClick={() => onFinish(heardFrom ?? undefined)} className="mt-8 h-10 min-w-56">
        Go to your dashboard
        <ArrowRight className="size-4" data-icon="inline-end" />
      </Button>

      {/* Complete setup — Dub-style launchpad rows with per-row CTAs */}
      <div className="mt-10 w-full max-w-md text-left">
        <p className="label-mono text-muted-foreground/70 text-[10px]">
          Complete setup
        </p>
        <ul className="border-border/60 bg-card/50 mt-2.5 w-full divide-y rounded-xl border">
          {setup.map((item) => (
            <li key={item.label} className="flex items-center gap-3 px-4 py-3">
              <CircleCheck
                className={cn(
                  "size-4 shrink-0",
                  item.done ? "text-live" : "text-muted-foreground/30",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              {item.detail && (
                <span className="text-muted-foreground max-w-36 truncate font-mono text-xs">
                  {item.detail}
                </span>
              )}
              {item.cta && (
                <Link
                  href={item.cta.href}
                  className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  {item.cta.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <p className="label-mono text-muted-foreground/70 mt-6 text-[10px]">
          Additional resources
        </p>
        <ul className="border-border/60 bg-card/50 mt-2.5 w-full divide-y rounded-xl border">
          {resources.map((r) => (
            <li key={r.label}>
              <Link
                href={r.href}
                target={r.external ? "_blank" : undefined}
                rel={r.external ? "noopener" : undefined}
                className="text-muted-foreground hover:text-foreground flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              >
                <span className="flex-1">{r.label}</span>
                <ArrowUpRight className="size-3.5 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Attribution — post-activation placement, fully optional */}
      <div className="mt-9">
        <p className="label-mono text-muted-foreground/70 text-[10px]">
          How did you hear about us?
        </p>
        <div className="mt-3 flex max-w-md flex-wrap justify-center gap-1.5">
          {HEARD_FROM_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setHeardFrom((h) => (h === opt ? null : opt))}
              aria-pressed={heardFrom === opt}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-all",
                heardFrom === opt
                  ? "border-ring ring-ring/30 text-foreground shadow-soft ring-1"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <p className="label-mono text-muted-foreground/50 mt-8 text-[10px]">
        press ↵ to finish
      </p>
    </div>
  )
}
