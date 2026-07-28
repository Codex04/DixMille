import type { RuleSet } from './rules'

export type TurnStatus =
  /** Enregistrable tel quel. */
  | 'ok'
  /** Entre 1 et le minimum : le tour est enregistré à 0 point. */
  | 'below-minimum'
  /** Tour raté assumé, enregistré à 0. */
  | 'zero'
  /** Relance ratée après un hot dice : le joueur perd des points. */
  | 'negative'
  /** Pas un multiple du pas de score. */
  | 'invalid-step'

export interface TurnValidation {
  status: TurnStatus
  /** Points réellement enregistrés si le joueur valide. */
  effectivePoints: number
  canSubmit: boolean
  message: string
}

/**
 * Le minimum de 400 s'applique à *chaque* tour, pas seulement à l'entrée en
 * jeu : un total compris entre 1 et 399 ne rapporte rien.
 *
 * Le résultat reste soumettable dans ce cas, mais à 0 point — mieux vaut
 * l'annoncer explicitement que de griser un bouton sans explication.
 */
export function validateTurn(points: number, rules: RuleSet): TurnValidation {
  if (!Number.isInteger(points)) {
    return {
      status: 'invalid-step',
      effectivePoints: 0,
      canSubmit: false,
      message: 'Score invalide',
    }
  }

  if (points % rules.scoreStep !== 0) {
    return {
      status: 'invalid-step',
      effectivePoints: 0,
      canSubmit: false,
      message: `Le score doit être un multiple de ${rules.scoreStep}`,
    }
  }

  if (points < 0) {
    return {
      status: 'negative',
      effectivePoints: points,
      canSubmit: true,
      message: `Relance ratée : ${points} points`,
    }
  }

  if (points === 0) {
    return {
      status: 'zero',
      effectivePoints: 0,
      canSubmit: true,
      message: 'Tour sans point',
    }
  }

  if (points < rules.minimumTurnScore) {
    return {
      status: 'below-minimum',
      effectivePoints: 0,
      canSubmit: true,
      message: `Moins de ${rules.minimumTurnScore} points : le tour ne rapporte rien`,
    }
  }

  return {
    status: 'ok',
    effectivePoints: points,
    canSubmit: true,
    message: `+${points} points`,
  }
}

/** Un nom de joueur est valide s'il est non vide et pas déjà pris. */
export function isPlayerNameAvailable(name: string, existing: readonly string[]): boolean {
  const trimmed = name.trim()
  if (trimmed.length === 0) return false
  return !existing.some((other) => other.trim().toLowerCase() === trimmed.toLowerCase())
}
