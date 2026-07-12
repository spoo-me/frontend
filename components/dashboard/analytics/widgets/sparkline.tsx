"use client"

import * as React from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

/**
 * Axis-less trend strip for stat tiles. Decorative context, not a reading
 * surface: no ticks, no tooltip, no pointer events, no animation (numbers
 * animate; ambience doesn't).
 */
export function Sparkline({ points }: { points: number[] }) {
  const fillId = React.useId()
  const data = points.map((v, i) => ({ i, v }))
  return (
    <div className="pointer-events-none h-full w-full **:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-accent, var(--brand))"
                stopOpacity={0.14}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-accent, var(--brand))"
                stopOpacity={0.01}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--chart-accent, var(--brand))"
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
