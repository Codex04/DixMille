import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '../../src/domain/rules'
import { isPlayerNameAvailable, validateTurn } from '../../src/domain/validation'

describe('minimum de 400 points par tour', () => {
  it('accepte un tour à exactement 400', () => {
    const result = validateTurn(400, DEFAULT_RULES)

    expect(result.status).toBe('ok')
    expect(result.effectivePoints).toBe(400)
    expect(result.canSubmit).toBe(true)
  })

  it('n’accorde rien entre 1 et 399, tout en restant soumettable', () => {
    const result = validateTurn(390, DEFAULT_RULES)

    expect(result.status).toBe('below-minimum')
    expect(result.effectivePoints).toBe(0)
    // Le tour doit pouvoir être validé : c'est un tour réellement joué,
    // simplement il ne rapporte rien.
    expect(result.canSubmit).toBe(true)
  })

  it('accepte un tour sans point', () => {
    const result = validateTurn(0, DEFAULT_RULES)

    expect(result.status).toBe('zero')
    expect(result.effectivePoints).toBe(0)
  })

  it('applique le seuil à chaque tour, pas seulement au premier', () => {
    // Le seuil ne dépend d'aucun état de joueur : c'est une validation de
    // saisie, appliquée identiquement à tous les tours.
    expect(validateTurn(350, DEFAULT_RULES).effectivePoints).toBe(0)
    expect(validateTurn(350, DEFAULT_RULES).status).toBe('below-minimum')
  })
})

describe('relance ratée après un hot dice', () => {
  it('autorise un score négatif', () => {
    const result = validateTurn(-1000, DEFAULT_RULES)

    expect(result.status).toBe('negative')
    expect(result.effectivePoints).toBe(-1000)
    expect(result.canSubmit).toBe(true)
  })

  it('n’applique pas le minimum de 400 aux négatifs', () => {
    expect(validateTurn(-50, DEFAULT_RULES).effectivePoints).toBe(-50)
  })
})

describe('pas de score', () => {
  it('refuse un score qui n’est pas un multiple de 10', () => {
    const result = validateTurn(455, DEFAULT_RULES)

    expect(result.status).toBe('invalid-step')
    expect(result.canSubmit).toBe(false)
  })

  it('refuse un score non entier', () => {
    expect(validateTurn(400.5, DEFAULT_RULES).canSubmit).toBe(false)
  })
})

describe('noms de joueurs', () => {
  it('refuse un doublon insensible à la casse', () => {
    expect(isPlayerNameAvailable('quentin', ['Quentin', 'Clem'])).toBe(false)
  })

  it('refuse un nom vide', () => {
    expect(isPlayerNameAvailable('   ', [])).toBe(false)
  })

  it('accepte un nom libre', () => {
    expect(isPlayerNameAvailable('Julie', ['Quentin'])).toBe(true)
  })
})
