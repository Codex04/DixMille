import { describe, expect, it } from 'vitest'
import {
  createPreset,
  DIX_MILLE_PRESET,
  MAX_AMOUNTS,
  normalizeAmounts,
} from '../../src/domain/preset'

describe('preset Dix-Mille fourni d’origine', () => {
  it('reprend exactement les boutons de la toute première app', () => {
    expect(DIX_MILLE_PRESET.amounts).toEqual([50, 100, 400, 500, 1000])
  })

  it('vise 10000 points avec un minimum de 400 par tour', () => {
    expect(DIX_MILLE_PRESET.target).toBe(10_000)
    expect(DIX_MILLE_PRESET.minimumTurnScore).toBe(400)
    expect(DIX_MILLE_PRESET.scoreStep).toBe(10)
  })
})

describe('nouveau preset', () => {
  it('n’impose ni minimum par tour ni pas de score', () => {
    // Le minimum de 400 est une règle propre au Dix-Mille : l'appliquer par
    // défaut à un jeu quelconque fausserait tous les scores.
    const preset = createPreset('p1')

    expect(preset.minimumTurnScore).toBe(0)
    expect(preset.scoreStep).toBe(1)
  })

  it('démarre avec des montants exploitables', () => {
    expect(createPreset('p1').amounts.length).toBeGreaterThan(0)
  })
})

describe('normalisation des montants', () => {
  it('trie par ordre croissant', () => {
    expect(normalizeAmounts([500, 50, 1000, 100])).toEqual([50, 100, 500, 1000])
  })

  it('supprime les doublons', () => {
    expect(normalizeAmounts([50, 50, 100])).toEqual([50, 100])
  })

  it('écarte zéro, les négatifs et les valeurs non finies', () => {
    expect(normalizeAmounts([0, -50, 100, Number.NaN, Number.POSITIVE_INFINITY])).toEqual([100])
  })

  it('tronque les décimales', () => {
    expect(normalizeAmounts([50.7, 100.2])).toEqual([50, 100])
  })

  it('plafonne la liste pour que la grille reste lisible', () => {
    const many = Array.from({ length: 30 }, (_, index) => (index + 1) * 10)
    expect(normalizeAmounts(many)).toHaveLength(MAX_AMOUNTS)
  })

  it('accepte une liste vide', () => {
    expect(normalizeAmounts([])).toEqual([])
  })
})
