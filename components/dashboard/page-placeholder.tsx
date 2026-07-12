import { cn } from "@/lib/utils"

/**
 * Empty-surface placeholder while a section's real implementation lands:
 * dot-grid canvas + ghost outline chips (refs 05/11 empty-zone treatment).
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      <span className="label-mono text-muted-foreground/60">{eyebrow}</span>
      <h1 className="mt-2 font-semibold text-foreground text-xl tracking-tight">
        {title}
      </h1>
      <p className="mt-1.5 max-w-md text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
      <div className="pattern-dots mt-8 flex h-64 items-center justify-center rounded-xl border border-border/60 opacity-90">
        <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
          under construction
        </span>
      </div>
    </div>
  )
}
