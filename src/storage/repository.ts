import type { PersistedState } from '../domain/types'
import { KEY_CORRUPT_STATE, KEY_STATE } from './keys'
import { markMigrated, runMigrationIfNeeded, type MigrationReport } from './migrate'
import { defaultState, parseState } from './schema'

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export interface LoadResult {
  state: PersistedState
  /** Renseigné uniquement lorsqu'une migration vient d'avoir lieu. */
  migration?: MigrationReport
  /** Parties écartées à la lecture faute d'être exploitables. */
  dropped: number
}

/**
 * Charge l'état, migre les parties de l'ancienne app si nécessaire, et
 * persiste le résultat.
 *
 * L'ordre est important : le drapeau de migration n'est posé qu'*après* une
 * écriture réussie. Le poser avant ferait perdre définitivement l'import si
 * la sauvegarde échouait (quota dépassé, navigation privée).
 */
export function loadState(storage: Storage): LoadResult {
  let state = defaultState()
  let dropped = 0

  const raw = safeGet(storage, KEY_STATE)
  if (raw !== null) {
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(raw)
    } catch {
      parsedJson = null
    }

    const result = parseState(parsedJson)
    state = result.state
    dropped = result.dropped

    // Un état illisible est mis de côté, jamais écrasé en silence.
    if (result.unreadable || result.dropped > 0) {
      safeSet(storage, KEY_CORRUPT_STATE, raw)
    }
  }

  const outcome = runMigrationIfNeeded(storage, state)
  if (!outcome) return { state, dropped }

  const persisted = saveState(storage, outcome.state)
  if (persisted && !outcome.report.error) {
    markMigrated(storage, outcome.report.ranAt)
  }

  return { state: outcome.state, migration: outcome.report, dropped }
}

export function saveState(storage: Storage, state: PersistedState): boolean {
  return safeSet(storage, KEY_STATE, JSON.stringify(state))
}

/** Sauvegarde manuelle, destinée au bouton « Exporter » des réglages. */
export function exportState(state: PersistedState): string {
  return JSON.stringify(
    { app: 'dixmille', version: 2, exportedAt: new Date().toISOString(), state },
    null,
    2,
  )
}

export type ImportResult =
  | { ok: true; state: PersistedState; dropped: number }
  | { ok: false; error: string }

/**
 * Relit un fichier d'export. Accepte aussi bien l'enveloppe produite par
 * `exportState` qu'un état nu, pour rester tolérant à un copier-coller.
 */
export function importState(json: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Fichier illisible : ce n’est pas du JSON valide.' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Fichier illisible : contenu inattendu.' }
  }

  const source = parsed as Record<string, unknown>
  const candidate = 'state' in source ? source.state : source

  const result = parseState(candidate)
  if (result.unreadable) {
    return { ok: false, error: 'Ce fichier ne contient pas de sauvegarde Dix-Mille.' }
  }

  return { ok: true, state: result.state, dropped: result.dropped }
}

/** Fusionne un import dans l'état courant sans écraser les parties existantes. */
export function mergeState(current: PersistedState, incoming: PersistedState): PersistedState {
  const knownIds = new Set(current.games.map((game) => game.id))
  const knownLegacyIds = new Set(
    current.games.map((game) => game.legacyId).filter((id): id is number => id !== undefined),
  )

  const added = incoming.games.filter((game) => {
    if (knownIds.has(game.id)) return false
    if (game.legacyId !== undefined && knownLegacyIds.has(game.legacyId)) return false
    return true
  })

  return { ...current, games: [...current.games, ...added] }
}
