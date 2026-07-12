"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/components/auth/auth-context"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  const step = pathname.split("/")[2] ?? ""
  const onVerify = step === "verify"

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login?next=/onboarding")
      return
    }
    if (user.onboarded_at) {
      router.replace("/dashboard")
      return
    }
    // Email-password stragglers who closed the signup tab before entering
    // the OTP — everything past the welcome screen needs a verified email.
    if (
      !user.email_verified &&
      !onVerify &&
      step !== "welcome" &&
      step !== ""
    ) {
      router.replace("/onboarding/verify")
    }
  }, [loading, user, router, onVerify, step])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Faint brand presence, same register as the auth pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-3xl"
      />

      {/* Dub-style chrome: just the mark, centered — no progress meter */}
      <header className="relative z-10 flex items-center justify-center pt-7">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-14">
        {!user ? (
          <span className="label-mono animate-pulse text-[10px] text-muted-foreground/60">
            loading…
          </span>
        ) : (
          children
        )}
      </main>

      {/* Dub-style escape hatch — present on every step */}
      <footer className="relative z-10 flex items-center justify-between px-6 pb-5 sm:px-10">
        <p className="text-muted-foreground/70 text-xs">
          {user ? (
            <>
              You&apos;re signed in as{" "}
              <span className="ph-no-capture font-medium text-muted-foreground">
                {user.email}
              </span>
            </>
          ) : null}
        </p>
        {user && (
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => router.push("/login"))
            }}
            className="rounded-lg border border-border/60 px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
          >
            Sign in as a different user
          </button>
        )}
      </footer>
    </div>
  )
}
