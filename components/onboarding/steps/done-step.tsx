"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"
import { HEARD_FROM_OPTIONS, type OnboardingState } from "@/lib/onboarding"

export function DoneStep({
  state,
  onFinish,
}: {
  state: OnboardingState
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

  const checklist: { label: string; done: boolean; detail?: string }[] = [
    { label: "Account created", done: true, detail: user?.email },
    { label: "Email verified", done: !!user?.email_verified },
    state.artifact?.kind === "key"
      ? {
          label: "API key generated",
          done: true,
          detail: state.artifact.tokenPrefix + "…",
        }
      : {
          label: "First link created",
          done: state.artifact?.kind === "link",
          detail:
            state.artifact?.kind === "link"
              ? state.artifact.shortUrl.replace(/^https?:\/\//, "")
              : undefined,
        },
  ]

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="border-live/30 bg-live/10 flex size-12 items-center justify-center rounded-full border">
        <CircleCheck className="text-live size-5" aria-hidden />
      </div>
      <h1 className="text-foreground mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        You&apos;re in
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        Your workspace is ready. Here&apos;s where you stand:
      </p>

      <ul className="border-border/60 bg-card/50 mt-8 w-full max-w-sm divide-y rounded-xl border text-left">
        {checklist.map((item) => (
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
                item.done ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {item.label}
            </span>
            {item.detail && (
              <span className="text-muted-foreground max-w-36 truncate font-mono text-xs">
                {item.detail}
              </span>
            )}
          </li>
        ))}
        <li className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden className="border-border/80 size-4 shrink-0 rounded-full border" />
          <span className="text-muted-foreground flex-1 text-sm">
            Get spoo.me everywhere
          </span>
          <Link
            href="/apps"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-xs font-medium transition-colors"
          >
            Browse apps <ArrowUpRight className="size-3" />
          </Link>
        </li>
      </ul>

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

      <Button onClick={() => onFinish(heardFrom ?? undefined)} className="mt-10 h-10 min-w-48">
        Go to dashboard
        <ArrowRight className="size-4" data-icon="inline-end" />
      </Button>
      <p className="label-mono text-muted-foreground/50 mt-3 text-[10px]">
        press ↵ to finish
      </p>
    </div>
  )
}
