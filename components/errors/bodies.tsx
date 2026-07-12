import Link from "next/link"

import { Button } from "@/components/ui/button"

/**
 * The quieter error bodies. 410 is a true dead end — the visitor wanted a
 * destination that's gone, so no shortener box, no pitch, just the honest
 * exit (a 404's claim box works because THAT alias is free; here it isn't).
 * 451 is the sober flagship: reputation defense, zero fun, zero
 * fearmongering, and it never echoes user-controlled input. 429/5xx stay
 * dry and small.
 */

export function GoneBody() {
  return (
    <div className="max-w-xl">
      <h1 className="font-semibold text-3xl text-foreground tracking-tight">
        This link has ended.
      </h1>
      <p className="mt-3 text-muted-foreground text-sm">
        It expired, reached its click limit, or was paused by its owner.
      </p>
      <div className="mt-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}

export function BlockedBody() {
  return (
    <div className="max-w-xl">
      <h1 className="font-semibold text-3xl text-foreground tracking-tight">
        spoo.me blocked this link.
      </h1>
      <p className="mt-3 text-muted-foreground text-sm">
        Our safety systems stopped this short link. You were likely just
        protected from a scam or a malicious page.
      </p>
      <p className="mt-3 text-muted-foreground text-sm">
        spoo.me is a link shortener anyone can use. We did not send you this
        link; the sender did. Its destination broke our rules, so the link no
        longer works.
      </p>
      <ul className="mt-8 space-y-3 border-border/60 border-t pt-6">
        {[
          "Never enter passwords or card details on a page a message sent you to.",
          "Urgency is the oldest trick in the book. Real services don't rush you.",
          "You can inspect any spoo.me link before opening it by adding + to the end.",
        ].map((tip, i) => (
          <li key={tip} className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-[11px] text-muted-foreground/50 tabular-nums">
              0{i + 1}
            </span>
            <span className="text-muted-foreground text-sm">{tip}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button asChild variant="outline" size="sm">
          <a href="/report">Report the message that sent you here</a>
        </Button>
      </div>
    </div>
  )
}

export function RateLimitBody() {
  return (
    <div className="max-w-xl">
      <h1 className="font-semibold text-3xl text-foreground tracking-tight">
        Slow down.
      </h1>
      <p className="mt-3 text-muted-foreground text-sm">
        You&apos;re moving faster than we can keep up. Give it a moment and try
        again.
      </p>
    </div>
  )
}

export function ServerErrorBody({ status }: { status: string }) {
  const upstream = status === "502" || status === "503"
  return (
    <div className="max-w-xl">
      <h1 className="font-semibold text-3xl text-foreground tracking-tight">
        {upstream
          ? "We're having trouble reaching the service."
          : "Something broke. It wasn't you."}
      </h1>
      <p className="mt-3 text-muted-foreground text-sm">
        {upstream
          ? "spoo.me is up, but this request didn't make it through. It usually passes in moments."
          : "An error on our side stopped this page. We log every one of these; try again in a minute."}
      </p>
      <p className="mt-8 font-mono text-[11px] text-muted-foreground/70">
        live status at{" "}
        <a
          href="https://status.spoo.me"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
        >
          status.spoo.me
        </a>
      </p>
    </div>
  )
}
