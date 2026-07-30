import * as v from 'valibot'
import { DIX_MILLE_PRESET, normalizeAmounts, type Preset } from '../domain/preset'
import type { Game, PersistedState, Settings } from '../domain/types'

/**
 * Validation défensive de l'état persisté.
 *
 * Principe : une donnée abîmée ne doit jamais faire perdre plus que
 * nécessaire. Les champs retombent individuellement sur leur défaut, et une
 * partie illisible est écartée seule, sans emporter les autres.
 */

export const presetSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.fallback(v.string(), DIX_MILLE_PRESET.name),
  target: v.fallback(v.number(), DIX_MILLE_PRESET.target),
  amounts: v.fallback(v.array(v.number()), DIX_MILLE_PRESET.amounts),
  minimumTurnScore: v.fallback(v.number(), 0),
  scoreStep: v.fallback(v.number(), 1),
})

export const playerSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.string(),
})

export const turnSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  playerId: v.pipe(v.string(), v.minLength(1)),
  points: v.pipe(v.number(), v.integer()),
  at: v.string(),
  imported: v.optional(v.boolean()),
})

export const gameSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  legacyId: v.optional(v.number()),
  players: v.pipe(v.array(playerSchema), v.minLength(1)),
  turns: v.array(turnSchema),
  currentPlayerIndex: v.fallback(v.number(), 0),
  createdAt: v.string(),
  finishedAt: v.optional(v.string()),
  winnerPlayerId: v.optional(v.string()),
  preset: v.fallback(presetSchema, DIX_MILLE_PRESET),
})

export const settingsSchema = v.object({
  presets: v.fallback(v.pipe(v.array(presetSchema), v.minLength(1)), [DIX_MILLE_PRESET]),
  activePresetId: v.fallback(v.string(), DIX_MILLE_PRESET.id),
  theme: v.fallback(v.picklist(['dark', 'light']), 'dark'),
})

export function defaultSettings(): Settings {
  return {
    presets: [{ ...DIX_MILLE_PRESET }],
    activePresetId: DIX_MILLE_PRESET.id,
    theme: 'dark',
  }
}

export function defaultState(): PersistedState {
  return { version: 2, games: [], settings: defaultSettings() }
}

export interface ParseStateResult {
  state: PersistedState
  /** Parties écartées faute d'être exploitables. */
  dropped: number
  /** Vrai si l'entrée était inexploitable dans son ensemble. */
  unreadable: boolean
}

/** Remet d'aplomb un preset relu du stockage. */
function sanitizePreset(preset: Preset): Preset {
  const amounts = normalizeAmounts(preset.amounts)
  return {
    ...preset,
    // Un preset sans montant rendrait l'onglet Rapide inutilisable.
    amounts: amounts.length > 0 ? amounts : DIX_MILLE_PRESET.amounts,
    scoreStep: preset.scoreStep > 0 ? preset.scoreStep : 1,
    minimumTurnScore: Math.max(0, preset.minimumTurnScore),
  }
}

/**
 * Reconstruit un état à partir d'une valeur quelconque.
 * Ne lève jamais : au pire, renvoie l'état par défaut.
 */
export function parseState(input: unknown): ParseStateResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { state: defaultState(), dropped: 0, unreadable: true }
  }

  const source = input as Record<string, unknown>

  const settingsResult = v.safeParse(settingsSchema, source.settings)
  const settings: Settings = settingsResult.success
    ? {
        ...(settingsResult.output as Settings),
        presets: (settingsResult.output as Settings).presets.map(sanitizePreset),
      }
    : defaultSettings()

  // Le preset actif doit exister, sinon la création de partie échouerait.
  if (!settings.presets.some((preset) => preset.id === settings.activePresetId)) {
    settings.activePresetId = settings.presets[0]?.id ?? DIX_MILLE_PRESET.id
  }

  // Chaque partie est validée séparément : une seule partie corrompue ne
  // doit pas emporter tout l'historique.
  const rawGames = Array.isArray(source.games) ? source.games : []
  const games: Game[] = []
  let dropped = 0

  for (const rawGame of rawGames) {
    const result = v.safeParse(gameSchema, rawGame)
    if (result.success) {
      const game = result.output as Game
      games.push({ ...game, preset: sanitizePreset(game.preset) })
    } else {
      dropped += 1
    }
  }

  return {
    state: { version: 2, games, settings },
    dropped,
    unreadable: false,
  }
}
