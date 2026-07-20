export type QuoteSegment = string | { em: string }

export type Testimonial = {
  slug: string
  shortQuote: QuoteSegment[]
  fullQuote: QuoteSegment[]
  person: {
    name: string
    role: string
    initials: string
    avatarSrc?: string
    bio?: string
    links?: { label: string; href: string }[]
  }
  company: {
    name: string
    tagline?: string
    description?: string
    url?: string
    logoSrc?: string
    industry?: string
    location?: string
  }
  accent: string
  metric?: { value: string; label: string }
  photos?: { src: string; alt: string; caption?: string }[]
  publishedAt?: string
}

export const testimonials: Testimonial[] = [
  {
    slug: "pearl-lemon-group",
    shortQuote: [
      "spoo.me is the ",
      { em: "MacGyver of link shorteners" },
      ": quirky emoji slugs, password locks, click caps, all there. ",
      { em: "Chaos-proof" },
      " in the best way.",
    ],
    fullQuote: [
      "I swear spoo.me is the ",
      { em: "MacGyver of URL shorteners" },
      ". Need a quirky emoji slug for social media? Done. Want to lock it down with a password or cap the number of clicks? Easy. I dive into the dashboard, ",
      { em: "grab stats, and export everything" },
      " faster than my caffeine fix kicks in. Free, open source, and zero sign-up nonsense. It's everything I need when I want to just get stuff done. It's ",
      { em: "chaos-proof in the best way" },
      " possible.",
    ],
    person: {
      name: "Deepak Shukla",
      role: "CEO",
      initials: "DS",
      avatarSrc: "/testimonials/deepak-shukla.jpg",
      bio: "Founder & CEO of Pearl Lemon Group, a London-based marketing collective. Endurance athlete, podcaster, and operator running a portfolio of agencies serving clients across SEO, sales, and content.",
      links: [
        {
          label: "LinkedIn",
          href: "https://www.linkedin.com/in/deepakshukla/",
        },
        { label: "Pearl Lemon", href: "https://pearllemon.com" },
      ],
    },
    company: {
      name: "Pearl Lemon Group",
      tagline: "A portfolio of marketing & creative agencies",
      description:
        "Pearl Lemon Group is a London-headquartered collective of digital agencies covering SEO, sales, leads, content, and creative. The team uses spoo.me across campaigns to ship trackable links fast, lock sensitive ones, and pull analytics without leaving the dashboard.",
      url: "https://pearllemongroup.com",
      logoSrc: "/testimonials/pearl-lemon-logo.jpeg",
      industry: "Marketing & Agency",
      location: "London, UK",
    },
    accent: "#FBC700",
    metric: { value: "Daily", label: "use across campaigns" },
    publishedAt: "2025-08-12",
  },
]

export function getTestimonial(slug: string): Testimonial | undefined {
  return testimonials.find((t) => t.slug === slug)
}

export function flattenQuote(segments: QuoteSegment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : s.em)).join("")
}
