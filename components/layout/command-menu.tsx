"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  Boxes,
  Code,
  FileText,
  Globe,
  Home,
  LineChart,
  Link2,
  Mail,
  Palette,
  QrCode,
  Rocket,
  Server,
  Shield,
  Star,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { PRICING_ENABLED } from "@/lib/flags"
import { TESTIMONIALS_LIVE } from "@/lib/testimonials"
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

type Entry = NavLink & { icon: React.ElementType }

const lucideMap: Record<string, LucideIcon> = {
  link: Link2,
  lineChart: LineChart,
  qr: QrCode,
  globe: Globe,
  server: Server,
  code: Code,
  rocket: Rocket,
  fileText: FileText,
  activity: Activity,
  users: Users,
  star: Star,
  shield: Shield,
  palette: Palette,
  mail: Mail,
  home: Home,
}

function resolve(link: NavLink): Entry {
  const lucide = lucideMap[link.iconKey]
  const brand = BrandIcons[link.iconKey as BrandIconKey]
  return { ...link, icon: lucide ?? brand ?? ArrowRight }
}

const pages: Entry[] = [
  { title: "Home", href: "/", iconKey: "home", icon: Home },
  ...(PRICING_ENABLED
    ? [
        {
          title: "Pricing",
          href: "/pricing",
          iconKey: "fileText",
          icon: FileText,
        },
      ]
    : []),
  { title: "All apps", href: "/apps", iconKey: "boxes", icon: Boxes },
  ...(TESTIMONIALS_LIVE
    ? [
        {
          title: "Customer stories",
          href: "/testimonials",
          iconKey: "star",
          icon: Star,
        },
      ]
    : []),
]

const productEntries = productLinks.map(resolve)
const featuredEntries = appsFeaturedLinks.map(resolve)
const appsEntries = appsRowLinks.map(resolve)
const sdkEntries = sdkLinks.map(resolve)
const docEntries = developerDocLinks.map(resolve)
const resourceEntries = developerResourceLinks.map(resolve)
const aboutEntries = companyAboutLinks.map(resolve)
const legalEntries = companyLegalLinks.map(resolve)

type CommandMenuProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandMenu({
  open: openProp,
  onOpenChange,
}: CommandMenuProps = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )
  const router = useRouter()

  React.useEffect(() => {
    if (isControlled) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isControlled, open, setOpen])

  function go(entry: Entry) {
    setOpen(false)
    if (entry.external) {
      window.open(entry.href, "_blank", "noopener,noreferrer")
      return
    }
    router.push(entry.href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, apps, SDKs, docs…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem
              key={p.href}
              value={`page ${p.title}`}
              onSelect={() => go(p)}
            >
              <p.icon className="size-4 text-muted-foreground" />
              <span>{p.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Product">
          {productEntries.map((e) => (
            <CommandItem
              key={e.href + e.title}
              value={`product ${e.title} ${e.description ?? ""}`}
              onSelect={() => go(e)}
            >
              <e.icon className="size-4 text-muted-foreground" />
              <span>{e.title}</span>
              {e.description && (
                <span className="ml-2 truncate text-muted-foreground/70 text-xs">
                  {e.description}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Apps & SDKs">
          {[...featuredEntries, ...appsEntries].map((e) => (
            <CommandItem
              key={`app-${e.href}`}
              value={`app ${e.title}`}
              onSelect={() => go(e)}
            >
              <e.icon className="size-4 text-muted-foreground" />
              <span>{e.title}</span>
              <CommandShortcut>app</CommandShortcut>
            </CommandItem>
          ))}
          {sdkEntries.map((e) => (
            <CommandItem
              key={`sdk-${e.href}`}
              value={`sdk ${e.title}`}
              onSelect={() => go(e)}
            >
              <e.icon className="size-4 text-muted-foreground" />
              <span>{e.title} SDK</span>
              <CommandShortcut>sdk</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Developers">
          {[...docEntries, ...resourceEntries].map((e) => (
            <CommandItem
              key={`dev-${e.href}-${e.title}`}
              value={`dev ${e.title}`}
              onSelect={() => go(e)}
            >
              <e.icon className="size-4 text-muted-foreground" />
              <span>{e.title}</span>
              {e.external && <CommandShortcut>↗</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Company">
          {[...aboutEntries, ...legalEntries].map((e) => (
            <CommandItem
              key={`co-${e.href}-${e.title}`}
              value={`company ${e.title}`}
              onSelect={() => go(e)}
            >
              <e.icon className="size-4 text-muted-foreground" />
              <span>{e.title}</span>
              {e.external && <CommandShortcut>↗</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Account">
          <CommandItem
            value="account sign in"
            onSelect={() =>
              go({
                title: "Sign in",
                href: siteConfig.app.login,
                iconKey: "user",
                icon: Users,
                external: true,
              })
            }
          >
            <Users className="size-4 text-muted-foreground" />
            <span>Sign in</span>
          </CommandItem>
          <CommandItem
            value="account get started"
            onSelect={() =>
              go({
                title: "Get started",
                href: siteConfig.app.signup,
                iconKey: "rocket",
                icon: Rocket,
                external: true,
              })
            }
          >
            <Rocket className="size-4 text-muted-foreground" />
            <span>Get started, free</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
