import { describe, expect, it } from 'vitest'
import {
  buildCombos,
  DEFAULT_RULES,
  evaluateSelection,
  quadValue,
  quintValue,
  tripleValue,
} from '../../src/domain/rules'

describe('table de points confirmée', () => {
  it('applique 1 = 100 et 5 = 50', () => {
    expect(DEFAULT_RULES.single1).toBe(100)
    expect(DEFAULT_RULES.single5).toBe(50)
  })

  it('donne 1000 au brelan d’as, X00 aux autres brelans', () => {
    expect(tripleValue(1, DEFAULT_RULES)).toBe(1000)
    expect(tripleValue(2, DEFAULT_RULES)).toBe(200)
    expect(tripleValue(5, DEFAULT_RULES)).toBe(500)
    expect(tripleValue(6, DEFAULT_RULES)).toBe(600)
  })

  it('donne X000 à cinq dés identiques', () => {
    expect(quintValue(2, DEFAULT_RULES)).toBe(2000)
    expect(quintValue(4, DEFAULT_RULES)).toBe(4000)
    expect(quintValue(6, DEFAULT_RULES)).toBe(6000)
  })

  it('fixe le minimum par tour à 400', () => {
    expect(DEFAULT_RULES.minimumTurnScore).toBe(400)
  })
})

describe('valeurs par défaut non spécifiées', () => {
  it('double le brelan pour un carré', () => {
    expect(quadValue(4, DEFAULT_RULES)).toBe(800)
    expect(quadValue(1, DEFAULT_RULES)).toBe(2000)
  })

  it('laisse la suite et les trois paires désactivées', () => {
    const ids = buildCombos(DEFAULT_RULES).map((combo) => combo.id)
    expect(ids).not.toContain('straight')
    expect(ids).not.toContain('three-pairs')
  })

  it('propose la suite une fois activée', () => {
    const rules = { ...DEFAULT_RULES, straight: { enabled: true, points: 1500 } }
    const straight = buildCombos(rules).find((combo) => combo.id === 'straight')

    expect(straight?.points).toBe(1500)
    expect(straight?.diceUsed).toBe(6)
  })
})

describe('addition d’une sélection', () => {
  it('additionne plusieurs combinaisons', () => {
    // Un brelan de 5 (500) plus deux « 1 » isolés (200).
    const total = evaluateSelection({ 'triple-5': 1, 'single-1': 2 }, DEFAULT_RULES)

    expect(total.points).toBe(700)
    expect(total.diceUsed).toBe(5)
  })

  it('ignore les combinaisons inconnues ou à zéro', () => {
    const total = evaluateSelection(
      { 'triple-5': 1, 'combo-inexistante': 3, 'single-1': 0 },
      DEFAULT_RULES,
    )

    expect(total.points).toBe(500)
    expect(total.entries).toHaveLength(1)
  })

  it('autorise plus de six dés, car un hot dice permet de relancer et cumuler', () => {
    const total = evaluateSelection({ 'triple-1': 1, 'triple-6': 1, 'single-5': 2 }, DEFAULT_RULES)

    expect(total.diceUsed).toBe(8)
    expect(total.points).toBe(1700)
  })

  it('renvoie zéro pour une sélection vide', () => {
    expect(evaluateSelection({}, DEFAULT_RULES).points).toBe(0)
  })
})
