export type Tool = {
  slug: string
  name: string
  /* Search-facing title (template appends "· spoo.me"). */
  seoTitle: string
  description: string
  /* One-line hub card blurb — shorter and drier than the meta description. */
  blurb: string
  iconKey: "utm" | "preview" | "expander" | "qr"
  status: "live" | "soon"
}

export const tools: Tool[] = [
  {
    slug: "utm-builder",
    name: "UTM builder",
    seoTitle: "UTM Builder: create, shorten, and track campaign links",
    description:
      "Build UTM links with source, medium, and campaign tags, then shorten them on spoo.me and watch the clicks live. No account needed.",
    blurb: "Tag campaign links and track their clicks.",
    iconKey: "utm",
    status: "live",
  },
  {
    slug: "link-preview",
    name: "Link preview checker",
    seoTitle: "Link Preview Checker: test social cards on any platform",
    description:
      "See how any URL renders on X, Discord, Slack, WhatsApp, and LinkedIn, with a meta-tag audit that shows exactly what to fix.",
    blurb: "See how a URL unfurls on every platform.",
    iconKey: "preview",
    status: "live",
  },
  {
    slug: "url-expander",
    name: "URL expander",
    seoTitle: "URL Expander: reveal where a short link goes",
    description:
      "Paste a short link from any shortener and see the full redirect chain, the final destination, and a safety verdict before you click.",
    blurb: "Reveal a short link's destination before clicking.",
    iconKey: "expander",
    status: "soon",
  },
  {
    slug: "qr-code",
    name: "QR code generator",
    seoTitle: "QR Code Generator: classic and gradient QR codes",
    description:
      "Generate classic or gradient QR codes for any link, with an optional logo. Powered by the same API behind spoo.me short links.",
    blurb: "QR codes for any link, gradients included.",
    iconKey: "qr",
    status: "soon",
  },
]

export const liveTools = tools.filter((t) => t.status === "live")
