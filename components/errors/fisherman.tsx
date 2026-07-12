"use client"

import * as React from "react"
import { motion, useReducedMotion, type Transition } from "motion/react"

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
 * He sits inside the 4's counter, legs over the deck edge — fishing for
 * the link that doesn't exist. When the visitor claims it
 * ("spoo:alias-claimed"), something finally bites: the line tugs, a fish
 * appears on the hook, and he reels it up out of the water. The fish is
 * SOLID ink like him — dashed is blueprint, solid is alive, and the link
 * is real now.
 */
export function FishermanGlyph({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const [caught, setCaught] = React.useState(false)
  const reduce = useReducedMotion()

  React.useEffect(() => {
    const onClaim = () => setCaught(true)
    window.addEventListener("spoo:alias-claimed", onClaim)
    return () => window.removeEventListener("spoo:alias-claimed", onClaim)
  }, [])

  // Bite first (a short downward jerk), then the long reel-up.
  const reel: Transition = reduce
    ? { duration: 0 }
    : {
        duration: 1.7,
        times: [0, 0.22, 1],
        ease: ["easeOut", [0.16, 1, 0.3, 1]],
      }

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
        <motion.line
          x1="148"
          y1="62"
          x2="148"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          initial={false}
          animate={caught ? { y2: [418, 428, 236] } : { y2: 418 }}
          transition={reel}
        />
        <motion.g
          initial={false}
          animate={caught ? { y: [0, 10, -182] } : { y: 0 }}
          transition={reel}
        >
          <g
            className={
              caught
                ? undefined
                : "[animation:hook-bob_3.4s_ease-in-out_infinite] motion-reduce:animate-none"
            }
          >
            <path d="M148 418 q0 12 -9 12 q-8 0 -8 -9" strokeWidth="1.5" />
            {/* the catch — appears the moment the alias is claimed; same
                0.55 ink as the fisherman (motion drives opacity via style,
                so the target IS the ink level) */}
            <motion.g
              className="text-foreground"
              initial={false}
              animate={{ opacity: caught ? 0.55 : 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.4, delay: caught ? 0.12 : 0 }
              }
            >
              <path d="M131 424 C122 431 121 443 131 452 C141 443 140 431 131 424 Z" />
              <path d="M131 452 L124 463" />
              <path d="M131 452 L138 463" />
              <path d="M124 463 Q131 459 138 463" />
            </motion.g>
          </g>
        </motion.g>
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
