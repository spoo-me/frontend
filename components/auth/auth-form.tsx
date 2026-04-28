"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrandIcons } from "@/components/icons/brand-icons"

type Mode = "login" | "signup"

const copy: Record<Mode, { title: string; sub: string; cta: string; alt: string; altLink: string; altHref: string }> = {
  login: {
    title: "Welcome back",
    sub: "Sign in to your spoo.me workspace",
    cta: "Sign in",
    alt: "Don't have an account?",
    altLink: "Create one",
    altHref: "/signup",
  },
  signup: {
    title: "Create an account",
    sub: "Free forever. No credit card. No upsells.",
    cta: "Create account",
    alt: "Already have an account?",
    altLink: "Sign in",
    altHref: "/login",
  },
}

export function AuthForm({ mode }: { mode: Mode }) {
  const c = copy[mode]
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setTimeout(() => {
      window.location.href = `https://spoo.me/${mode}?email=${encodeURIComponent(email)}`
    }, 600)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-border/60 bg-card/40 w-full max-w-sm space-y-6 rounded-2xl border p-7 backdrop-blur"
    >
      <div className="space-y-1.5 text-center">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {c.title}
        </h1>
        <p className="text-muted-foreground text-sm">{c.sub}</p>
      </div>

      <div className="grid gap-2">
        <OAuthButton provider="google" mode={mode} />
        <OAuthButton provider="github" mode={mode} />
      </div>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
          or
        </span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="space-y-1.5 block">
          <span className="text-foreground text-xs font-medium">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="h-9"
          />
        </label>
        <Button type="submit" className="h-9 w-full" disabled={pending || !email}>
          <Mail className="size-3.5" data-icon="inline-start" />
          {pending ? "Sending magic link…" : c.cta}
          <ArrowRight className="size-3.5" data-icon="inline-end" />
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-xs">
        {c.alt}{" "}
        <Link
          href={c.altHref}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {c.altLink}
        </Link>
      </p>

      {mode === "signup" && (
        <p className="text-muted-foreground/70 text-center text-[10px] leading-relaxed">
          By continuing you agree to our{" "}
          <a href="https://spoo.me/legal/terms" className="underline-offset-4 hover:underline">
            terms
          </a>{" "}
          and{" "}
          <a href="https://spoo.me/legal/privacy" className="underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </p>
      )}
    </motion.div>
  )
}

function OAuthButton({
  provider,
  mode,
}: {
  provider: "google" | "github"
  mode: Mode
}) {
  const label = provider === "google" ? "Google" : "GitHub"
  const Icon = provider === "github" ? BrandIcons.github : GoogleIcon

  return (
    <Button
      asChild
      variant="outline"
      className={cn("h-9 w-full justify-center")}
    >
      <a href={`https://spoo.me/${mode}/${provider}`} rel="noreferrer">
        <Icon className="size-3.5" data-icon="inline-start" />
        Continue with {label}
      </a>
    </Button>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
