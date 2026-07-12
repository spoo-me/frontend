/**
 * The 404's last glyph: the SAME "4" as the first one, but drawn as a
 * dashed outline and molded into a fisherman —
 *
 *   the diagonal  = his rod
 *   the crossbar  = the pier he sits on
 *   the stem      = the fishing line, continuing past the baseline,
 *                   through the waterline, to a hook that drifts
 *
 * The glyph proper lives in the top 260 units (matching the numeral's
 * 1em box at the slot's 160-unit width); everything below is the sunken
 * line. Strokes at numeral weight; the underwater segment thins out.
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
      <path d="M118 8 L14 170" strokeDasharray="7 6" />
      <path d="M6 170 H150" strokeDasharray="7 6" />
      <path d="M118 8 V252" strokeDasharray="7 6" />
      {/* the stem keeps going: the line sinks past the waterline */}
      <path d="M118 252 V420" strokeWidth="1.5" strokeDasharray="3 7" />
      <g className="[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none">
        <path d="M118 420 q0 12 -9 12 q-8 0 -8 -9" strokeWidth="1.5" />
      </g>
      {/* the fisherman, molded into the diagonal-crossbar joint: he grips
          the rod, sits on the pier, legs over the edge */}
      <g strokeDasharray="4 4">
        <circle cx="38" cy="112" r="10" />
        <path d="M40 124 L48 166" />
        <path d="M44 132 L58 106" />
        <path d="M48 166 L74 170" />
        <path d="M74 170 V200" />
        <path d="M74 200 l9 3" />
      </g>
    </svg>
  )
}
