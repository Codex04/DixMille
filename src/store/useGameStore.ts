import { create } from 'zustand'
import { createPreset, normalizeAmounts, type Preset } from '../domain/preset'
import { nextPlayerIndex, detectWinner } from '../domain/score'
import type { Game, GameId, PersistedState, PlayerId, Settings } from '../domain/types'
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
  createGame: (names: string[], presetId: string) => Game
  addTurn: (gameId: GameId, playerId: PlayerId, points: number) => void
  undoLastTurn: (gameId: GameId) => void

  addPreset: () => Preset
  updatePreset: (presetId: string, patch: Partial<Preset>) => void
  removePreset: (presetId: string) => void
  setActivePreset: (presetId: string) => void

  applyImport: (incoming: PersistedState) => { games: number; presets: number }
  /** Ajoute des jeux reçus par lien. Renvoie le nombre réellement ajouté. */
  importPresets: (incoming: Preset[]) => number
}

export const useGameStore = create<GameStore>((set, get) => {
  function persist(games: Game[], settings: Settings): void {
    const store = storage()
    if (store) saveState(store, { version: 2, games, settings })
  }

  function commitSettings(settings: Settings): void {
    set({ settings })
    persist(get().games, settings)
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

    createGame(names, presetId) {
      const { games, settings } = get()
      const preset =
        settings.presets.find((entry) => entry.id === presetId) ?? settings.presets[0]!

      const game: Game = {
        id: createId(),
        players: names.map((name) => ({ id: createId(), name: name.trim() })),
        turns: [],
        currentPlayerIndex: 0,
        createdAt: new Date().toISOString(),
        // Copie figée : modifier le preset plus tard ne réécrira pas cette
        // partie.
        preset: { ...preset, amounts: [...preset.amounts] },
      }

      const nextGames = [...games, game]
      const nextSettings: Settings = { ...settings, activePresetId: preset.id }
      set({ games: nextGames, settings: nextSettings })
      persist(nextGames, nextSettings)
      return game
    },

    addTurn(gameId, playerId, points) {
      replaceGame(gameId, (game) => {
        const turns = [
          ...game.turns,
          { id: createId(), playerId, points, at: new Date().toISOString() },
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

    addPreset() {
      const { settings } = get()
      const preset = createPreset(createId())
      commitSettings({
        ...settings,
        presets: [...settings.presets, preset],
        activePresetId: preset.id,
      })
      return preset
    },

    updatePreset(presetId, patch) {
      const { settings } = get()
      commitSettings({
        ...settings,
        presets: settings.presets.map((preset) =>
          preset.id === presetId
            ? {
                ...preset,
                ...patch,
                ...(patch.amounts ? { amounts: normalizeAmounts(patch.amounts) } : {}),
              }
            : preset,
        ),
      })
    },

    removePreset(presetId) {
      const { settings } = get()
      // Toujours garder au moins un preset : sans lui, impossible de créer
      // une partie.
      if (settings.presets.length <= 1) return

      const presets = settings.presets.filter((preset) => preset.id !== presetId)
      commitSettings({
        ...settings,
        presets,
        activePresetId:
          settings.activePresetId === presetId
            ? (presets[0]?.id ?? settings.activePresetId)
            : settings.activePresetId,
      })
    },

    setActivePreset(presetId) {
      const { settings } = get()
      commitSettings({ ...settings, activePresetId: presetId })
    },

    importPresets(incoming) {
      const { settings } = get()
      const known = new Set(settings.presets.map((preset) => preset.id))
      const added = incoming.filter((preset) => !known.has(preset.id))
      if (added.length === 0) return 0

      commitSettings({ ...settings, presets: [...settings.presets, ...added] })
      return added.length
    },

    applyImport(incoming) {
      const { games, settings } = get()
      const merged = mergeState({ version: 2, games, settings }, incoming)
      set({ games: merged.games, settings: merged.settings })
      persist(merged.games, merged.settings)
      return {
        games: merged.games.length - games.length,
        presets: merged.settings.presets.length - settings.presets.length,
      }
    },
  }
})
