/**
 * Table de points du Dix-Mille.
 *
 * Les variantes changent beaucoup d'une famille à l'autre : tout est donc
 * paramétrable, et le `RuleSet` est figé dans la partie au moment de sa
 * création (changer la variante dans les réglages ne réécrit jamais
 * rétroactivement une partie déjà jouée).
 */

export interface ToggleableCombo {
  enabled: boolean
  points: number
}

export interface RuleSet {
  /** Score à atteindre pour gagner. */
  target: number
  /** Minimum à réaliser dans un tour pour pouvoir l'enregistrer. */
  minimumTurnScore: number
  /** Les scores saisis sont des multiples de ce pas. */
  scoreStep: number

  /** Un dé « 1 » isolé. */
  single1: number
  /** Un dé « 5 » isolé. */
  single5: number

  /** Brelan d'as, qui échappe à la règle générale des brelans. */
  tripleOf1: number
  /** Brelan de X (2→6) = X × ce multiplicateur. */
  tripleMultiplier: number

  /** Carré (4 identiques) = brelan × ce facteur. */
  quadFactor: number

  /** Cinq fois X (2→6) = X × ce multiplicateur. */
  quintMultiplier: number
  /** Cinq as, qui échappe à la règle générale. */
  quintOf1: number

  /** Six identiques : victoire immédiate. */
  sextetWins: boolean

  straight: ToggleableCombo
  threePairs: ToggleableCombo
}

/**
 * Valeurs confirmées : 1 = 100, 5 = 50, brelan d'as = 1000,
 * brelan de X = X00, cinq fois X = X000, minimum de 400 par tour.
 *
 * Les autres lignes n'ont jamais existé dans l'app d'origine et n'ont pas
 * été spécifiées : elles sont livrées avec un défaut raisonnable, et la
 * suite comme les trois paires sont désactivées par défaut puisque de
 * nombreuses variantes ne les comptent pas.
 */
export const DEFAULT_RULES: RuleSet = {
  target: 10_000,
  minimumTurnScore: 400,
  scoreStep: 10,

  single1: 100,
  single5: 50,

  tripleOf1: 1000,
  tripleMultiplier: 100,

  quadFactor: 2,

  quintMultiplier: 1000,
  quintOf1: 10_000,

  sextetWins: true,

  straight: { enabled: false, points: 1500 },
  threePairs: { enabled: false, points: 750 },
}

export type ComboGroup = 'single' | 'triple' | 'quad' | 'quint' | 'special'

export interface Combo {
  id: string
  label: string
  points: number
  /** Nombre de dés consommés par la combinaison. */
  diceUsed: number
  group: ComboGroup
}

const DIE_FACES = [1, 2, 3, 4, 5, 6] as const

/** Points d'un brelan pour une face donnée. */
export function tripleValue(face: number, rules: RuleSet): number {
  return face === 1 ? rules.tripleOf1 : face * rules.tripleMultiplier
}

/** Points d'un carré pour une face donnée. */
export function quadValue(face: number, rules: RuleSet): number {
  return tripleValue(face, rules) * rules.quadFactor
}

/** Points de cinq dés identiques pour une face donnée. */
export function quintValue(face: number, rules: RuleSet): number {
  return face === 1 ? rules.quintOf1 : face * rules.quintMultiplier
}

/**
 * Construit la liste des pastilles proposées par le sélecteur de
 * combinaisons, dans l'ordre d'affichage.
 */
export function buildCombos(rules: RuleSet): Combo[] {
  const combos: Combo[] = [
    { id: 'single-1', label: 'un 1', points: rules.single1, diceUsed: 1, group: 'single' },
    { id: 'single-5', label: 'un 5', points: rules.single5, diceUsed: 1, group: 'single' },
  ]

  for (const face of DIE_FACES) {
    combos.push({
      id: `triple-${face}`,
      label: `3 × ${face}`,
      points: tripleValue(face, rules),
      diceUsed: 3,
      group: 'triple',
    })
  }

  for (const face of DIE_FACES) {
    combos.push({
      id: `quad-${face}`,
      label: `4 × ${face}`,
      points: quadValue(face, rules),
      diceUsed: 4,
      group: 'quad',
    })
  }

  for (const face of DIE_FACES) {
    combos.push({
      id: `quint-${face}`,
      label: `5 × ${face}`,
      points: quintValue(face, rules),
      diceUsed: 5,
      group: 'quint',
    })
  }

  if (rules.straight.enabled) {
    combos.push({
      id: 'straight',
      label: 'suite 1-2-3-4-5-6',
      points: rules.straight.points,
      diceUsed: 6,
      group: 'special',
    })
  }

  if (rules.threePairs.enabled) {
    combos.push({
      id: 'three-pairs',
      label: 'trois paires',
      points: rules.threePairs.points,
      diceUsed: 6,
      group: 'special',
    })
  }

  return combos
}

/** Sélection du joueur dans le sélecteur : identifiant de combinaison → nombre de fois. */
export type ComboSelection = Record<string, number>

export interface SelectionTotal {
  points: number
  diceUsed: number
  entries: { combo: Combo; count: number; points: number }[]
}

/**
 * Additionne une sélection de combinaisons.
 *
 * `diceUsed` peut dépasser 6 : après un hot dice, le joueur relance les six
 * dés et cumule, donc le total de dés d'un tour n'est pas borné. C'est une
 * information affichée, pas une contrainte.
 */
export function evaluateSelection(selection: ComboSelection, rules: RuleSet): SelectionTotal {
  const byId = new Map(buildCombos(rules).map((combo) => [combo.id, combo]))
  const entries: SelectionTotal['entries'] = []
  let points = 0
  let diceUsed = 0

  for (const [comboId, count] of Object.entries(selection)) {
    const combo = byId.get(comboId)
    if (!combo || count <= 0) continue
    const subtotal = combo.points * count
    points += subtotal
    diceUsed += combo.diceUsed * count
    entries.push({ combo, count, points: subtotal })
  }

  return { points, diceUsed, entries }
}
