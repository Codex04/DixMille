import { useState } from 'react'
import { useNavigate } from 'react-router'
import Screen from '../components/Screen'
import { isPlayerNameAvailable } from '../domain/validation'
import { useGameStore } from '../store/useGameStore'

export default function NewGame() {
  const navigate = useNavigate()
  const games = useGameStore((state) => state.games)
  const createGame = useGameStore((state) => state.createGame)

  const [names, setNames] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const previous = games.length > 0 ? games[games.length - 1] : undefined
  const canAdd = isPlayerNameAvailable(draft, names)
  const canStart = names.length >= 2

  function addPlayer() {
    if (!canAdd) return
    setNames([...names, draft.trim()])
    setDraft('')
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= names.length) return
    const next = [...names]
    const [moved] = next.splice(index, 1)
    if (moved !== undefined) next.splice(target, 0, moved)
    setNames(next)
  }

  function reusePrevious() {
    if (!previous) return
    const merged = [...names]
    for (const player of previous.players) {
      if (isPlayerNameAvailable(player.name, merged)) merged.push(player.name)
    }
    setNames(merged)
  }

  function start() {
    if (!canStart) return
    const game = createGame(names)
    navigate(`/partie/${game.id}`)
  }

  return (
    <Screen title="Nouvelle partie" back="/">
      <p className="mb-4 text-sm text-cream-dim">
        L’ordre de la liste est l’ordre de jeu.
      </p>

      <ol className="mb-4 flex flex-col gap-2">
        {names.map((name, index) => (
          <li key={name} className="surface flex items-center gap-2 px-3 py-2">
            <span className="tabular w-6 text-copper-400">{index + 1}</span>
            <span className="flex-1 truncate text-lg">{name}</span>
            <button
              type="button"
              className="btn btn-ghost min-h-9! px-2!"
              aria-label={`Monter ${name}`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-9! px-2!"
              aria-label={`Descendre ${name}`}
              disabled={index === names.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-9! px-2!"
              aria-label={`Retirer ${name}`}
              onClick={() => setNames(names.filter((other) => other !== name))}
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      <form
        className="mb-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          addPlayer()
        }}
      >
        <input
          className="surface flex-1 px-3 py-2 text-lg outline-none"
          placeholder="Nom du joueur"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Nom du joueur"
        />
        <button type="submit" className="btn btn-ghost" disabled={!canAdd}>
          Ajouter
        </button>
      </form>

      {draft.trim() !== '' && !canAdd && (
        <p className="mb-3 text-sm text-copper-400">Ce nom est déjà pris.</p>
      )}

      {previous && (
        <button type="button" className="btn btn-ghost mb-3" onClick={reusePrevious}>
          Reprendre les joueurs de la dernière partie
        </button>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          className="btn btn-primary w-full text-lg"
          disabled={!canStart}
          onClick={start}
        >
          {canStart ? 'Commencer la partie' : 'Il faut au moins 2 joueurs'}
        </button>
      </div>
    </Screen>
  )
}
