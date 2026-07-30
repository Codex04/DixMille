import { useParams } from 'react-router'
import Screen from '../components/Screen'
import ScoreChart from '../components/ScoreChart'
import { detectWinner, standings } from '../domain/score'
import { useGameStore } from '../store/useGameStore'

export default function GameDetail() {
  const { gameId } = useParams()
  const game = useGameStore((state) => state.games.find((entry) => entry.id === gameId))

  if (!game) {
    return (
      <Screen title="Partie introuvable" back="/historique">
        <p className="text-cream-dim">Cette partie n’existe pas.</p>
      </Screen>
    )
  }

  const winnerId = detectWinner(game)
  const rows = standings(game)
  const imported = game.turns.some((turn) => turn.imported)

  return (
    <Screen
      title={new Date(game.createdAt).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })}
      back="/historique"
    >
      <ul className="mb-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.player.id} className="surface flex items-center gap-3 px-4 py-2">
            <span className="tabular w-6 text-sm text-cream-dim">{row.rank}</span>
            <span className="flex-1 truncate">
              {row.player.name}
              {row.player.id === winnerId && <span className="ml-2 text-copper-400">★</span>}
            </span>
            <span className="tabular font-semibold text-copper-400">
              {row.score.toLocaleString('fr-FR')}
            </span>
          </li>
        ))}
      </ul>

      {imported ? (
        <p className="surface p-3 text-sm text-cream-dim">
          Partie récupérée depuis l’ancienne version : seuls les scores finaux ont été conservés,
          le détail des coups n’existait pas.
        </p>
      ) : (
        <>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-dim">
            Progression
          </h2>
          <ScoreChart game={game} />

          <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-cream-dim">
            Coups joués
          </h2>
          <ol className="flex flex-col gap-1">
            {game.turns.map((turn, index) => {
              const player = game.players.find((entry) => entry.id === turn.playerId)
              return (
                <li
                  key={turn.id}
                  className="flex items-center gap-3 border-b border-white/5 px-1 py-1.5 text-sm"
                >
                  <span className="tabular w-6 text-cream-dim">{index + 1}</span>
                  <span className="flex-1 truncate">{player?.name ?? '—'}</span>
                  <span
                    className={`tabular font-semibold ${
                      turn.points < 0 ? 'text-die-red' : 'text-cream'
                    }`}
                  >
                    {turn.points > 0 ? '+' : ''}
                    {turn.points.toLocaleString('fr-FR')}
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </Screen>
  )
}
