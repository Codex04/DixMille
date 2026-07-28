import { useNavigate } from 'react-router'
import Screen from '../components/Screen'
import { isFinished } from '../domain/score'
import { useGameStore } from '../store/useGameStore'

export default function Home() {
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)
  const migration = useGameStore((state) => state.migration)

  const resumable = [...games].reverse().find((game) => !isFinished(game))
  const finishedCount = games.filter(isFinished).length

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center gap-10 py-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center gap-2" aria-hidden="true">
            {[1, 5, 6].map((face) => (
              <Die key={face} face={face} />
            ))}
          </div>
          <h1 className="title text-5xl font-bold text-copper-400">Dix-Mille</h1>
          <p className="mt-2 text-cream-dim">Le compteur de points</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-primary text-lg"
            onClick={() => navigate('/nouvelle-partie')}
          >
            Nouvelle partie
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            disabled={!resumable}
            onClick={() => resumable && navigate(`/partie/${resumable.id}`)}
          >
            {resumable
              ? `Reprendre — ${resumable.players.map((player) => player.name).join(', ')}`
              : 'Aucune partie en cours'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            disabled={finishedCount === 0}
            onClick={() => navigate('/historique')}
          >
            Historique{finishedCount > 0 ? ` (${finishedCount})` : ''}
          </button>

          <button type="button" className="btn btn-ghost" onClick={() => navigate('/regles')}>
            Règles et réglages
          </button>
        </div>

        {migration && migration.importedGames > 0 && (
          <p className="surface p-3 text-center text-sm text-cream-dim">
            {migration.importedGames} partie{migration.importedGames > 1 ? 's' : ''} récupérée
            {migration.importedGames > 1 ? 's' : ''} depuis l’ancienne version.
          </p>
        )}
      </div>
    </Screen>
  )
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
}

function Die({ face }: { face: number }) {
  return (
    <svg width="44" height="44" viewBox="0 0 30 30" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="28"
        height="28"
        rx="6"
        fill="var(--color-cream)"
        stroke="var(--color-copper-500)"
        strokeWidth="1.5"
      />
      {(PIPS[face] ?? []).map(([column, row], index) => (
        <circle
          key={index}
          cx={8 + column * 7}
          cy={8 + row * 7}
          r="2.4"
          fill={face === 1 ? 'var(--color-die-red)' : 'var(--color-felt-900)'}
        />
      ))}
    </svg>
  )
}
