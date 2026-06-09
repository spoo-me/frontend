"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrandIcons } from "@/components/icons/brand-icons"

type Mode = "login" | "signup"

const copy: Record<
  Mode,
  {
    title: string
    sub: string
    cta: string
    alt: string
    altLink: string
    altHref: string
  }
> = {
  login: {
    title: "Welcome back",
    sub: "Sign in to your spoo.me workspace.",
    cta: "Continue with email",
    alt: "Don't have an account?",
    altLink: "Create one",
    altHref: "/signup",
  },
  signup: {
    title: "Create your account",
    sub: "Start free. Upgrade when your links do.",
    cta: "Continue with email",
    alt: "Already have an account?",
    altLink: "Sign in",
    altHref: "/login",
  },
}

const providers = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: BrandIcons.github },
  { id: "discord", label: "Discord", Icon: BrandIcons.discord },
] as const

export function AuthForm({ mode }: { mode: Mode }) {
  const c = copy[mode]
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    window.location.href = `https://spoo.me/${mode}?email=${encodeURIComponent(email)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-7"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          {c.title}
        </h1>
        <p className="text-muted-foreground text-sm">{c.sub}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {providers.map(({ id, label, Icon }) => (
          <Button key={id} asChild variant="outline" className="h-10 w-full">
            <a href={`https://spoo.me/oauth/${id}`} rel="noreferrer" aria-label={`Continue with ${label}`}>
              <Icon className="size-4" data-icon="inline-start" />
              {label}
            </a>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3" role="separator" aria-label="or continue with email">
        <span className="bg-border/60 h-px flex-1" />
        <span className="label-mono text-muted-foreground/70 text-[10px]">
          or continue with
        </span>
        <span className="bg-border/60 h-px flex-1" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="auth-email" className="text-foreground text-sm font-medium">
              Email
            </label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            required
            className="h-10"
          />
        </div>
        <Button type="submit" className="h-10 w-full" disabled={pending || !email}>
          {pending ? "Redirecting…" : c.cta}
          {!pending && <ArrowRight className="size-4" data-icon="inline-end" />}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {c.alt}{" "}
        <Link
          href={c.altHref}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {c.altLink}
        </Link>
      </p>
    </motion.div>
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
