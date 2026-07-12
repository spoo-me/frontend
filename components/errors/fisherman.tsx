/**
 * The 404's last glyph: the SAME "4" as the first one, but as a dashed
 * OUTLINE — every stroke double-edged at the solid glyph's stroke width
 * (~26 units on this 160x205 cap box), counter triangle included — and
 * molded into a fisherman:
 *
 *   the diagonal   = his rod, rising to the stem top
 *   the crossbar   = the pier deck he sits on (its two edges ARE the
 *                    double-lined deck)
 *   the stem       = the line: double-edged to the baseline, then a
 *                    single thread sinking past the waterline to the hook
 *
 * He sits inside the 4's counter, legs over the deck edge.
 */
export function FishermanGlyph({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 160 460"
      aria-hidden
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* the 4's outer contour, one dashed pass */}
      <path
        d="M130 0 L130 130 L160 130 L160 156 L130 156 L130 205 L104 205 L104 156 L0 156 L0 130 L104 0 Z"
        strokeDasharray="7 6"
      />
      {/* the counter (the triangle window he shelters in) */}
      <path d="M104 34 L104 130 L30 130 Z" strokeDasharray="7 6" />
      {/* HIS line, from HIS rod tip, over the pier edge and down past the
          waterline to the hook */}
      <g className="text-foreground/60">
        <path d="M148 62 V418" strokeWidth="1.5" strokeDasharray="3 7" />
        <g className="[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none">
          <path d="M148 418 q0 12 -9 12 q-8 0 -8 -9" strokeWidth="1.5" />
        </g>
      </g>
      {/* the fisherman, seated in the counter on the deck's top edge,
          holding an actual rod. Solid strokes and hotter ink on purpose:
          the building is blueprint, he and his tackle are alive. */}
      <g className="text-foreground" opacity="0.55">
        <circle cx="62" cy="78" r="9" />
        <path d="M64 88 L72 124" />
        <path d="M67 96 L77 91" />
        <path d="M68 95 L148 62" />
        <path d="M72 124 L92 128" />
        <path d="M92 128 V156" />
        <path d="M92 156 l8 2" />
      </g>
    </svg>
  )
}
