import { cn } from "@/lib/utils"

/* Five fake-but-credible logomarks shared by the onboarding wizard and the
   landing's custom-domain demo — one fictional brand universe. Different
   geometric constructions on purpose — overlapping discs, a bolt, a play
   wedge, a clover, an open ring — so they read as five companies, not one
   icon set recolored. */

export function MarkVenn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="6" cy="8" r="4.6" fill="#fb7185" fillOpacity="0.92" />
      <circle cx="10.2" cy="8" r="4.6" fill="#e11d48" fillOpacity="0.78" />
    </svg>
  )
}

export function MarkBolt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M9.4 1.2 3.2 9.1h3.6L6 14.8l6.8-8.6H9.1l.3-5Z"
        fill="#fbbf24"
        stroke="#fbbf24"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MarkPlay({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M5.2 3.1c0-.9 1-1.5 1.8-1L13 5.9c.8.5.8 1.7 0 2.2l-6 3.8c-.8.5-1.8-.1-1.8-1V3.1Z"
        fill="#38bdf8"
        transform="translate(0 1.5)"
      />
    </svg>
  )
}

export function MarkClover({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="8" cy="4.4" r="3" fill="#a78bfa" />
      <circle cx="8" cy="11.6" r="3" fill="#a78bfa" />
      <circle cx="4.4" cy="8" r="3" fill="#8b5cf6" />
      <circle cx="11.6" cy="8" r="3" fill="#8b5cf6" />
    </svg>
  )
}

export function MarkRing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="5.2"
        fill="none"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="24.5 8.2"
        transform="rotate(-50 8 8)"
      />
    </svg>
  )
}
