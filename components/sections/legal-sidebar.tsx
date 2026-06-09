"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type DocMeta = { slug: string; title: string }
type TocItem = { id: string; title: string }

export function LegalSidebar({
  docs,
  upcoming,
  activeSlug,
  toc,
}: {
  docs: DocMeta[]
  upcoming: readonly string[]
  activeSlug: string
  toc: TocItem[]
}) {
  const [activeSection, setActiveSection] = React.useState<string | null>(
    toc[0]?.id ?? null,
  )
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
      setActiveSection(current)
    }
    const observer = new IntersectionObserver(recompute, {
      rootMargin: "0px 0px -60% 0px",
    })
    headings.forEach((h) => observer.observe(h))
    recompute()
    return () => observer.disconnect()
  }, [toc])

  // Keep the active section visible inside the scrollable sidebar
  React.useEffect(() => {
    if (!activeSection || !navRef.current) return
    navRef.current
      .querySelector(`a[href="#${CSS.escape(activeSection)}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeSection])

  return (
    <nav
      ref={navRef}
      aria-label="Legal documents"
      className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 [scrollbar-width:thin]"
    >
      <ul className="flex flex-col gap-3.5">
        {docs.map((d) => {
          const isActiveDoc = d.slug === activeSlug
          return (
            <li key={d.slug}>
              <Link
                href={`/${d.slug}`}
                aria-current={isActiveDoc ? "page" : undefined}
                className={cn(
                  "block text-sm leading-snug transition-colors",
                  isActiveDoc
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d.title}
              </Link>

              {/* Section tree — only the open document unfolds */}
              {isActiveDoc && toc.length > 0 && (
                <ul className="border-border/40 mt-2.5 mb-1 flex flex-col gap-0.5 border-l">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        aria-current={activeSection === item.id ? "true" : undefined}
                        className={cn(
                          "-ml-px block border-l py-1 pl-3 text-[13px] leading-snug transition-colors",
                          activeSection === item.id
                            ? "border-foreground/60 text-foreground font-medium"
                            : "text-muted-foreground/80 hover:text-foreground border-transparent",
                        )}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
        {upcoming.map((title) => (
          <li key={title}>
            <span className="text-muted-foreground/40 block cursor-default text-sm leading-snug">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
