"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TocItem = { id: string; title: string }

export function LegalToc({ toc }: { toc: TocItem[] }) {
  const [active, setActive] = React.useState<string | null>(toc[0]?.id ?? null)
  const navRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!headings.length) return

    // On any heading crossing, recompute: active = last heading above the
    // reading line. Survives instant jumps where no heading sits in a band.
    const recompute = () => {
      let current = headings[0].id
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 120) current = h.id
        else break
      }
      setActive(current)
    }
    const observer = new IntersectionObserver(recompute, {
      rootMargin: "0px 0px -60% 0px",
    })
    headings.forEach((h) => observer.observe(h))
    recompute()
    return () => observer.disconnect()
  }, [toc])

  // Keep the active item visible inside the scrollable TOC list
  React.useEffect(() => {
    if (!active || !navRef.current) return
    navRef.current
      .querySelector(`a[href="#${CSS.escape(active)}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active])

  return (
    <nav ref={navRef} aria-label="Table of contents">
      <ul className="border-border/40 flex max-h-[60vh] flex-col gap-1 overflow-y-auto border-l pr-2 [scrollbar-width:thin]">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "-ml-px block border-l py-1 pl-3 text-[13px] leading-snug transition-colors",
                active === item.id
                  ? "border-foreground/60 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:border-foreground/40 border-transparent",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
