import { useState } from 'react'
import { useNavigate } from 'react-router'
import Screen from '../components/Screen'
import { detectWinner, isFinished, scoresOf } from '../domain/score'
import type { Game } from '../domain/types'
import { useGameStore } from '../store/useGameStore'

/** Sentinelle du filtre « tous les jeux ». */
const ALL = '__all__'

/**
 * Jeux présents dans l'historique, dans l'ordre de la partie la plus
 * récente.
 *
 * La liste est dérivée des parties, pas des presets des réglages : un jeu
 * supprimé depuis doit rester filtrable tant que ses parties existent, et un
 * jeu jamais joué n'a pas à encombrer le filtre. Chaque partie porte une
 * copie figée de son preset, ce qui rend l'un et l'autre possibles.
 */
function playedPresets(games: Game[]): { id: string; name: string }[] {
  const seen = new Map<string, string>()
  for (const game of games) {
    if (!seen.has(game.preset.id)) seen.set(game.preset.id, game.preset.name)
  }
  return [...seen].map(([id, name]) => ({ id, name }))
}

export default function History() {
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)
  const [presetFilter, setPresetFilter] = useState<string>(ALL)

  const finished = games
    .filter(isFinished)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const presets = playedPresets(finished)
  // Un filtre pointant un jeu sans partie restante retombe sur « tous ».
  const activeFilter = presets.some((preset) => preset.id === presetFilter) ? presetFilter : ALL
  const visible =
    activeFilter === ALL ? finished : finished.filter((game) => game.preset.id === activeFilter)

  // Palmarès calculé sur les parties visibles : filtrer par jeu doit aussi
  // filtrer le classement, sinon les deux se contredisent à l'écran.
  const wins = new Map<string, number>()
  for (const game of visible) {
    const winnerId = detectWinner(game)
    const winner = game.players.find((player) => player.id === winnerId)
    if (winner) wins.set(winner.name, (wins.get(winner.name) ?? 0) + 1)
  }
  const podium = [...wins.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  if (finished.length === 0) {
    return (
      <Screen title="Historique" back="/">
        <p className="text-cream-dim">Aucune partie terminée pour le moment.</p>
      </Screen>
    )
  }

  return (
    <Screen title="Historique" back="/">
      {/* Inutile de proposer un filtre quand un seul jeu a été joué. */}
      {presets.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ id: ALL, name: 'Tous' }, ...presets].map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activeFilter === preset.id}
              className={`btn min-h-11! px-3! text-sm ${
                activeFilter === preset.id ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => setPresetFilter(preset.id)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {podium.length > 0 && (
        <section className="surface mb-4 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-dim">
            Palmarès
            {activeFilter !== ALL && (
              <span className="ml-2 normal-case tracking-normal">
                — {presets.find((preset) => preset.id === activeFilter)?.name}
              </span>
            )}
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
        {visible.map((game) => {
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
                  {/* Le nom du jeu n'a d'intérêt que si l'on voit un mélange. */}
                  {activeFilter === ALL && presets.length > 1 && (
                    <p className="truncate text-xs text-copper-400">{game.preset.name}</p>
                  )}
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
    </Screen>
  )
}
