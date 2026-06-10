import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-context"
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
    default: `${siteConfig.name} — open-source link management platform for developers`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
    title: `${siteConfig.name} — open-source link management platform`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        fontSans.variable,
        fontMono.variable,
        fontSerif.variable,
        "scroll-smooth antialiased",
      )}
    >
      <body className="bg-background text-foreground font-sans">
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
