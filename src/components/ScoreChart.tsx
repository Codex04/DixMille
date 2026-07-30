import { progression } from '../domain/score'
import type { Game } from '../domain/types'

/**
 * Courbe de progression, en SVG pur : pas de librairie de graphes pour
 * trois polylignes, ce serait plus lourd que toute l'application.
 */
export default function ScoreChart({ game }: { game: Game }) {
  const series = progression(game)
  const width = 320
  const height = 160
  const padding = 8

  const longest = Math.max(...series.map((entry) => entry.points.length), 2)
  const values = series.flatMap((entry) => entry.points)
  const max = Math.max(game.preset.target, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1

  const x = (index: number) =>
    padding + (index / (longest - 1)) * (width - padding * 2)
  const y = (value: number) =>
    height - padding - ((value - min) / span) * (height - padding * 2)

  const palette = [
    'var(--color-copper-400)',
    'var(--color-cream)',
    '#7fd1ae',
    'var(--color-die-red)',
    '#9db8ff',
    '#e6b7ff',
  ]

  return (
    <div className="surface p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Progression des scores"
      >
        {/* Ligne d'objectif */}
        <line
          x1={padding}
          y1={y(game.preset.target)}
          x2={width - padding}
          y2={y(game.preset.target)}
          stroke="var(--color-copper-600)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {series.map((entry, index) => (
          <polyline
            key={entry.player.id}
            fill="none"
            stroke={palette[index % palette.length]}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={entry.points.map((value, step) => `${x(step)},${y(value)}`).join(' ')}
          />
        ))}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((entry, index) => (
          <li key={entry.player.id} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: palette[index % palette.length] }}
            />
            {entry.player.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
