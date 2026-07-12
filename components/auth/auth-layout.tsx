import Link from "next/link"

import { Logo } from "@/components/shared/logo"

type Mode = "login" | "signup" | "forgot"

const crossLink: Record<Mode, { label: string; href: string }> = {
  login: { label: "Sign up", href: "/signup" },
  signup: { label: "Sign in", href: "/login" },
  forgot: { label: "Sign in", href: "/login" },
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
    <div className="relative flex min-h-svh flex-col bg-background px-6 pt-6 pb-8 sm:px-10">
      {/* Faint ambient brand tint — character without chrome */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-12rem] left-1/2 -z-10 h-[24rem] w-[44rem] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-3xl"
      />

      <header className="flex items-center justify-between">
        <Logo />
        <Link
          href={cross.href}
          className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          {cross.label}
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <p className="text-center text-muted-foreground/70 text-xs">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
