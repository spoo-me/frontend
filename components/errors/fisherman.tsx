/**
 * The 404's last glyph: the SAME "4" as the first one, dashed and molded
 * into a fisherman —
 *
 *   the diagonal  = his rod
 *   the crossbar  = the pier he sits on
 *   the stem      = the fishing line, continuing past the baseline,
 *                   through the waterline, to a hook that drifts
 *
 * Geometry traced from the solid Geist 4: glyph box 160x205 units
 * (cap-height aspect ~1.28), apex/stem at x=127, crossbar at 70% height
 * overshooting right, diagonal foot at the left edge. The parent offsets
 * the svg by the cap-top inset so it top-aligns with the solid numerals;
 * everything below y=205 is the sunken line.
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
      {/* the 4, stroke by stroke: diagonal (rod), crossbar (pier), stem */}
      <path d="M127 0 L0 143" strokeDasharray="7 6" />
      <path d="M0 143 H160" strokeDasharray="7 6" />
      <path d="M127 0 V205" strokeDasharray="7 6" />
      {/* the stem keeps going: the line sinks past the waterline */}
      <path d="M127 205 V420" strokeWidth="1.5" strokeDasharray="3 7" />
      <g className="[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none">
        <path d="M127 420 q0 12 -9 12 q-8 0 -8 -9" strokeWidth="1.5" />
      </g>
      {/* the fisherman, molded into the diagonal: he grips the rod, sits
          on the crossbar, legs over the pier edge */}
      <g strokeDasharray="4 4">
        <circle cx="28" cy="96" r="9" />
        <path d="M30 105 L38 140" />
        <path d="M33 112 L46 94" />
        <path d="M38 140 L62 144" />
        <path d="M62 144 V172" />
        <path d="M62 172 l8 2" />
      </g>
    </svg>
  )
}
