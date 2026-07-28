import { create } from 'zustand'
import type { RuleSet } from '../domain/rules'
import { nextPlayerIndex, detectWinner } from '../domain/score'
import type { ComboEntry, Game, GameId, PersistedState, PlayerId, Settings } from '../domain/types'
import { createId } from '../lib/id'
import type { MigrationReport } from '../storage/migrate'
import { loadState, mergeState, saveState } from '../storage/repository'
import { defaultState } from '../storage/schema'

/**
 * Le store n'utilise pas le middleware `persist` de Zustand : la migration
 * depuis l'ancienne app impose de contrôler précisément l'ordre entre
 * lecture, import et écriture, ce que `persist` ne permet pas.
 */

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

interface GameStore {
  games: Game[]
  settings: Settings
  migration?: MigrationReport
  ready: boolean

  init: () => void
  createGame: (names: string[]) => Game
  addTurn: (gameId: GameId, playerId: PlayerId, points: number, breakdown?: ComboEntry[]) => void
  undoLastTurn: (gameId: GameId) => void
  updateRules: (rules: RuleSet) => void
  applyImport: (incoming: PersistedState) => number
  gameById: (gameId: GameId) => Game | undefined
  lastGame: () => Game | undefined
}

export const useGameStore = create<GameStore>((set, get) => {
  /** Persiste l'état courant après chaque mutation. */
  function persist(games: Game[], settings: Settings): void {
    const store = storage()
    if (store) saveState(store, { version: 2, games, settings })
  }

  function replaceGame(gameId: GameId, update: (game: Game) => Game): void {
    const { games, settings } = get()
    const next = games.map((game) => (game.id === gameId ? update(game) : game))
    set({ games: next })
    persist(next, settings)
  }

  return {
    ...defaultState(),
    ready: false,

    init() {
      if (get().ready) return
      const store = storage()
      if (!store) {
        set({ ready: true })
        return
      }
      const result = loadState(store)
      set({
        games: result.state.games,
        settings: result.state.settings,
        ...(result.migration ? { migration: result.migration } : {}),
        ready: true,
      })
    },

    createGame(names) {
      const { games, settings } = get()
      const game: Game = {
        id: createId(),
        players: names.map((name) => ({ id: createId(), name: name.trim() })),
        turns: [],
        currentPlayerIndex: 0,
        createdAt: new Date().toISOString(),
        // La variante est figée ici : modifier les réglages plus tard ne
        // réécrira pas cette partie.
        rules: { ...settings.rules },
      }
      const next = [...games, game]
      set({ games: next })
      persist(next, settings)
      return game
    },

    addTurn(gameId, playerId, points, breakdown) {
      replaceGame(gameId, (game) => {
        const turns = [
          ...game.turns,
          {
            id: createId(),
            playerId,
            points,
            at: new Date().toISOString(),
            ...(breakdown && breakdown.length > 0 ? { breakdown } : {}),
          },
        ]
        const updated: Game = { ...game, turns, currentPlayerIndex: nextPlayerIndex(game) }

        // Le premier à franchir la cible est figé : les tours suivants ne
        // doivent pas pouvoir lui reprendre la victoire.
        if (!updated.winnerPlayerId) {
          const winner = detectWinner(updated)
          if (winner) {
            updated.winnerPlayerId = winner
            updated.finishedAt = new Date().toISOString()
          }
        }
        return updated
      })
    },

    undoLastTurn(gameId) {
      replaceGame(gameId, (game) => {
        if (game.turns.length === 0) return game
        const turns = game.turns.slice(0, -1)
        const updated: Game = {
          ...game,
          turns,
          // Rendre la main au joueur dont on vient d'annuler le tour.
          currentPlayerIndex:
            game.players.length === 0
              ? 0
              : (game.currentPlayerIndex - 1 + game.players.length) % game.players.length,
        }
        delete updated.winnerPlayerId
        delete updated.finishedAt

        const winner = detectWinner(updated)
        if (winner) {
          updated.winnerPlayerId = winner
          updated.finishedAt = game.finishedAt ?? new Date().toISOString()
        }
        return updated
      })
    },

    updateRules(rules) {
      const { games, settings } = get()
      const next: Settings = { ...settings, rules }
      set({ settings: next })
      persist(games, next)
    },

    applyImport(incoming) {
      const { games, settings } = get()
      const merged = mergeState({ version: 2, games, settings }, incoming)
      set({ games: merged.games })
      persist(merged.games, settings)
      return merged.games.length - games.length
    },

    gameById(gameId) {
      return get().games.find((game) => game.id === gameId)
    },

    lastGame() {
      const { games } = get()
      return games.length > 0 ? games[games.length - 1] : undefined
    },
  }
})
