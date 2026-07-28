import { DEFAULT_RULES, type RuleSet } from '../domain/rules'
import type { Game, PersistedState, Player, Turn } from '../domain/types'
import { createId } from '../lib/id'
import { KEY_LEGACY_BACKUP, KEY_MIGRATED_AT, KEY_MIGRATION_REPORT } from './keys'
import { readLegacyGames, type LegacyGame, type SkippedLegacyKey } from './legacy'

/**
 * Migration one-shot des parties de l'app Blazor.
 *
 * Trois garanties, dans cet ordre d'importance :
 *  1. les clés `game-*` ne sont **jamais** ni supprimées ni écrasées ;
 *  2. une copie brute est prise avant la moindre écriture ;
 *  3. une erreur, même totale, laisse le drapeau de migration non posé et
 *     l'app démarre quand même — sur un état vide plutôt que sur rien.
 */

export interface MigrationReport {
  ranAt: string
  importedGames: number
  importedTurns: number
  skipped: SkippedLegacyKey[]
  error?: string
}

export interface MigrationDeps {
  createId: () => string
  now: () => Date
}

const defaultDeps: MigrationDeps = { createId, now: () => new Date() }

/** Convertit une date legacy en ISO, avec repli si elle est illisible. */
function toIso(value: string, fallback: Date): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString()
}

/**
 * Convertit une partie legacy.
 *
 * Le score final de chaque joueur devient un **tour de report unique**
 * plutôt qu'un champ à part : le modèle « score = somme des tours » reste
 * ainsi uniforme, sans cas particulier dans le reste du code, et le score
 * dérivé retombe exactement sur l'ancien.
 */
export function convertLegacyGame(
  legacy: LegacyGame,
  rules: RuleSet,
  deps: MigrationDeps = defaultDeps,
): Game {
  const createdAt = toIso(legacy.creationDate, deps.now())

  const players: Player[] = legacy.players.map((player) => ({
    id: deps.createId(),
    name: player.name,
  }))

  // Premier arrivé, premier servi : c'est la sémantique du FirstOrDefault
  // de l'ancienne app, qui autorisait en théorie des doublons de casse.
  const byName = new Map<string, Player>()
  players.forEach((player) => {
    const key = player.name.trim().toLowerCase()
    if (!byName.has(key)) byName.set(key, player)
  })

  const turns: Turn[] = []
  legacy.players.forEach((legacyPlayer, index) => {
    const player = players[index]
    if (!player || legacyPlayer.score === 0) return
    turns.push({
      id: deps.createId(),
      playerId: player.id,
      points: legacyPlayer.score,
      at: createdAt,
      imported: true,
    })
  })

  const winner = byName.get(legacy.winnerPlayerName.trim().toLowerCase())
  const lastPlayer = byName.get(legacy.lastPlayerName.trim().toLowerCase())

  const lastIndex = lastPlayer ? players.findIndex((player) => player.id === lastPlayer.id) : -1
  const currentPlayerIndex =
    lastIndex >= 0 && players.length > 0 ? (lastIndex + 1) % players.length : 0

  const game: Game = {
    id: deps.createId(),
    legacyId: legacy.id,
    players,
    turns,
    currentPlayerIndex,
    createdAt,
    rules,
  }

  if (winner) {
    game.winnerPlayerId = winner.id
    // L'ancienne app ne datait pas la fin de partie ; la date de création
    // est la seule information disponible.
    game.finishedAt = createdAt
  }

  return game
}

export function hasMigrated(storage: Storage): boolean {
  try {
    return storage.getItem(KEY_MIGRATED_AT) !== null
  } catch {
    return false
  }
}

export interface MigrationOutcome {
  state: PersistedState
  report: MigrationReport
}

/**
 * Exécute la migration si elle n'a pas déjà eu lieu.
 * Renvoie `null` quand il n'y a rien à faire.
 */
export function runMigrationIfNeeded(
  storage: Storage,
  state: PersistedState,
  deps: MigrationDeps = defaultDeps,
): MigrationOutcome | null {
  if (hasMigrated(storage)) return null

  const ranAt = deps.now().toISOString()

  try {
    const { games: legacyGames, skipped, raw } = readLegacyGames(storage)

    // Sauvegarde brute avant toute écriture. Si elle échoue, on continue :
    // rien n'est détruit de toute façon, les clés `game-*` restent en place.
    if (Object.keys(raw).length > 0) {
      try {
        storage.setItem(
          KEY_LEGACY_BACKUP,
          JSON.stringify({ capturedAt: ranAt, raw }),
        )
      } catch {
        // Quota dépassé : on poursuit sans la copie de sécurité.
      }
    }

    const alreadyImported = new Set(
      state.games.map((game) => game.legacyId).filter((id): id is number => id !== undefined),
    )

    const rules = state.settings.rules ?? DEFAULT_RULES
    const imported: Game[] = []
    for (const legacy of legacyGames) {
      if (alreadyImported.has(legacy.id)) continue
      imported.push(convertLegacyGame(legacy, rules, deps))
    }

    const report: MigrationReport = {
      ranAt,
      importedGames: imported.length,
      importedTurns: imported.reduce((total, game) => total + game.turns.length, 0),
      skipped,
    }

    const nextState: PersistedState = {
      ...state,
      games: [...state.games, ...imported],
    }

    try {
      storage.setItem(KEY_MIGRATION_REPORT, JSON.stringify(report))
    } catch {
      // Le compte rendu est un confort, pas une donnée critique.
    }

    return { state: nextState, report }
  } catch (error) {
    // Le drapeau n'est volontairement pas posé : la migration sera retentée
    // au prochain démarrage, et les clés legacy sont intactes.
    return {
      state,
      report: {
        ranAt,
        importedGames: 0,
        importedTurns: 0,
        skipped: [],
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

/**
 * Pose le drapeau d'idempotence. À n'appeler qu'une fois l'état migré
 * effectivement persisté — sinon un échec d'écriture ferait perdre
 * l'import sans possibilité de le rejouer.
 */
export function markMigrated(storage: Storage, at: string): void {
  try {
    storage.setItem(KEY_MIGRATED_AT, at)
  } catch {
    // Sans le drapeau la migration sera rejouée, ce qui est sans danger :
    // la déduplication par `legacyId` empêche les doublons.
  }
}
