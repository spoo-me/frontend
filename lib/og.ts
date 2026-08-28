import type { Metadata } from "next"

// Page-level openGraph/twitter replace the layout's objects wholesale
// (metadata merges shallowly), so every card re-states the shared fields.
export function socialCard({
  title,
  description,
  image,
  alt,
}: {
  title: string
  description: string
  image: string
  alt: string
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      siteName: "spoo.me",
      type: "website",
      images: [{ url: image, width: 2400, height: 1260, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}
