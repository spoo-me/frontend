import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

export type FaqItem = { q: string; a: React.ReactNode }

/** Plain-text answer for the schema: JSON-LD can't carry JSX. */
function answerText(a: React.ReactNode): string {
  if (typeof a === "string") return a
  const walk = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number")
      return String(node)
    if (Array.isArray(node)) return node.map(walk).join("")
    if (node && typeof node === "object" && "props" in node)
      return walk(
        (node as { props: { children?: React.ReactNode } }).props.children
      )
    return ""
  }
  return walk(a)
}

/* FAQPage structured data. Rich results are restricted to government and
   health sites since 2023, so this is read by answer engines, not the SERP. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: answerText(f.a) },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

/** The accordion itself: the open item lifts onto a card. `answerClassName`
    caps the reading measure when the column is wider than a prose column. */
export function FaqList({
  items,
  answerClassName,
}: {
  items: FaqItem[]
  answerClassName?: string
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((f) => (
        <AccordionItem
          key={f.q}
          value={f.q}
          // Bleed stays inside the container's own px-5/sm:px-9 padding, or
          // the open card overhangs the viewport edge
          className="-mx-4 border-transparent border-b px-4 data-[state=open]:my-3 data-[state=open]:rounded-2xl data-[state=open]:bg-card data-[state=open]:shadow-card data-[state=open]:ring-1 data-[state=open]:ring-foreground/10 sm:-mx-6 sm:px-6 [&:has(+[data-state=open])]:border-transparent! [&:not(:has(+*))]:border-transparent! [&[data-state=closed]]:border-border/50"
        >
          <AccordionTrigger className="py-5 text-base text-foreground hover:no-underline data-[state=open]:pb-2">
            {f.q}
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              "pb-6 text-[15px] text-muted-foreground leading-relaxed",
              answerClassName
            )}
          >
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
