export type ConnectedApp = {
  slug: string
  name: string
  category: "extension" | "desktop" | "mobile" | "bot" | "sdk" | "cli"
  tagline: string
  description: string
  iconKey: string
  color: string
  url: string
  github?: string
  install?: { label: string; command: string }[]
  installNotes?: string[]
  features: string[]
  status: "live" | "beta" | "soon"
  gallery?: string[]
}

export const connectedApps: ConnectedApp[] = [
  {
    slug: "spoo-raycast",
    name: "Raycast",
    category: "extension",
    tagline: "Shorten links from Raycast in milliseconds",
    description:
      "Native Raycast extension. Shorten, view analytics, manage links, all without leaving your launcher.",
    iconKey: "raycast",
    color: "#FF6363",
    url: "https://raycast.com/store",
    github: "https://github.com/spoo-me/spoo-raycast",
    install: [
      { label: "Raycast Store", command: "Search 'spoo.me' in Raycast Store" },
    ],
    features: [
      "Quick shorten command",
      "My Links browser with rich detail view",
      "Live click analytics",
      "Edit, pause, delete from Raycast",
      "QR code generation",
    ],
    status: "soon",
    gallery: [
      "/apps/raycast/spoo-1.png",
      "/apps/raycast/spoo-2.png",
      "/apps/raycast/spoo-3.png",
      "/apps/raycast/spoo-4.png",
      "/apps/raycast/spoo-5.png",
      "/apps/raycast/spoo-6.png",
    ],
  },
  {
    slug: "spoo-snap",
    name: "Chrome Extension",
    category: "extension",
    tagline: "spoo-snap: one-click shorten any tab",
    description:
      "Built with WXT + React 19 + TypeScript. Shorten current tab, manage links, view analytics in side panel.",
    iconKey: "chrome",
    color: "#EA4335",
    url: "https://chromewebstore.google.com",
    github: "https://github.com/spoo-me/spoo-snap",
    install: [{ label: "Chrome Web Store", command: "Add to Chrome" }],
    features: [
      "One-click tab shortening",
      "Side panel link manager",
      "QR code generation",
      "Stats inline",
      "Firefox-compatible",
    ],
    status: "soon",
  },
  {
    slug: "spoo-desktop",
    name: "Windows App",
    category: "desktop",
    tagline: "Native WinUI 3 desktop client",
    description:
      "spooWASDK: fluent native Windows app built with WinUI 3 and C#. Acrylic UI, system tray, hotkeys.",
    iconKey: "windows",
    color: "#00A4EF",
    url: "https://apps.microsoft.com/detail/9mtwpjxlb0gr",
    github: "https://github.com/spoo-me/spooWASDK",
    install: [
      { label: "Microsoft Store", command: "Get it on the Microsoft Store" },
      { label: "Download .msix", command: "Latest release on GitHub" },
    ],
    features: [
      "Native Mica/Acrylic UI",
      "System tray quick-shorten",
      "Global hotkey",
      "Offline link history",
    ],
    status: "live",
    gallery: [
      "/apps/windows/spoo-1.png",
      "/apps/windows/spoo-2.png",
      "/apps/windows/spoo-3.png",
    ],
  },
  {
    slug: "spoo-discord",
    name: "Discord Bot",
    category: "bot",
    tagline: "Shorten & track from any Discord server",
    description:
      "spoo-bot: slash commands, code samples in 19+ languages, chart generation, server-wide analytics.",
    iconKey: "discord",
    color: "#5865F2",
    url: "https://discord.com/api/oauth2/authorize",
    github: "https://github.com/spoo-me/spoo-bot",
    install: [{ label: "Add to server", command: "/invite spoo-bot" }],
    features: [
      "Slash commands",
      "19+ language code generation",
      "Chart generation",
      "Server analytics",
    ],
    status: "soon",
  },
  {
    slug: "spoo-telegram",
    name: "Telegram Bot",
    category: "bot",
    tagline: "Inline link shortening anywhere on Telegram",
    description:
      "Inline mode + commands. Shorten URLs in any chat, track clicks, manage from /links.",
    iconKey: "telegram",
    color: "#26A5E4",
    url: "https://t.me/spoo_me_bot",
    install: [{ label: "Open in Telegram", command: "@spoo_me_bot" }],
    features: ["Inline mode", "Click tracking", "Custom alias", "QR codes"],
    status: "soon",
  },
  {
    slug: "android",
    name: "Android",
    category: "mobile",
    tagline: "Material 3 Expressive shortener for Android",
    description:
      "Fully Material 3 Expressive, with share-sheet shortening, configurable home-screen widgets, emoji aliases, and the full analytics suite.",
    iconKey: "android",
    color: "#3DDC84",
    url: "https://spoo.me/android",
    github: "https://github.com/spoo-me/spoo-android",
    install: [
      {
        label: "Download",
        command: "https://spoo.me/android",
      },
      {
        label: "Obtainium",
        command: "https://github.com/spoo-me/spoo-android",
      },
    ],
    installNotes: [
      "Tap Download. If Chrome warns the file might be harmful, choose Download anyway. That warning is standard for apps installed from outside the Play Store.",
      "Open the downloaded file and allow installing from your browser when asked.",
      "For automatic updates, add the repo link to Obtainium instead.",
    ],
    features: [
      "Material 3 Expressive",
      "Share Sheet integration",
      "Home-screen widgets",
      "Full analytics",
      "Emoji aliases",
    ],
    status: "live",
    gallery: [
      "/apps/android/hero.webp",
      "/apps/android/analytics.webp",
      "/apps/android/link-stats.webp",
      "/apps/android/links.webp",
      "/apps/android/widget.webp",
      "/apps/android/emoji.webp",
      "/apps/android/share.webp",
      "/apps/android/filters.webp",
      "/apps/android/widget-builder.webp",
      "/apps/android/dark.webp",
      "/apps/android/login.webp",
    ],
  },
  {
    slug: "apple",
    name: "iOS",
    category: "mobile",
    tagline: "Native iOS app with Shortcuts support",
    description:
      "Built in Swift with full Shortcuts.app integration. Share extension, widgets, Siri.",
    iconKey: "apple",
    color: "#A2AAAD",
    url: "https://github.com/spoo-me",
    install: [{ label: "App Store", command: "Coming soon" }],
    features: [
      "Share extension",
      "iOS Shortcuts",
      "Lock-screen widgets",
      "Siri intents",
    ],
    status: "soon",
  },
  {
    slug: "spoo-slack",
    name: "Slack",
    category: "bot",
    tagline: "Shorten + track from any Slack workspace",
    description:
      "Slash commands, link unfurls with live click counts, and per-channel analytics.",
    iconKey: "slack",
    color: "#E01E5A",
    url: "https://slack.com/apps",
    install: [{ label: "Slack App Directory", command: "Add to Slack" }],
    features: [
      "Slash commands",
      "Link unfurls",
      "Per-channel analytics",
      "OAuth scoped",
    ],
    status: "soon",
  },
  {
    slug: "sdk-python",
    name: "Python SDK",
    category: "sdk",
    tagline: "spoo: pip install and ship",
    description:
      "Typed sync and async clients for the whole API: links, analytics, exports, emoji aliases, claiming, and Sign in with Spoo. Published on PyPI.",
    iconKey: "python",
    color: "#FFE873",
    url: "https://pypi.org/project/spoo/",
    github: "https://github.com/spoo-me/spoo-py",
    install: [
      { label: "pip", command: "pip install spoo" },
      { label: "uv", command: "uv add spoo" },
    ],
    features: [
      "Sync + async clients",
      "Fully typed",
      "Sign in with Spoo",
      "Automatic retries",
    ],
    status: "live",
    gallery: ["/apps/python/spoo-1.png"],
  },
  {
    slug: "sdk-typescript",
    name: "TypeScript SDK",
    category: "sdk",
    tagline: "Type-safe API for Node, Bun, Deno, edge runtimes",
    description:
      "Zero-dep, fully typed TypeScript client. Works in browser, Node, Bun, Deno, Cloudflare Workers.",
    iconKey: "typescript",
    color: "#3178C6",
    url: "https://www.npmjs.com/package/spoo.me",
    github: "https://github.com/spoo-me/spoo-ts",
    install: [
      { label: "npm", command: "npm i spoo.me" },
      { label: "bun", command: "bun add spoo.me" },
    ],
    features: [
      "Edge-runtime ready",
      "Zero deps",
      "Fully typed",
      "Automatic retries",
    ],
    status: "live",
    gallery: ["/apps/typescript/spoo-1.png"],
  },
  {
    slug: "sdk-rust",
    name: "Rust SDK",
    category: "sdk",
    tagline: "Async Rust client for the spoo API",
    description:
      "Async Rust client built on tokio + reqwest, with a blocking mode behind a feature flag.",
    iconKey: "rust",
    color: "#DEA584",
    url: "https://crates.io/crates/spoo-me",
    github: "https://github.com/spoo-me/spoo-rust",
    install: [{ label: "cargo", command: "cargo add spoo-me" }],
    features: [
      "Tokio async",
      "Builder pattern",
      "Result-based errors",
      "Blocking mode",
    ],
    status: "live",
    gallery: ["/apps/rust/spoo-1.png"],
  },
  {
    slug: "sdk-go",
    name: "Go SDK",
    category: "sdk",
    tagline: "Idiomatic Go: context-aware, zero-deps",
    description:
      "Idiomatic Go client with context cancellation. Perfect for serverless and cloud-native apps.",
    iconKey: "go",
    color: "#00ADD8",
    url: "https://pkg.go.dev/github.com/spoo-me/spoo-go",
    github: "https://github.com/spoo-me/spoo-go",
    install: [
      { label: "go get", command: "go get github.com/spoo-me/spoo-go" },
    ],
    features: [
      "context.Context",
      "Zero deps",
      "Idiomatic errors",
      "Automatic retries",
    ],
    status: "live",
    gallery: ["/apps/go/spoo-1.png"],
  },
  {
    slug: "sdk-kotlin",
    name: "Kotlin SDK",
    category: "sdk",
    tagline: "Coroutines-first Kotlin for Android and JVM",
    description:
      "Kotlin Multiplatform client for Android and JVM. Suspend functions, Flow pagination, consumer R8 rules in the artifact. Published on Maven Central.",
    iconKey: "kotlin",
    color: "#7F52FF",
    url: "https://central.sonatype.com/artifact/me.spoo/spoo",
    github: "https://github.com/spoo-me/spoo-kotlin",
    install: [
      { label: "gradle", command: 'implementation("me.spoo:spoo:0.1.0")' },
    ],
    features: [
      "Coroutines + Flow",
      "Android + JVM",
      "Sealed typed errors",
      "Sign in with Spoo",
    ],
    status: "live",
    gallery: ["/apps/kotlin/spoo-1.png"],
  },
  {
    slug: "sdk-cpp",
    name: "C++ SDK",
    category: "sdk",
    tagline: "Modern C++20: header-only, embeddable",
    description:
      "Header-only C++20 client. Built on libcurl. For native apps, games, embedded.",
    iconKey: "cpp",
    color: "#00599C",
    url: "https://github.com/spoo-me",
    install: [{ label: "vcpkg", command: "vcpkg install spoo" }],
    features: ["Header-only", "C++20", "libcurl-based", "CMake first-class"],
    status: "soon",
  },
  {
    slug: "spoo-cli",
    name: "spoo CLI",
    category: "cli",
    tagline: "One-command terminal shortener",
    description:
      "Cross-platform CLI built in Go. Pipe-friendly, JSON output, scriptable.",
    iconKey: "terminal",
    color: "#a3a3a3",
    url: "https://github.com/spoo-me/spoo-cli",
    github: "https://github.com/spoo-me/spoo-cli",
    install: [
      { label: "brew", command: "brew install spoo-me/tap/spoo" },
      { label: "binaries", command: "Latest release on GitHub" },
    ],
    features: [
      "Pipe-friendly",
      "JSON output",
      "Bulk operations",
      "Cross-platform",
    ],
    status: "live",
    gallery: [
      "/apps/cli/spoo-7.png",
      "/apps/cli/spoo-1.png",
      "/apps/cli/spoo-2.png",
      "/apps/cli/spoo-6.png",
      "/apps/cli/spoo-3.png",
      "/apps/cli/spoo-4.png",
      "/apps/cli/spoo-5.png",
    ],
  },
  {
    slug: "n8n",
    name: "n8n",
    category: "bot",
    tagline: "Drop-in node for n8n automation flows",
    description:
      "Native n8n node: shorten links inside any workflow, branch on click stats, sync with the rest of your stack.",
    iconKey: "n8n",
    color: "#EA4B71",
    url: "https://n8n.io",
    install: [
      {
        label: "n8n community",
        command: "Install spoo node from community nodes",
      },
    ],
    features: [
      "Workflow node",
      "Branching on stats",
      "Self-host friendly",
      "Webhook trigger",
    ],
    status: "soon",
  },
  {
    slug: "spoo-zapier",
    name: "Zapier",
    category: "bot",
    tagline: "Connect spoo to 6000+ apps via Zapier",
    description:
      "Official Zapier integration: trigger Zaps on new clicks, create short links from any app in your stack.",
    iconKey: "zapier",
    color: "#FF4F00",
    url: "https://zapier.com",
    install: [{ label: "Zapier", command: "Search 'spoo.me' in Zapier" }],
    features: [
      "6000+ app connectors",
      "Trigger on click",
      "Create from any app",
      "OAuth scoped",
    ],
    status: "soon",
  },
]

export const sdks = connectedApps.filter((a) => a.category === "sdk")
export const integrations = connectedApps.filter((a) => a.category !== "sdk")
