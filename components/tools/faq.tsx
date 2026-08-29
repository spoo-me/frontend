import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export type FaqItem = { q: string; a: string }

/* FAQ band: accordion plus FAQPage JSON-LD — the structured-data surface
   none of the comparable tools ship. The open item lifts onto a card. */
export function ToolFaq({
  items,
  intro,
}: {
  items: FaqItem[]
  intro: string
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="font-semibold text-3xl text-foreground tracking-tight">
        Frequently asked questions
      </h2>
      <p className="mt-3 max-w-xl text-muted-foreground">{intro}</p>
      <Accordion type="single" collapsible className="mt-10 w-full">
        {items.map((f) => (
          <AccordionItem
            key={f.q}
            value={f.q}
            className="-mx-6 border-transparent border-b px-6 [&:has(+[data-state=open])]:border-transparent [&:not(:has(+*))]:border-transparent data-[state=open]:my-3 data-[state=open]:rounded-2xl data-[state=open]:bg-card data-[state=open]:shadow-card data-[state=open]:ring-1 data-[state=open]:ring-foreground/10 [&[data-state=closed]]:border-border/50"
          >
            <AccordionTrigger className="py-5 text-base text-foreground hover:no-underline data-[state=open]:pb-2">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-[15px] text-muted-foreground leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
