/**
 * The 404 fisherman, promoted to typography: he IS the last glyph of the
 * watermark ("40" + him), drawn in dashed wireframe at numeral scale. His
 * line runs out the bottom of the figure, crosses the footer hairline (the
 * waterline) and ends in a hook that hangs inside the footer, behind the
 * water glass. The viewBox is mostly tail on purpose — the parent slot
 * clips nothing, the page-bottom wrapper does.
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
      {/* pier: doubled deck line */}
      <g strokeDasharray="5 5">
        <path d="M10 150 H120" />
        <path d="M10 157 H120" />
        <path d="M30 157 V190" />
        <path d="M100 157 V190" />
      </g>
      {/* figure, seated at the pier edge */}
      <g strokeDasharray="4 4">
        <circle cx="78" cy="78" r="11" />
        <path d="M78 90 L72 148" />
        <path d="M72 148 L106 151" />
        <path d="M106 151 V183" />
        <path d="M106 183 l10 3" />
        <path d="M76 103 L104 116" />
      </g>
      {/* rod */}
      <path d="M88 130 L152 48" strokeDasharray="6 5" />
      {/* the line sinks past the waterline; the hook drifts underwater */}
      <path d="M152 48 V418" strokeWidth="1.5" strokeDasharray="3 7" />
      <g className="[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none">
        <path d="M152 418 q0 12 -9 12 q-8 0 -8 -9" strokeWidth="1.5" />
      </g>
    </svg>
  )
}
