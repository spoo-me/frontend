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
