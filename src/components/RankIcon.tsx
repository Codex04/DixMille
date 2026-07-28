/**
 * Icônes de tête et de queue de classement.
 *
 * L'app d'origine chargeait deux PNG depuis github.com : on garde la
 * plaisanterie, qui fait l'identité du jeu, mais en SVG inline — aucune
 * requête réseau, et les couleurs suivent le thème.
 */

export function TrophyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="En tête">
      <path
        d="M6 4h12v5a6 6 0 0 1-12 0V4z"
        fill="var(--color-copper-400)"
        stroke="var(--color-copper-600)"
        strokeWidth="1.2"
      />
      <path
        d="M6 5H4a3 3 0 0 0 3 3M18 5h2a3 3 0 0 1-3 3"
        fill="none"
        stroke="var(--color-copper-500)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M10 15h4v3h-4z" fill="var(--color-copper-500)" />
      <path
        d="M8 19h8a1 1 0 0 1 1 1v1H7v-1a1 1 0 0 1 1-1z"
        fill="var(--color-copper-500)"
        stroke="var(--color-copper-600)"
        strokeWidth="1"
      />
    </svg>
  )
}

export function LastPlaceIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Dernier">
      <path
        d="M12 4c1.6 0 2.2 1.3 1.8 2.4 1.6-.2 2.7.8 2.4 2.2 1.9.1 3 1.4 2.7 2.8 2 .5 2.6 2.4 1.6 3.8H3.5c-1-1.4-.4-3.3 1.6-3.8-.3-1.4.8-2.7 2.7-2.8-.3-1.4.8-2.4 2.4-2.2C9.8 5.3 10.4 4 12 4z"
        fill="#7a4a24"
      />
      <path d="M2.5 15.2h19c.6 1.6-.4 3.3-2.2 3.3H4.7c-1.8 0-2.8-1.7-2.2-3.3z" fill="#5d3719" />
      <circle cx="9.5" cy="12.5" r="1.1" fill="#2b1a0c" />
      <circle cx="14.5" cy="12.5" r="1.1" fill="#2b1a0c" />
      <path
        d="M10 16.2c.8.7 3.2.7 4 0"
        stroke="#2b1a0c"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
