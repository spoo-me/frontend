"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/components/auth/auth-context"
import { listUrls } from "@/lib/api"

/**
 * Placeholder terminus for the onboarding walkthrough — the real dashboard
 * port lands here. Lists the user's links so finishing the wizard shows
 * the artifact it produced.
 */
export default function DashboardStubPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const urls = useQuery({
    queryKey: ["urls"],
    queryFn: () => listUrls(),
    enabled: !loading && !!user,
  })

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/dashboard")
  }, [loading, user, router])

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="border-border/60 flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Logo />
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-xs sm:block">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signOut().then(() => router.push("/login"))}
            >
              Sign out
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <span className="label-mono text-muted-foreground/60">
          [ WIP ] Dashboard
        </span>
        <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight">
          The dashboard port{" "}
          <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
            lands here next.
          </span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
          This is a placeholder terminus for the onboarding flow. Your
          workspace below is real — everything you created in the wizard.
        </p>

        <div className="border-border/60 mt-10 overflow-hidden rounded-xl border">
          <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-foreground text-sm font-semibold">Links</span>
            <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
              {urls.data?.total ?? "–"}
            </span>
          </div>
          {urls.isPending ? (
            <div className="text-muted-foreground/60 px-4 py-6 font-mono text-xs">
              loading…
            </div>
          ) : !urls.data?.items.length ? (
            <div className="text-muted-foreground px-4 py-6 text-sm">
              No links yet.{" "}
              <Link href="/onboarding" className="text-foreground underline underline-offset-4">
                Run onboarding
              </Link>{" "}
              or shorten one on the{" "}
              <Link href="/" className="text-foreground underline underline-offset-4">
                home page
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {urls.data.items.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="border-border/60 bg-muted/30 flex size-7 shrink-0 items-center justify-center rounded-md border">
                    <Link2 className="text-foreground size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground truncate font-mono text-sm">
                      spoo.me/{u.alias}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {u.long_url}
                    </div>
                  </div>
                  <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                    {u.total_clicks ?? 0} clicks
                  </span>
                  <ArrowUpRight className="text-muted-foreground/50 size-3.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
