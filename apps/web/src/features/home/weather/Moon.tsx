type MoonProps = {
  /** 0 new moon, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase: number
  southern: boolean
  opacity: number
}

// Where the moon hangs in the 300 × 96 sky of `WeatherScene`, and its size.
const X = 240
const Y = 30
const R = 13

/** The moon in its phase, with its dark side faintly showing and a halo as bright as it is. */
export const Moon = ({ phase, southern, opacity }: MoonProps) => {
  // VARS
  const lit = (1 - Math.cos(2 * Math.PI * phase)) / 2 // the lit share of the disc

  return (
    <g className="fill-grove-moon" opacity={opacity}>
      <g opacity={0.4 * lit}>
        <circle cx={X} cy={Y} r="22" className="origin-center animate-glow transform-fill" />
      </g>
      <circle cx={X} cy={Y} r={R} opacity="0.12" />
      <path d={litPart(phase, southern)} transform={`rotate(-20 ${X} ${Y})`} />
    </g>
  )
}

/**
 * The moon's edge on the lit side from top to bottom, then back up along the terminator (half an
 * ellipse, flat at the quarters). It bulges toward the lit side for a crescent, away past the
 * quarter. The lit side is the right one while the moon waxes, in the north.
 */
const litPart = (phase: number, southern: boolean) => {
  const litOnRight = phase < 0.5 !== southern
  const crescent = phase < 0.25 || phase > 0.75
  const terminator = R * Math.abs(Math.cos(2 * Math.PI * phase))
  return [
    `M${X} ${Y - R}`,
    `A${R} ${R} 0 0 ${litOnRight ? 1 : 0} ${X} ${Y + R}`,
    `A${terminator} ${R} 0 0 ${crescent === litOnRight ? 0 : 1} ${X} ${Y - R}Z`,
  ].join('')
}
