"use client"

import * as React from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { motion, useScroll, useTransform } from "motion/react"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Code,
  FileText,
  Globe,
  LineChart,
  Link2,
  Mail,
  Rocket,
  Route,
  Server,
  Shield,
  Star,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { PRICING_ENABLED } from "@/lib/flags"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Logo } from "@/components/shared/logo"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { useAuth } from "@/components/auth/auth-context"
import { UserMenu } from "@/components/auth/user-menu"
import { CommandMenu } from "@/components/layout/command-menu"
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon"
import {
  appsFeaturedLinks,
  appsRowLinks,
  companyAboutLinks,
  companyLegalLinks,
  developerDocLinks,
  developerResourceLinks,
  productLinks,
  sdkLinks,
  siteConfig,
  type NavLink,
} from "@/lib/site-config"

const lucideMap: Record<string, LucideIcon> = {
  link: Link2,
  lineChart: LineChart,
  route: Route,
  globe: Globe,
  server: Server,
  code: Code,
  rocket: Rocket,
  fileText: FileText,
  activity: Activity,
  users: Users,
  star: Star,
  shield: Shield,
  mail: Mail,
}

function iconFor(key: string): React.ElementType {
  return lucideMap[key] ?? BrandIcons[key as BrandIconKey] ?? ArrowUpRight
}

/**
 * Accent lock: only third-party logos keep their brand identity color
 * (content, not chrome). All first-party icons fall back to spoo violet.
 */
const accentMap: Record<string, string> = {
  discord: "#5865F2",
  telegram: "#26A5E4",
  windows: "#00A4EF",
  apple: "#E5E5E5",
  raycast: "#FF6363",
  chrome: "#4285F4",
  python: "#3776AB",
  typescript: "#3178C6",
  rust: "#CE412B",
  go: "#00ADD8",
  github: "#E5E5E5",
}

function accentFor(key: string): string {
  return accentMap[key] ?? "#8B5CF6"
}

export function Header() {
  const [open, setOpen] = React.useState(false)
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const { user, loading: authLoading } = useAuth()
  const { scrollY } = useScroll()
  const blur = useTransform(scrollY, [0, 80], [0, 14])
  const bg = useTransform(scrollY, [0, 80], [0, 0.7])

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <motion.header
        style={{
          backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
          WebkitBackdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
        }}
        className="fixed inset-x-0 top-0 z-50 border-border/40 border-transparent border-b transition-colors"
      >
        <motion.div
          style={{ opacity: bg }}
          className="absolute inset-0 -z-10 bg-background/70"
        />
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left: logo */}
          <Logo />

          {/* Center: desktop nav — absolutely centered in the bar */}
          <NavigationMenu
            className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
            viewport
          >
            <NavigationMenuList className="gap-3">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">
                  Product
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ProductMenu />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">
                  Apps & SDKs
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <AppsMenu />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">
                  Developers
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <DevelopersMenu />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground">
                  Company
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <CompanyMenu />
                </NavigationMenuContent>
              </NavigationMenuItem>

              {PRICING_ENABLED && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/pricing"
                      className="rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground text-sm hover:bg-muted/0 hover:text-foreground"
                    >
                      Pricing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right: dev cluster */}
          <div className="flex items-center gap-1.5">
            {/* Session slot — placeholder while /auth/me settles, no layout shift */}
            {authLoading ? (
              <span className="hidden h-8 w-36 md:inline-block" aria-hidden />
            ) : user ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <span className="hidden md:inline-flex">
                  <UserMenu />
                </span>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <MenuToggleIcon open={open} className="size-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  )
}

