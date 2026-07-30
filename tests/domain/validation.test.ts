import { describe, expect, it } from 'vitest'
import { DIX_MILLE_PRESET } from '../../src/domain/preset'
import { isPlayerNameAvailable, validateTurn } from '../../src/domain/validation'

describe('minimum de 400 points par tour', () => {
  it('accepte un tour à exactement 400', () => {
    const result = validateTurn(400, DIX_MILLE_PRESET)

    expect(result.status).toBe('ok')
    expect(result.effectivePoints).toBe(400)
    expect(result.canSubmit).toBe(true)
  })

  it('n’accorde rien entre 1 et 399, tout en restant soumettable', () => {
    const result = validateTurn(390, DIX_MILLE_PRESET)

    expect(result.status).toBe('below-minimum')
    expect(result.effectivePoints).toBe(0)
    // Le tour doit pouvoir être validé : c'est un tour réellement joué,
    // simplement il ne rapporte rien.
    expect(result.canSubmit).toBe(true)
  })

  it('accepte un tour sans point', () => {
    const result = validateTurn(0, DIX_MILLE_PRESET)

    expect(result.status).toBe('zero')
    expect(result.effectivePoints).toBe(0)
  })

  it('applique le seuil à chaque tour, pas seulement au premier', () => {
    // Le seuil ne dépend d'aucun état de joueur : c'est une validation de
    // saisie, appliquée identiquement à tous les tours.
    expect(validateTurn(350, DIX_MILLE_PRESET).effectivePoints).toBe(0)
    expect(validateTurn(350, DIX_MILLE_PRESET).status).toBe('below-minimum')
  })
})

describe('relance ratée après un hot dice', () => {
  it('autorise un score négatif', () => {
    const result = validateTurn(-1000, DIX_MILLE_PRESET)

    expect(result.status).toBe('negative')
    expect(result.effectivePoints).toBe(-1000)
    expect(result.canSubmit).toBe(true)
  })

  it('n’applique pas le minimum de 400 aux négatifs', () => {
    expect(validateTurn(-50, DIX_MILLE_PRESET).effectivePoints).toBe(-50)
  })
})

describe('pas de score', () => {
  it('refuse un score qui n’est pas un multiple de 10', () => {
    const result = validateTurn(455, DIX_MILLE_PRESET)

    expect(result.status).toBe('invalid-step')
    expect(result.canSubmit).toBe(false)
  })

  it('refuse un score non entier', () => {
    expect(validateTurn(400.5, DIX_MILLE_PRESET).canSubmit).toBe(false)
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
