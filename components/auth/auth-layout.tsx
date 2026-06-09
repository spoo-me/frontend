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
    <div className="bg-background relative flex min-h-svh flex-col px-6 pt-6 pb-8 sm:px-10">
      {/* Faint ambient brand tint — character without chrome */}
      <div
        aria-hidden
        className="bg-brand/[0.07] pointer-events-none absolute top-[-12rem] left-1/2 -z-10 h-[24rem] w-[44rem] -translate-x-1/2 rounded-full blur-3xl"
      />

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
  )
}
