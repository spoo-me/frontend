import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { BrandIcons } from "@/components/icons/brand-icons"
import { footerLinks, siteConfig } from "@/lib/site-config"
import { StatusBadge } from "./status-badge"
import { ThemeToggle } from "./theme-toggle"

export function Footer() {
  const sections: {
    title: string
    links: readonly { label: string; href: string; external?: boolean }[]
  }[] = [
    { title: "Product", links: footerLinks.product },
    { title: "Apps & SDKs", links: footerLinks.apps },
    { title: "Developers", links: footerLinks.developers },
    { title: "Company", links: footerLinks.company },
  ]

  return (
    <footer className="border-border/60 relative overflow-hidden border-t">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-0 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Free, open-source link management platform with advanced analytics. Built by
              developers, for developers.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {(
                [
                  { key: "github", label: "GitHub", href: siteConfig.links.github },
                  { key: "discord", label: "Discord", href: siteConfig.links.discord },
                  { key: "x", label: "X (Twitter)", href: siteConfig.links.x },
                  {
                    key: "instagram",
                    label: "Instagram",
                    href: siteConfig.links.instagram,
                  },
                  { key: "linkedin", label: "LinkedIn", href: siteConfig.links.linkedin },
                  {
                    key: "producthunt",
                    label: "Product Hunt",
                    href: siteConfig.links.producthunt,
                  },
                ] as const
              ).map(({ key, label, href }) => {
                const Icon = BrandIcons[key]
                return (
                  <Link
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <Icon className="size-4" />
                  </Link>
                )
              })}
            </div>
            <StatusBadge />
          </div>
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="label-mono text-foreground/90">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="text-muted-foreground hover:text-foreground text-sm transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/40 mt-12 flex items-center justify-between border-t pt-5">
          <p className="text-muted-foreground/70 text-xs">
            © {new Date().getFullYear()} spoo.me, open source under Apache 2.0
          </p>
          <ThemeToggle />
        </div>
      </div>

      {/* Giant wordmark */}
      <div
        aria-hidden
        className="pointer-events-none relative -mt-8 select-none overflow-hidden"
      >
        <div
          className="text-foreground/[0.06] mx-auto max-w-[1400px] whitespace-nowrap text-center font-semibold leading-[0.85] tracking-[-0.06em]"
          style={{
            fontSize: "clamp(8rem, 28vw, 22rem)",
          }}
        >
          spoo.me
        </div>
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" />
      </div>
    </footer>
  )
}
