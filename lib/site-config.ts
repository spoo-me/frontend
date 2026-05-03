export const siteConfig = {
  name: "spoo.me",
  url: "https://spoo.me",
  description:
    "Free, open-source, API-first link management platform with advanced analytics. Self-hostable in one command.",
  ogImage: "/brand/logo-text-dark.png",
  links: {
    github: "https://github.com/spoo-me/spoo",
    githubOrg: "https://github.com/spoo-me",
    docs: "https://docs.spoo.me",
    api: "https://spoo.me/api",
    discord: "https://spoo.me/discord",
    twitter: "https://twitter.com/spoo_me",
    x: "https://x.com/spoo_me",
    instagram: "https://instagram.com/spoo.me",
    linkedin: "https://www.linkedin.com/company/spoo-me",
    producthunt: "https://www.producthunt.com/products/spoo-me-url-shortener",
    status: "https://status.spoo.me",
  },
  app: {
    shorten: "https://spoo.me",
    dashboard: "https://spoo.me/dashboard",
    login: "https://spoo.me/login",
    signup: "https://spoo.me/signup",
  },
} as const

export const stats = {
  clicks: 100_000_000,
  links: 5_000_000,
  contributors: 12,
  stars: 207,
  uptime: 99.99,
  apps: 8,
  sdks: 6,
} as const

export const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Apps", href: "/apps" },
  { label: "Developers", href: "/#developers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: siteConfig.links.docs, external: true },
] as const

export type NavLink = {
  title: string
  href: string
  description?: string
  iconKey: string
  external?: boolean
}

export const productLinks: NavLink[] = [
  {
    title: "Link shortener",
    href: "/#features",
    description: "API-first short links",
    iconKey: "link",
  },
  {
    title: "Analytics",
    href: "/#analytics",
    description: "Click, geo and referrer insights",
    iconKey: "lineChart",
  },
  {
    title: "QR codes",
    href: "/#features",
    description: "Branded QR codes with logo and colors",
    iconKey: "qr",
  },
  {
    title: "Custom domains",
    href: "/#features",
    description: "Branded short links on your domain",
    iconKey: "globe",
  },
  {
    title: "Self-hosting",
    href: "/#self-host",
    description: "Run on your own infra in one command",
    iconKey: "server",
  },
]

export const appsFeaturedLinks: NavLink[] = [
  {
    title: "Raycast",
    href: "/apps/raycast",
    description: "Shorten in milliseconds from the launcher",
    iconKey: "raycast",
  },
  {
    title: "Chrome",
    href: "/apps/chrome",
    description: "spoo-snap, one-click shorten any tab",
    iconKey: "chrome",
  },
]

export const appsRowLinks: NavLink[] = [
  {
    title: "Discord bot",
    href: "/apps/discord",
    description: "Shorten in any Discord server",
    iconKey: "discord",
  },
  {
    title: "Telegram bot",
    href: "/apps/telegram",
    description: "Shorten links from any chat",
    iconKey: "telegram",
  },
  {
    title: "Windows app",
    href: "/apps/windows",
    description: "Native taskbar shortener",
    iconKey: "windows",
  },
  {
    title: "iOS",
    href: "/apps/ios",
    description: "Coming soon to iPhone & iPad",
    iconKey: "apple",
  },
]

export const sdkLinks: NavLink[] = [
  {
    title: "Python",
    href: "/apps/sdk-python",
    description: "Pythonic client for spoo API",
    iconKey: "python",
  },
  {
    title: "TypeScript",
    href: "/apps/sdk-typescript",
    description: "Type-safe TS & JS bindings",
    iconKey: "typescript",
  },
  {
    title: "Rust",
    href: "/apps/sdk-rust",
    description: "Async-first Rust client",
    iconKey: "rust",
  },
  {
    title: "Go",
    href: "/apps/sdk-go",
    description: "Idiomatic Go bindings",
    iconKey: "go",
  },
]

export const developerDocLinks: NavLink[] = [
  {
    title: "API reference",
    href: siteConfig.links.docs,
    description: "Full REST API surface",
    iconKey: "code",
    external: true,
  },
  {
    title: "Quickstart",
    href: `${siteConfig.links.docs}/quickstart`,
    description: "Shorten your first link in 60 seconds",
    iconKey: "rocket",
    external: true,
  },
]

export const developerResourceLinks: NavLink[] = [
  {
    title: "Changelog",
    href: "/changelog",
    description: "What shipped recently",
    iconKey: "fileText",
  },
  {
    title: "GitHub",
    href: siteConfig.links.github,
    description: "Source, issues, releases",
    iconKey: "github",
    external: true,
  },
  {
    title: "Discord",
    href: siteConfig.links.discord,
    description: "Chat with the community",
    iconKey: "discord",
    external: true,
  },
]

export const companyAboutLinks: NavLink[] = [
  {
    title: "About us",
    href: "/about",
    description: "The story behind spoo.me",
    iconKey: "users",
  },
  {
    title: "Customer stories",
    href: "/testimonials",
    description: "Teams shipping with spoo in production",
    iconKey: "star",
  },
]

export const companyLegalLinks: NavLink[] = [
  {
    title: "Privacy policy",
    href: "/privacy",
    description: "How we handle your data",
    iconKey: "shield",
  },
  {
    title: "Terms of service",
    href: "/terms",
    description: "Rules of using spoo",
    iconKey: "fileText",
  },
  {
    title: "Brand assets",
    href: "/brand",
    description: "Logos, colors, guidelines",
    iconKey: "palette",
  },
  {
    title: "Contact",
    href: "https://spoo.me/contact",
    description: "Reach the team",
    iconKey: "mail",
    external: true,
  },
]

export const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Analytics", href: "/#analytics" },
    { label: "Pricing", href: "/pricing" },
    { label: "Self-host", href: "/#self-host" },
  ],
  apps: [
    { label: "All apps", href: "/apps" },
    { label: "Raycast", href: "/apps/raycast" },
    { label: "Chrome", href: "/apps/chrome" },
    { label: "Discord bot", href: "/apps/discord" },
    { label: "Windows app", href: "/apps/windows" },
  ],
  developers: [
    { label: "API reference", href: siteConfig.links.docs, external: true },
    { label: "Python SDK", href: "/apps/sdk-python" },
    { label: "TypeScript SDK", href: "/apps/sdk-typescript" },
    { label: "Rust SDK", href: "/apps/sdk-rust" },
    { label: "All SDKs", href: "/apps#sdks" },
  ],
  company: [
    { label: "GitHub", href: siteConfig.links.github, external: true },
    { label: "Login", href: "/login" },
    { label: "Sign up", href: "/signup" },
    { label: "Contact", href: "https://spoo.me/contact", external: true },
  ],
} as const
