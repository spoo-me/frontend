import { type FaqItem, FaqJsonLd, FaqList } from "@/components/shared/faq"

export type { FaqItem }

/* Tool-page FAQ band: one narrow centered column, matching the long-form
   prose above it. The landing runs the same list across the full frame. */
export function ToolFaq({ items, intro }: { items: FaqItem[]; intro: string }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
      <FaqJsonLd items={items} />
      <h2 className="font-semibold text-3xl text-foreground tracking-tight">
        Frequently asked questions
      </h2>
      <p className="mt-3 max-w-xl text-muted-foreground">{intro}</p>
      <div className="mt-10">
        <FaqList items={items} />
      </div>
    </div>
  )
}
