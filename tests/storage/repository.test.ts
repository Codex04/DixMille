import { describe, expect, it } from 'vitest'
import { createPreset, DIX_MILLE_PRESET } from '../../src/domain/preset'
import type { Game, PersistedState } from '../../src/domain/types'
import { exportState, importState, mergeState } from '../../src/storage/repository'
import { defaultState } from '../../src/storage/schema'

function gameNamed(id: string, presetName: string): Game {
  return {
    id,
    players: [
      { id: `${id}-p1`, name: 'Ana' },
      { id: `${id}-p2`, name: 'Bo' },
    ],
    turns: [{ id: `${id}-t1`, playerId: `${id}-p1`, points: 500, at: '2026-01-01T10:00:00.000Z' }],
    currentPlayerIndex: 1,
    createdAt: '2026-01-01T10:00:00.000Z',
    preset: { ...DIX_MILLE_PRESET, name: presetName },
  }
}

function stateWith(games: Game[], presets = [DIX_MILLE_PRESET]): PersistedState {
  return {
    version: 2,
    games,
    settings: { presets, activePresetId: presets[0]!.id, theme: 'dark' },
  }
}

describe('aller-retour export / import', () => {
  it('emporte les jeux, pas seulement les parties', () => {
    const tarot = { ...createPreset('tarot', 'Tarot'), target: 500, amounts: [10, 20, 50] }
    const source = stateWith([gameNamed('g1', 'Dix-Mille')], [DIX_MILLE_PRESET, tarot])

    const result = importState(exportState(source))
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.state.settings.presets.map((preset) => preset.name)).toEqual([
      'Dix-Mille',
      'Tarot',
    ])
    expect(result.state.settings.presets[1]?.amounts).toEqual([10, 20, 50])
  })

  it('conserve les scores', () => {
    const result = importState(exportState(stateWith([gameNamed('g1', 'Dix-Mille')])))
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.state.games[0]?.turns[0]?.points).toBe(500)
  })

  it('accepte un état nu, sans l’enveloppe d’export', () => {
    const nu = JSON.stringify(stateWith([gameNamed('g1', 'Dix-Mille')]))
    const result = importState(nu)

    expect(result.ok).toBe(true)
  })

  it('rejette un fichier qui n’est pas du JSON', () => {
    expect(importState('pas du json').ok).toBe(false)
  })
})

describe('fusion d’un import', () => {
  it('ajoute les jeux absents', () => {
    const tarot = createPreset('tarot', 'Tarot')
    const current = stateWith([])
    const incoming = stateWith([], [DIX_MILLE_PRESET, tarot])

    const merged = mergeState(current, incoming)

    expect(merged.settings.presets.map((preset) => preset.id)).toEqual(['dix-mille', 'tarot'])
  })

  it('ne duplique pas un jeu déjà connu', () => {
    const current = stateWith([], [DIX_MILLE_PRESET])
    const merged = mergeState(current, stateWith([], [DIX_MILLE_PRESET]))

    expect(merged.settings.presets).toHaveLength(1)
  })

  it('garde la version locale d’un jeu modifié des deux côtés', () => {
    const local = { ...DIX_MILLE_PRESET, target: 5000 }
    const distant = { ...DIX_MILLE_PRESET, target: 20_000 }

    const merged = mergeState(stateWith([], [local]), stateWith([], [distant]))

    expect(merged.settings.presets[0]?.target).toBe(5000)
  })

  it('ajoute les parties absentes sans toucher aux existantes', () => {
    const current = stateWith([gameNamed('g1', 'Dix-Mille')])
    const incoming = stateWith([gameNamed('g1', 'Dix-Mille'), gameNamed('g2', 'Dix-Mille')])

    const merged = mergeState(current, incoming)

    expect(merged.games.map((game) => game.id)).toEqual(['g1', 'g2'])
  })

  it('ne réimporte pas une partie déjà migrée depuis l’ancienne app', () => {
    const migrated: Game = { ...gameNamed('local', 'Dix-Mille'), legacyId: 7 }
    const duplicate: Game = { ...gameNamed('distant', 'Dix-Mille'), legacyId: 7 }

    const merged = mergeState(stateWith([migrated]), stateWith([duplicate]))

    expect(merged.games).toHaveLength(1)
  })

  it('laisse le preset actif inchangé', () => {
    const merged = mergeState(defaultState(), stateWith([], [createPreset('autre', 'Autre')]))

    expect(merged.settings.activePresetId).toBe(DIX_MILLE_PRESET.id)
  })
})
