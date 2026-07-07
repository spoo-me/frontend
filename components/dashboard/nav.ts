import {
  AppWindow,
  ChartLine,
  Globe,
  House,
  KeyRound,
  Link2,
  Webhook,
  type LucideIcon,
} from "lucide-react"

export type DashboardNavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** Feature-flagged items render only when their flag is on. */
  flag?: "webhooks" | "billing"
  /** Match nested routes (e.g. /dashboard/links/abc) for the active state. */
  matchPrefix?: boolean
}

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

/** Flags for surfaces whose backend does not exist yet (SPEC.md §2). */
export const dashboardFlags = {
  webhooks: false,
  billing: false,
} as const

export const dashboardNav: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Overview", href: "/dashboard", icon: House },
      {
        title: "Links",
        href: "/dashboard/links",
        icon: Link2,
        matchPrefix: true,
      },
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: ChartLine,
        matchPrefix: true,
      },
    ],
  },
  {
    label: "Connect",
    items: [
      {
        title: "Domains",
        href: "/dashboard/domains",
        icon: Globe,
        matchPrefix: true,
      },
      {
        title: "Apps",
        href: "/dashboard/apps",
        icon: AppWindow,
        matchPrefix: true,
      },
      {
        title: "Webhooks",
        href: "/dashboard/webhooks",
        icon: Webhook,
        flag: "webhooks",
        matchPrefix: true,
      },
    ],
  },
  {
    label: "Developer",
    items: [
      {
        title: "API Keys",
        href: "/dashboard/developer",
        icon: KeyRound,
        matchPrefix: true,
      },
    ],
  },
]

export function isNavItemActive(pathname: string, item: DashboardNavItem) {
  if (item.matchPrefix) return pathname.startsWith(item.href)
  return pathname === item.href
}
