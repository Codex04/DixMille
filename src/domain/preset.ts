/**
 * Un preset décrit un jeu : son nom, le score à atteindre, et les montants
 * proposés en saisie rapide.
 *
 * C'est ce qui rend l'app générique. Le Dix-Mille n'est plus qu'un preset
 * parmi d'autres, fourni par défaut.
 */
export interface Preset {
  id: string
  name: string
  /** Score à atteindre pour gagner. */
  target: number
  /** Montants d'ajout rapide, triés croissants. */
  amounts: number[]
  /**
   * Minimum à réaliser dans un tour pour pouvoir l'enregistrer.
   * `0` = aucun minimum. Propre au Dix-Mille, d'où le défaut à 0 pour tout
   * nouveau preset : imposer 400 points à une partie de tarot n'aurait
   * aucun sens.
   */
  minimumTurnScore: number
  /** Les scores saisis sont des multiples de ce pas. `1` = aucune contrainte. */
  scoreStep: number
}

/** Nombre maximal de montants, au-delà duquel la grille devient illisible. */
export const MAX_AMOUNTS = 12

/**
 * Preset fourni d'origine.
 *
 * Valeurs confirmées du Dix-Mille : 1 = 100, 5 = 50, brelan de 4 = 400,
 * brelan de 5 = 500, brelan d'as = 1000 — ce sont exactement les boutons de
 * la toute première version de l'app. Minimum de 400 points par tour, scores
 * multiples de 10.
 */
export const DIX_MILLE_PRESET: Preset = {
  id: 'dix-mille',
  name: 'Dix-Mille',
  target: 10_000,
  amounts: [50, 100, 400, 500, 1000],
  minimumTurnScore: 400,
  scoreStep: 10,
}

/**
 * Met de l'ordre dans une liste de montants : entiers strictement positifs,
 * sans doublon, triés, et plafonnés.
 */
export function normalizeAmounts(amounts: number[]): number[] {
  const cleaned = amounts
    .map((amount) => Math.trunc(amount))
    .filter((amount) => Number.isFinite(amount) && amount > 0)

  return [...new Set(cleaned)].sort((a, b) => a - b).slice(0, MAX_AMOUNTS)
}

/** Nouveau preset vierge, sans contrainte de tour ni de pas. */
export function createPreset(id: string, name = 'Nouveau jeu'): Preset {
  return {
    id,
    name,
    target: 1000,
    amounts: [10, 50, 100],
    minimumTurnScore: 0,
    scoreStep: 1,
  }
}
