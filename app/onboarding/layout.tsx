"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/components/auth/auth-context"
import { getOnboardingState } from "@/lib/api"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  // Server copy — used here only for the completed gate; the index page
  // uses it to resume, individual pages never need it.
  const serverState = useQuery({
    queryKey: ["onboarding"],
    queryFn: getOnboardingState,
    enabled: !loading && !!user,
    staleTime: Infinity,
    retry: false,
  })

  const step = pathname.split("/")[2] ?? ""
  const onVerify = step === "verify"

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login?next=/onboarding")
      return
    }
    if (serverState.data?.completed) {
      router.replace("/dashboard")
      return
    }
    // Email-password stragglers who closed the signup tab before entering
    // the OTP — everything past the welcome screen needs a verified email.
    if (!user.email_verified && !onVerify && step !== "welcome" && step !== "") {
      router.replace("/onboarding/verify")
    }
  }, [loading, user, router, serverState.data?.completed, onVerify, step])

  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      {/* Faint brand presence, same register as the auth pages */}
      <div
        aria-hidden
        className="bg-brand/[0.07] pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      {/* Dub-style chrome: just the mark, centered — no progress meter */}
      <header className="relative z-10 flex items-center justify-center pt-7">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-14">
        {!user ? (
          <span className="label-mono text-muted-foreground/60 animate-pulse text-[10px]">
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
              <span className="text-muted-foreground font-medium">
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
            className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border rounded-lg border px-2.5 py-1 text-xs transition-colors"
          >
            Sign in as a different user
          </button>
        )}
      </footer>
    </div>
  )
}
