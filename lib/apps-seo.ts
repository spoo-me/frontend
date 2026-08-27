/* Search-facing titles and descriptions for /apps/[slug] pages.
   Meta tags only — visible page copy stays in apps-data.ts. */

type AppSeo = { title: string; description: string }

export const appsSeo: Record<string, AppSeo> = {
  "spoo-raycast": {
    title: "Raycast URL Shortener Extension",
    description:
      "Shorten links, check click analytics, and manage your spoo.me short links from Raycast without leaving the launcher. Free and open source.",
  },
  "spoo-snap": {
    title: "URL Shortener Chrome Extension",
    description:
      "Shorten the current tab in one click and manage links from Chrome's side panel. Free, open-source Chrome extension for spoo.me.",
  },
  "spoo-desktop": {
    title: "URL Shortener for Windows",
    description:
      "Native WinUI 3 desktop client for spoo.me. Shorten and manage short links straight from your Windows taskbar.",
  },
  "spoo-discord": {
    title: "Discord Link Shortener Bot",
    description:
      "Shorten and track spoo.me short links from any Discord server. Free bot with click analytics built in.",
  },
  "spoo-telegram": {
    title: "Telegram Link Shortener Bot",
    description:
      "Shorten links inline in any Telegram chat with the free spoo.me bot, no app switching needed.",
  },
  android: {
    title: "URL Shortener App for Android",
    description:
      "Material You Android app for spoo.me. Shorten, manage, and track short links from your phone.",
  },
  apple: {
    title: "URL Shortener App for iOS",
    description:
      "Native iOS app for spoo.me with Shortcuts support. Shorten and track links from iPhone and iPad.",
  },
  "spoo-slack": {
    title: "Slack Link Shortener",
    description:
      "Shorten and track spoo.me short links from any Slack workspace without leaving the conversation.",
  },
  "sdk-python": {
    title: "Python URL Shortener SDK",
    description:
      "Official Python SDK for the spoo.me URL shortener API. pip install spoo, create short links, and read click analytics in a few lines.",
  },
  "sdk-typescript": {
    title: "TypeScript URL Shortener SDK",
    description:
      "Official type-safe TypeScript SDK for the spoo.me URL shortener API. Works on Node, Bun, Deno, and edge runtimes.",
  },
  "sdk-rust": {
    title: "Rust URL Shortener SDK",
    description:
      "Official async Rust client for the spoo.me URL shortener API. Create short links and read analytics with type-safe bindings.",
  },
  "sdk-go": {
    title: "Go URL Shortener SDK",
    description:
      "Official Go SDK for the spoo.me URL shortener API. Idiomatic, context-aware, and dependency-free.",
  },
  "sdk-kotlin": {
    title: "Kotlin URL Shortener SDK",
    description:
      "Official coroutines-first Kotlin Multiplatform SDK for the spoo.me URL shortener API, for Android and the JVM.",
  },
  "sdk-cpp": {
    title: "C++ URL Shortener SDK",
    description:
      "Modern C++20 header-only client for the spoo.me URL shortener API, easy to embed in any project.",
  },
  "spoo-cli": {
    title: "URL Shortener CLI",
    description:
      "Shorten links from your terminal with the spoo.me CLI. One command to create, list, and track short links.",
  },
  n8n: {
    title: "n8n URL Shortener Node",
    description:
      "Drop-in n8n node for spoo.me. Shorten and track links inside your automation workflows.",
  },
  "spoo-zapier": {
    title: "Zapier URL Shortener Integration",
    description:
      "Connect spoo.me to 6000+ apps with Zapier and shorten or track links from your existing workflows.",
  },
}
