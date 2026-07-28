import { useNavigate, useParams } from 'react-router'
import Screen from '../components/Screen'
import { LastPlaceIcon, TrophyIcon } from '../components/RankIcon'
import { currentPlayer, detectWinner, standings } from '../domain/score'
import { useGameStore } from '../store/useGameStore'

export default function GameBoard() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = useGameStore((state) => state.games.find((entry) => entry.id === gameId))
  const undoLastTurn = useGameStore((state) => state.undoLastTurn)

  if (!game) {
    return (
      <Screen title="Partie introuvable" back="/">
        <p className="text-cream-dim">Cette partie n’existe pas ou a été supprimée.</p>
      </Screen>
    )
  }

  const winnerId = detectWinner(game)
  const winner = game.players.find((player) => player.id === winnerId)
  const active = currentPlayer(game)
  const rows = standings(game)
  const lastTurn = game.turns[game.turns.length - 1]
  const lastTurnPlayer = game.players.find((player) => player.id === lastTurn?.playerId)

  return (
    <Screen
      title="Dix-Mille"
      back="/"
      action={
        <button
          type="button"
          className="btn btn-ghost min-h-11! px-3! text-sm"
          disabled={game.turns.length === 0}
          onClick={() => undoLastTurn(game.id)}
        >
          Annuler
        </button>
      }
    >
      {winner ? (
        <div className="surface mb-4 border-copper-400 p-4 text-center">
          <p className="title text-2xl font-bold text-copper-400">{winner.name} l’emporte !</p>
          <p className="mt-1 text-sm text-cream-dim">
            Objectif de {game.rules.target.toLocaleString('fr-FR')} points atteint.
          </p>
        </div>
      ) : (
        active && (
          <p className="mb-4 text-center text-cream-dim">
            Au tour de <span className="font-semibold text-cream">{active.name}</span>
          </p>
        )
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const isActive = !winner && row.player.id === active?.id
          return (
            <li key={row.player.id}>
              <button
                type="button"
                className={`surface flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  isActive ? 'border-copper-400 ring-2 ring-copper-400/40' : ''
                }`}
                onClick={() => navigate(`/partie/${game.id}/score/${row.player.id}`)}
              >
                <span className="tabular w-6 shrink-0 text-sm text-cream-dim">{row.rank}</span>
                <span className="w-7 shrink-0">
                  {row.isLeader && <TrophyIcon />}
                  {row.isLast && !row.isLeader && <LastPlaceIcon />}
                </span>
                <span className="flex-1 truncate text-lg font-medium">{row.player.name}</span>
                <span className="tabular text-2xl font-semibold text-copper-400">
                  {row.score.toLocaleString('fr-FR')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {lastTurn && lastTurnPlayer && (
        <p className="mt-4 text-center text-sm text-cream-dim">
          Dernier coup : {lastTurnPlayer.name} {lastTurn.points >= 0 ? '+' : ''}
          {lastTurn.points.toLocaleString('fr-FR')}
        </p>
      )}

      <p className="mt-auto pt-6 text-center text-xs text-cream-dim">
        Minimum {game.rules.minimumTurnScore} points par tour pour marquer.
      </p>
    </Screen>
  )
}
