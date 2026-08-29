import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { type FaqItem, FaqJsonLd, FaqList } from "@/components/shared/faq"
import { Band } from "@/components/shared/section-shell"
import { siteConfig } from "@/lib/site-config"

const linkClass =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"

const FAQ: FaqItem[] = [
  {
    q: "Is spoo.me free?",
    a: "Yes. Every link, every click, every stat, no card and no trial. The code is open source and runs on one server, so nothing here is a loss-leader waiting to be fenced off.",
  },
  {
    q: "Do I need an account to shorten a link?",
    a: "No. Paste a URL on the homepage and you get a short link. An account adds the dashboard, editing, and full click history, and links you made while signed out can be claimed into it later.",
  },
  {
    q: "Do short links expire?",
    a: "No. A link lives until you delete it. Expiry is opt-in: give it an end date or a maximum number of clicks and it retires itself.",
  },
  {
    q: "What do the analytics show?",
    a: "Clicks over time, country and city, device, browser, OS, referrer, and UTM tags. No script goes on your destination page and no cookie is set in the visitor's browser. The redirect itself is the measurement.",
  },
  {
    q: "Can I choose the short code?",
    a: "Yes. Three to sixteen characters of letters, numbers, hyphens and underscores, or an all-emoji alias. Add a password, an expiry date or a click limit on the same form.",
  },
  {
    q: "Is it safe to click a spoo.me link?",
    a: (
      <>
        Every link has a public preview page at spoo.me/code+ that shows the
        destination, the page&apos;s own title and image, and live stats before
        you go anywhere. Links matching known abuse patterns are refused at
        creation, and anything{" "}
        <Link href="/report" className={linkClass}>
          reported
        </Link>{" "}
        gets taken down.
      </>
    ),
  },
  {
    q: "Is there an API?",
    a: (
      <>
        Yes,{" "}
        <a
          href={siteConfig.links.docs}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          free and documented
        </a>
        , with official SDKs for Python, TypeScript, Go and Rust, a CLI, and{" "}
        <Link href="/apps" className={linkClass}>
          apps
        </Link>{" "}
        for Raycast, Chrome and Discord. Links and stats export through it too.
      </>
    ),
  },
  {
    q: "Can I run it myself?",
    a: (
      <>
        Yes. AGPL licensed, Docker Compose, your own domain and your own
        database. It is the{" "}
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          same code
        </a>{" "}
        that serves spoo.me, not a cut-down community build.
      </>
    ),
  },
]

export function Faq() {
  return (
    <Band
      id="faq"
      className="grid gap-10 px-5 py-20 sm:px-9 sm:py-24 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20"
    >
      <FaqJsonLd items={FAQ} />
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="label-mono text-muted-foreground">FAQ</span>
        <h2 className="mt-3 text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-muted-foreground">
          What people ask before they trust a shortener with their links.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-1 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          Ask us anything else
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {/* Offsets the first trigger's padding so its question aligns with the
          FAQ label opposite it */}
      <div className="lg:-mt-3.5">
        <FaqList items={FAQ} answerClassName="max-w-[36rem]" />
      </div>
    </Band>
  )
}
