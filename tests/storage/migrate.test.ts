import { describe, expect, it } from 'vitest'
import { DIX_MILLE_PRESET } from '../../src/domain/preset'
import { scoreOf, scoresOf } from '../../src/domain/score'
import { KEY_LEGACY_BACKUP, KEY_MIGRATED_AT } from '../../src/storage/keys'
import { readLegacyGames } from '../../src/storage/legacy'
import { convertLegacyGame, runMigrationIfNeeded } from '../../src/storage/migrate'
import { loadState, saveState } from '../../src/storage/repository'
import { defaultState } from '../../src/storage/schema'
import { deterministicDeps, storageWithLegacyData } from '../helpers/memoryStorage'

describe('lecture des données Blazor', () => {
  it('lit le PascalCase, qui est le format réel de production', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const first = games.find((game) => game.id === 1)

    expect(first).toBeDefined()
    expect(first?.players).toEqual([
      { name: 'Alice', score: 0 },
      { name: 'Bob', score: 0 },
    ])
    expect(first?.creationDate).toBe('2026-07-28T21:22:57.166+02:00')
  })

  it('accepte aussi le camelCase par précaution', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const camel = games.find((game) => game.id === 5)

    expect(camel?.players).toEqual([{ name: 'camel', score: 600 }])
  })

  it('écarte une entrée corrompue sans lever ni perdre les autres', () => {
    const { games, skipped } = readLegacyGames(storageWithLegacyData())

    expect(skipped.map((entry) => entry.key)).toContain('game-4')
    expect(games.map((game) => game.id)).toEqual([1, 2, 3, 5])
  })

  it('ignore les clés étrangères présentes sur la même origine', () => {
    const { games, skipped } = readLegacyGames(storageWithLegacyData())
    const keys = [...games.map((game) => game.key), ...skipped.map((entry) => entry.key)]

    expect(keys).not.toContain('unrelated-key')
  })
})

describe('conversion d’une partie', () => {
  it('reconstitue exactement les scores d’origine', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const legacy = games.find((game) => game.id === 2)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    const totals = scoresOf(converted)
    const byName = new Map(converted.players.map((player) => [player.name, totals.get(player.id)]))

    expect(byName.get('Sacha')).toBe(10_250)
    expect(byName.get('Julie')).toBe(8400)
    expect(byName.get('Clem')).toBe(7150)
    expect(byName.get('Quentin')).toBe(9800)
  })

  it('conserve les scores négatifs issus d’une relance ratée', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const legacy = games.find((game) => game.id === 3)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    const clem = converted.players.find((player) => player.name === 'Clem')!
    expect(scoreOf(converted, clem.id)).toBe(-450)
  })

  it('préserve le gagnant et marque la partie terminée', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const legacy = games.find((game) => game.id === 2)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    const sacha = converted.players.find((player) => player.name === 'Sacha')!
    expect(converted.winnerPlayerId).toBe(sacha.id)
    expect(converted.finishedAt).toBeDefined()
  })

  it('ne crée pas de tour pour un joueur à zéro', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const legacy = games.find((game) => game.id === 1)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    expect(converted.turns).toHaveLength(0)
    expect(converted.players).toHaveLength(2)
  })

  it('fait passer la main au joueur suivant le dernier ayant joué', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    // game-3 : joueurs [Quentin, Clem, Julie], dernier joueur = Clem (index 1).
    const legacy = games.find((game) => game.id === 3)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    expect(converted.currentPlayerIndex).toBe(2)
    expect(converted.players[converted.currentPlayerIndex]?.name).toBe('Julie')
  })

  it('conserve legacyId et une date de création valide', () => {
    const { games } = readLegacyGames(storageWithLegacyData())
    const legacy = games.find((game) => game.id === 2)!
    const converted = convertLegacyGame(legacy, DIX_MILLE_PRESET, deterministicDeps())

    expect(converted.legacyId).toBe(2)
    expect(Number.isNaN(new Date(converted.createdAt).getTime())).toBe(false)
    expect(converted.createdAt).toBe(new Date('2025-08-02T20:14:03.881+02:00').toISOString())
  })
})

describe('migration complète', () => {
  it('importe toutes les parties exploitables', () => {
    const storage = storageWithLegacyData()
    const outcome = runMigrationIfNeeded(storage, defaultState(), deterministicDeps())!

    expect(outcome.report.importedGames).toBe(4)
    expect(outcome.state.games.map((game) => game.legacyId).sort()).toEqual([1, 2, 3, 5])
    expect(outcome.report.skipped.map((entry) => entry.key)).toEqual(['game-4'])
  })

  it('ne supprime jamais les clés de l’ancienne app', () => {
    const storage = storageWithLegacyData()
    const before = storage.snapshot()

    loadState(storage)

    for (const key of Object.keys(before)) {
      expect(storage.getItem(key)).toBe(before[key])
    }
  })

  it('prend une copie de sécurité avant d’écrire', () => {
    const storage = storageWithLegacyData()
    loadState(storage)

    const backup = JSON.parse(storage.getItem(KEY_LEGACY_BACKUP)!)
    expect(backup.raw['game-2']).toContain('"Sacha"')
    // Même l'entrée corrompue est sauvegardée : elle pourra être récupérée
    // à la main plutôt que perdue.
    expect(backup.raw['game-4']).toBeDefined()
  })

  it('est idempotente : recharger deux fois ne duplique rien', () => {
    const storage = storageWithLegacyData()

    const first = loadState(storage)
    expect(first.migration?.importedGames).toBe(4)

    const second = loadState(storage)
    expect(second.migration).toBeUndefined()
    expect(second.state.games).toHaveLength(4)
  })

  it('ne pose pas le drapeau si la sauvegarde échoue, pour pouvoir réessayer', () => {
    const storage = storageWithLegacyData()
    storage.failOnWrite = true

    const result = loadState(storage)

    expect(result.state.games).toHaveLength(4)
    expect(storage.getItem(KEY_MIGRATED_AT)).toBeNull()

    // Une fois l'écriture rétablie, la migration se rejoue correctement.
    storage.failOnWrite = false
    const retry = loadState(storage)
    expect(retry.state.games).toHaveLength(4)
    expect(storage.getItem(KEY_MIGRATED_AT)).not.toBeNull()
  })

  it('ne réimporte pas une partie déjà migrée', () => {
    const storage = storageWithLegacyData()
    const migrated = runMigrationIfNeeded(storage, defaultState(), deterministicDeps())!
    saveState(storage, migrated.state)

    // Le drapeau n'est pas posé : la migration est relancée sur un état
    // qui contient déjà les parties.
    const again = runMigrationIfNeeded(storage, migrated.state, deterministicDeps(100))!

    expect(again.report.importedGames).toBe(0)
    expect(again.state.games).toHaveLength(4)
  })

  it('démarre sur un stockage vierge sans rien importer', () => {
    const storage = storageWithLegacyData()
    storage.clear()

    const result = loadState(storage)

    expect(result.state.games).toEqual([])
    expect(result.migration?.importedGames).toBe(0)
  })
})
