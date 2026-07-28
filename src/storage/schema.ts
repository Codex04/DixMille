import * as v from 'valibot'
import { DEFAULT_RULES, type ToggleableCombo } from '../domain/rules'
import type { Game, PersistedState, Settings } from '../domain/types'

/**
 * Validation défensive de l'état persisté.
 *
 * Principe : une donnée abîmée ne doit jamais faire perdre plus que
 * nécessaire. Les champs de réglages retombent individuellement sur leur
 * défaut, et une partie illisible est écartée seule, sans emporter les
 * autres.
 */

function toggleable(fallback: ToggleableCombo) {
  return v.fallback(
    v.object({
      enabled: v.fallback(v.boolean(), fallback.enabled),
      points: v.fallback(v.number(), fallback.points),
    }),
    fallback,
  )
}

export const ruleSetSchema = v.object({
  target: v.fallback(v.number(), DEFAULT_RULES.target),
  minimumTurnScore: v.fallback(v.number(), DEFAULT_RULES.minimumTurnScore),
  scoreStep: v.fallback(v.number(), DEFAULT_RULES.scoreStep),
  single1: v.fallback(v.number(), DEFAULT_RULES.single1),
  single5: v.fallback(v.number(), DEFAULT_RULES.single5),
  tripleOf1: v.fallback(v.number(), DEFAULT_RULES.tripleOf1),
  tripleMultiplier: v.fallback(v.number(), DEFAULT_RULES.tripleMultiplier),
  quadFactor: v.fallback(v.number(), DEFAULT_RULES.quadFactor),
  quintMultiplier: v.fallback(v.number(), DEFAULT_RULES.quintMultiplier),
  quintOf1: v.fallback(v.number(), DEFAULT_RULES.quintOf1),
  sextetWins: v.fallback(v.boolean(), DEFAULT_RULES.sextetWins),
  straight: toggleable(DEFAULT_RULES.straight),
  threePairs: toggleable(DEFAULT_RULES.threePairs),
})

export const playerSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  name: v.string(),
})

export const comboEntrySchema = v.object({
  comboId: v.string(),
  count: v.number(),
  points: v.number(),
})

export const turnSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  playerId: v.pipe(v.string(), v.minLength(1)),
  points: v.pipe(v.number(), v.integer()),
  at: v.string(),
  imported: v.optional(v.boolean()),
  breakdown: v.optional(v.array(comboEntrySchema)),
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
  rules: v.fallback(ruleSetSchema, DEFAULT_RULES),
})

export const settingsSchema = v.object({
  rules: v.fallback(ruleSetSchema, DEFAULT_RULES),
  theme: v.fallback(v.picklist(['dark', 'light']), 'dark'),
})

export function defaultSettings(): Settings {
  return { rules: { ...DEFAULT_RULES }, theme: 'dark' }
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
  const settings = settingsResult.success ? settingsResult.output : defaultSettings()

  // Chaque partie est validée séparément : une seule partie corrompue ne
  // doit pas emporter tout l'historique.
  const rawGames = Array.isArray(source.games) ? source.games : []
  const games: Game[] = []
  let dropped = 0

  for (const rawGame of rawGames) {
    const result = v.safeParse(gameSchema, rawGame)
    if (result.success) {
      games.push(result.output as Game)
    } else {
      dropped += 1
    }
  }

  return {
    state: { version: 2, games, settings: settings as Settings },
    dropped,
    unreadable: false,
  }
}
