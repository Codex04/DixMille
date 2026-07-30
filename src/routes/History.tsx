import { useNavigate } from 'react-router'
import Screen from '../components/Screen'
import { detectWinner, isFinished, scoresOf } from '../domain/score'
import { useGameStore } from '../store/useGameStore'

export default function History() {
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)

  const finished = games
    .filter(isFinished)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Palmarès : nombre de victoires par joueur, tous historiques confondus.
  const wins = new Map<string, number>()
  for (const game of finished) {
    const winnerId = detectWinner(game)
    const winner = game.players.find((player) => player.id === winnerId)
    if (winner) wins.set(winner.name, (wins.get(winner.name) ?? 0) + 1)
  }
  const podium = [...wins.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <Screen title="Historique" back="/">
      {finished.length === 0 ? (
        <p className="text-cream-dim">Aucune partie terminée pour le moment.</p>
      ) : (
        <>
          {podium.length > 0 && (
            <section className="surface mb-4 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-dim">
                Palmarès
              </h2>
              <ul className="flex flex-col gap-1">
                {podium.map(([name, count]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="tabular text-copper-400">
                      {count} victoire{count > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ul className="flex flex-col gap-2">
            {finished.map((game) => {
              const winnerId = detectWinner(game)
              const winner = game.players.find((player) => player.id === winnerId)
              const totals = scoresOf(game)
              const best = winner ? (totals.get(winner.id) ?? 0) : 0

              return (
                <li key={game.id}>
                  <button
                    type="button"
                    className="surface flex w-full items-center gap-3 px-4 py-3 text-left"
                    onClick={() => navigate(`/historique/${game.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{winner?.name ?? 'Sans gagnant'}</p>
                      <p className="truncate text-sm text-cream-dim">
                        {game.players.map((player) => player.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular font-semibold text-copper-400">
                        {best.toLocaleString('fr-FR')}
                      </p>
                      <p className="whitespace-nowrap text-xs text-cream-dim">
                        {new Date(game.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Screen>
  )
}