function MobileAuthActions({ onClose }: { onClose: () => void }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="mt-4 h-[5.5rem]" aria-hidden />
  return (
    <div className="mt-4 flex flex-col gap-2">
      {user ? (
        <Button asChild size="default" className="w-full">
          <Link href="/dashboard" onClick={onClose}>
            Open dashboard
          </Link>
        </Button>
      ) : (
        <>
          <Button asChild variant="outline" size="default" className="w-full">
            <Link href="/login" onClick={onClose}>
              Sign in
            </Link>
          </Button>
          <Button asChild size="default" className="w-full">
            <Link href="/signup" onClick={onClose}>
              Get started
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}

/* ---------- Mega-menu panels ---------- */

const BRAND = "#8B5CF6"

function MenuShell({
  widthClass,
  children,
  footer,
}: {
  widthClass: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div
      className={cn("relative isolate [contain:layout_paint]", widthClass)}
      style={{ willChange: "transform" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 -z-10 size-48 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(closest-side, ${BRAND}30, transparent 70%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 -z-10 size-48 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(closest-side, #3694FF20, transparent 70%)`,
        }}
      />
      <div className="relative p-1.5">{children}</div>
      {footer && (
        <div className="relative border-border/40 border-t bg-muted/20 px-4 py-2.5">
          {footer}
        </div>
      )}
    </div>
  )
}

function MenuBox({
  label,
  children,
  className,
}: {
  label?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-border/40 bg-foreground/[0.025] p-2",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent"
      />
      {label && (
        <div className="mb-2 px-1.5 pt-1 font-medium font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

function PromoTile({
  link,
  accent = BRAND,
}: {
  link: NavLink
  accent?: string
}) {
  const Icon = iconFor(link.iconKey)
  return (
    <NavigationMenuLink asChild>
      <Link
        href={link.href}
        className="!block !p-0 hover:!bg-transparent h-full"
      >
        <div className="group relative flex h-full flex-col items-start overflow-hidden rounded-lg border border-border/60 bg-card/30 p-3.5 transition-colors hover:border-border/90">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
            style={{ backgroundColor: accent }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 bottom-0 size-32 rounded-full opacity-[0.10] blur-2xl"
            style={{ backgroundColor: accent }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, transparent, ${accent}99, transparent)`,
            }}
          />
          <div className="mb-3 flex size-9 items-center justify-center rounded-md border border-border/60 bg-background/40 shadow-black/40 shadow-sm ring-1 ring-foreground/[0.04] ring-inset transition-colors group-hover:border-border">
            <Icon className="size-4 text-foreground" />
          </div>
          <div className="font-semibold text-foreground text-sm leading-tight">
            {link.title}
          </div>
          {link.description && (
            <div className="mt-1.5 text-muted-foreground text-xs leading-snug">
              {link.description}
            </div>
          )}
          <div className="mt-auto inline-flex items-center gap-1.5 pt-3 font-medium text-muted-foreground text-xs opacity-0 transition-all duration-200 group-hover:text-foreground group-hover:opacity-100">
            Learn more
            <ArrowUpRight className="size-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </NavigationMenuLink>
  )
}

function ProductMenu() {
  const main = productLinks.filter((l) => l.iconKey !== "server")
  const promo = productLinks.find((l) => l.iconKey === "server")!
  return (
    <MenuShell
      widthClass="w-[54rem]"
      footer={
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">New to spoo?</span>
          <a
            href={siteConfig.links.docs}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 font-medium text-foreground"
          >
            Read the docs
            <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
          </a>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_16rem] gap-2">
        <MenuBox label="Capabilities">
          <div className="grid grid-cols-2 gap-0.5">
            {main.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
        <PromoTile link={promo} accent={accentFor(promo.iconKey)} />
      </div>
    </MenuShell>
  )
}

function AppsMenu() {
  return (
    <MenuShell
      widthClass="w-[54rem]"
      footer={
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Connect spoo to your stack
          </span>
          <Link
            href="/apps"
            className="group inline-flex items-center gap-1 font-medium text-foreground"
          >
            Browse all
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <MenuBox label="Featured">
          <div className="flex flex-col gap-0.5">
            {appsFeaturedLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
        <MenuBox label="Apps">
          <div className="flex flex-col gap-0.5">
            {appsRowLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
        <MenuBox label="SDKs">
          <div className="flex flex-col gap-0.5">
            {sdkLinks.map((l) => (
              <CardItem
                key={l.title}
                link={{ ...l, title: `${l.title} SDK` }}
              />
            ))}
          </div>
        </MenuBox>
      </div>
    </MenuShell>
  )
}

function DevelopersMenu() {
  return (
    <MenuShell widthClass="w-[44rem]">
      <div className="grid grid-cols-2 gap-2">
        <MenuBox label="Docs">
          <div className="flex flex-col gap-0.5">
            {developerDocLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
        <MenuBox label="Resources">
          <div className="flex flex-col gap-0.5">
            {developerResourceLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
      </div>
    </MenuShell>
  )
}

function CompanyMenu() {
  return (
    <MenuShell widthClass="w-[44rem]">
      <div className="grid grid-cols-2 gap-2">
        <MenuBox label="About">
          <div className="flex flex-col gap-0.5">
            {companyAboutLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
        <MenuBox label="Legal & more">
          <div className="flex flex-col gap-0.5">
            {companyLegalLinks.map((l) => (
              <CardItem key={l.title} link={l} />
            ))}
          </div>
        </MenuBox>
      </div>
    </MenuShell>
  )
}

function CardItem({ link }: { link: NavLink }) {
  const Icon = iconFor(link.iconKey)
  const external = link.external
  const accent = accentFor(link.iconKey)
  const Inner = (
    <div
      className="group relative flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-foreground/[0.04]"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div className="relative shrink-0">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70"
          style={{
            background: `radial-gradient(closest-side, ${accent}66, transparent 70%)`,
          }}
        />
        <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30 shadow-black/30 shadow-sm ring-1 ring-foreground/[0.04] ring-inset">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              backgroundImage: `linear-gradient(140deg, ${accent}26 0%, transparent 55%), linear-gradient(to bottom, color-mix(in srgb, ${accent} 6%, transparent), color-mix(in srgb, ${accent} 16%, transparent))`,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-4 -right-4 size-10 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(closest-side, ${accent}88, transparent)`,
            }}
          />
          <span
            aria-hidden
            className="shimmer-border pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ ["--shimmer-color" as never]: accent }}
          />
          <Icon className="relative size-4 text-foreground/85 transition-colors duration-200 group-hover:text-[color:var(--accent)]" />
        </div>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="inline-flex items-center gap-1 font-medium text-foreground text-sm leading-tight">
          {link.title}
          {external && (
            <ArrowUpRight className="size-3 text-muted-foreground transition-all group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-foreground" />
          )}
        </div>
        {link.description && (
          <div className="mt-1 text-muted-foreground text-xs leading-snug">
            {link.description}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <NavigationMenuLink asChild>
      {external ? (
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="!block !p-0 hover:!bg-transparent"
        >
          {Inner}
        </a>
      ) : (
        <Link href={link.href} className="!block !p-0 hover:!bg-transparent">
          {Inner}
        </Link>
      )}
    </NavigationMenuLink>
  )
}

/* ---------- Mobile menu ---------- */

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted || typeof window === "undefined") return null
  if (!open) return null

  return createPortal(
    <div
      id="mobile-menu"
      className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 md:hidden"
    >
      <div className="flex flex-col gap-1 px-4 py-5 pb-24">
        <Section_Mobile
          label="Product"
          items={productLinks}
          onClose={onClose}
        />
        <Section_Mobile
          label="Apps & SDKs"
          items={[...appsFeaturedLinks, ...appsRowLinks, ...sdkLinks]}
          onClose={onClose}
        />
        <Section_Mobile
          label="Developers"
          items={[...developerDocLinks, ...developerResourceLinks]}
          onClose={onClose}
        />
        <Section_Mobile
          label="Company"
          items={[...companyAboutLinks, ...companyLegalLinks]}
          onClose={onClose}
        />

        {PRICING_ENABLED && (
          <div className="mt-2 border-border/60 border-t pt-3">
            <Link
              href="/pricing"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-2 py-2 font-medium text-foreground text-sm hover:bg-muted/50"
            >
              Pricing
            </Link>
          </div>
        )}

        <MobileAuthActions onClose={onClose} />

        <div className="mt-6 flex items-center gap-3 px-2 text-muted-foreground/70 text-xs">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <BrandIcons.github className="size-3.5" /> GitHub
          </a>
          <a
            href={siteConfig.links.discord}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <BrandIcons.discord className="size-3.5" /> Discord
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Section_Mobile({
  label,
  items,
  onClose,
}: {
  label: string
  items: readonly NavLink[]
  onClose: () => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <div className="border-border/40 border-b py-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 font-medium text-foreground text-sm"
        aria-expanded={expanded}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ul className="flex flex-col gap-0.5 pb-2">
          {items.map((l) => {
            const Icon = iconFor(l.iconKey)
            const inner = (
              <span className="flex items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    {l.title}
                    {l.external && (
                      <ArrowUpRight className="size-3 opacity-60" />
                    )}
                  </span>
                  {l.description && (
                    <span className="mt-0.5 block text-muted-foreground text-xs leading-snug">
                      {l.description}
                    </span>
                  )}
                </span>
              </span>
            )
            return (
              <li key={l.title}>
                {l.external ? (
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="block"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={l.href} onClick={onClose} className="block">
                    {inner}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
