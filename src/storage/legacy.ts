import { LEGACY_KEY_PATTERN } from './keys'

/**
 * Lecture des parties écrites par l'app Blazor.
 *
 * Format observé en production (et non déduit de la documentation) :
 *
 *   clé    : game-1
 *   valeur : {"Id":1,"Players":[{"Name":"Alice","Score":0}],
 *             "LastPlayerName":"","WinnerPlayerName":"",
 *             "CreationDate":"2026-07-28T21:22:57.166+02:00"}
 *
 * Deux détails comptent :
 *  - les propriétés sont en **PascalCase** (Blazored.LocalStorage 4.5.0
 *    n'applique aucune PropertyNamingPolicy) ;
 *  - la valeur est du JSON brut, pas une chaîne ré-encodée.
 *
 * Le camelCase est malgré tout accepté, au cas où une version antérieure
 * aurait sérialisé différemment : se tromper ici reviendrait à lire `{}`
 * pour chaque partie et à effacer silencieusement tous les scores.
 */

export interface LegacyPlayer {
  name: string
  score: number
}

export interface LegacyGame {
  key: string
  id: number
  players: LegacyPlayer[]
  lastPlayerName: string
  winnerPlayerName: string
  creationDate: string
}

export interface SkippedLegacyKey {
  key: string
  reason: string
}

export interface LegacyReadResult {
  games: LegacyGame[]
  skipped: SkippedLegacyKey[]
  /** Contenu brut, tel quel, pour la sauvegarde de sécurité. */
  raw: Record<string, string>
}

/** Indexe les propriétés en minuscules : absorbe PascalCase comme camelCase. */
function lowerKeys(source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    result[key.toLowerCase()] = value
  }
  return result
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePlayers(value: unknown): LegacyPlayer[] {
  if (!Array.isArray(value)) return []
  const players: LegacyPlayer[] = []
  for (const entry of value) {
    if (!isRecord(entry)) continue
    const fields = lowerKeys(entry)
    const name = asString(fields.name).trim()
    if (name === '') continue
    players.push({ name, score: Math.trunc(asNumber(fields.score)) })
  }
  return players
}

/** Liste les clés du stockage sans jamais lever d'exception. */
function safeKeys(storage: Storage): string[] {
  try {
    const keys: string[] = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key !== null) keys.push(key)
    }
    return keys
  } catch {
    return []
  }
}

/**
 * Analyse une valeur brute. Renvoie `null` avec une raison plutôt que de
 * lever : un enregistrement corrompu ne doit jamais empêcher l'app de
 * démarrer.
 */
export function parseLegacyGame(
  key: string,
  raw: string,
): { game: LegacyGame } | { reason: string } {
  const match = LEGACY_KEY_PATTERN.exec(key)
  if (!match) return { reason: 'clé hors du motif game-<n>' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { reason: 'JSON illisible' }
  }

  if (!isRecord(parsed)) return { reason: 'la valeur n’est pas un objet' }

  const fields = lowerKeys(parsed)
  const players = parsePlayers(fields.players)
  if (players.length === 0) return { reason: 'aucun joueur exploitable' }

  return {
    game: {
      key,
      // L'identifiant de la clé fait autorité : c'est lui qui est unique.
      id: asNumber(fields.id, Number(match[1])),
      players,
      lastPlayerName: asString(fields.lastplayername),
      winnerPlayerName: asString(fields.winnerplayername),
      creationDate: asString(fields.creationdate),
    },
  }
}

/** Lit toutes les parties legacy présentes dans le stockage. */
export function readLegacyGames(storage: Storage): LegacyReadResult {
  const games: LegacyGame[] = []
  const skipped: SkippedLegacyKey[] = []
  const raw: Record<string, string> = {}

  for (const key of safeKeys(storage)) {
    if (!LEGACY_KEY_PATTERN.test(key)) continue

    let value: string | null = null
    try {
      value = storage.getItem(key)
    } catch {
      skipped.push({ key, reason: 'lecture impossible' })
      continue
    }
    if (value === null) continue

    raw[key] = value

    const result = parseLegacyGame(key, value)
    if ('reason' in result) {
      skipped.push({ key, reason: result.reason })
      continue
    }
    games.push(result.game)
  }

  games.sort((a, b) => a.id - b.id)
  return { games, skipped, raw }
}
