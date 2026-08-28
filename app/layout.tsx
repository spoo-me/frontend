import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"

import "./globals.css"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { AuthProvider } from "@/components/auth/auth-context"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site-config"

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const fontSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · open-source link management with advanced analytics`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // "./" resolves per route against metadataBase, so every page self-canonicals
  // (kills www/trailing-slash/query duplicates; skipTrailingSlashRedirect stays).
  alternates: { canonical: "./" },
  keywords: [
    "link management",
    "URL shortener",
    "open source",
    "self-hosted",
    "API-first",
    "link analytics",
    "developer link platform",
    "spoo.me",
  ],
  authors: [{ name: "spoo.me", url: siteConfig.url }],
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: `${siteConfig.name} · open-source link management platform`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/favicon.png`,
  sameAs: [
    siteConfig.links.githubOrg,
    siteConfig.links.x,
    siteConfig.links.linkedin,
    siteConfig.links.instagram,
    siteConfig.links.producthunt,
  ],
}

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
}

export const viewport: Viewport = {
  // Single brand color: Discord and other embed scrapers ignore media-scoped
  // theme-color entries, so the pair meant no embed accent at all. Product
  // surfaces (dashboard, onboarding) override back to the neutral pair.
  themeColor: "#8B5CF6",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        fontSans.variable,
        fontMono.variable,
        fontSerif.variable,
        "scroll-smooth antialiased"
      )}
    >
      <body className="bg-background font-sans text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, webSiteJsonLd]),
          }}
        />
        {/* Pre-hydration auth hint (same trick as theme scripts): returning
            sessions mark <html> so the SSR'd dashboard gate never paints
            its text; sign-out clears the flag. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("spoo:authed")==="1")document.documentElement.classList.add("authed")}catch(e){}`,
          }}
        />
        <ThemeProvider defaultTheme="dark">
          <QueryProvider>
            <AuthProvider>
              <NuqsAdapter>{children}</NuqsAdapter>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
