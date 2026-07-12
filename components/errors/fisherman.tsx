/**
 * The 404 fisherman: dashed wireframe line-art, one stroke weight, no face,
 * no fill. He's fishing for the link and nothing is biting; the hook bobs
 * gently (ambient-liveness tier, disabled for reduced motion). Reads as a
 * drafting-sheet figure, not a mascot.
 */
export function Fisherman({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 170"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* pier */}
      <path d="M12 100 H92" strokeDasharray="5 4" />
      <path d="M28 100 V132" strokeDasharray="5 4" />
      <path d="M76 100 V132" strokeDasharray="5 4" />
      {/* water */}
      <g strokeDasharray="2 5" opacity="0.8">
        <path d="M10 142 H40" />
        <path d="M100 141 H148" />
        <path d="M112 151 H138" />
      </g>
      {/* figure, seated at the pier edge */}
      <g strokeDasharray="3 3">
        <circle cx="58" cy="56" r="7" />
        <path d="M58 63 L55 99" />
        <path d="M55 99 L78 101" />
        <path d="M78 101 V120" />
        <path d="M78 120 l6 2" />
        <path d="M57 70 L74 80" />
      </g>
      {/* rod, through the hands */}
      <path d="M66 88 L128 40" strokeDasharray="5 4" />
      {/* line + hook: nothing's biting */}
      <g className="[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none">
        <path d="M128 40 V126" strokeWidth="1" strokeDasharray="2 4" />
        <path d="M128 126 q0 9 -7 9 q-6 0 -6 -7" strokeWidth="1" />
      </g>
    </svg>
  )
}
