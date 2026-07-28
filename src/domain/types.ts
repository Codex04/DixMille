import type { RuleSet } from './rules'

export type PlayerId = string
export type GameId = string

export interface Player {
  id: PlayerId
  name: string
}

/** Détail d'un tour saisi via le sélecteur de combinaisons. */
export interface ComboEntry {
  comboId: string
  count: number
  points: number
}

export interface Turn {
  id: string
  playerId: PlayerId
  /** Négatif autorisé : relance ratée après un hot dice. */
  points: number
  /** ISO 8601. */
  at: string
  /** Tour de report créé par la migration depuis l'ancienne app. */
  imported?: boolean
  breakdown?: ComboEntry[]
}

export interface Game {
  id: GameId
  /** Identifiant entier de l'app Blazor, conservé pour l'affichage. */
  legacyId?: number
  players: Player[]
  /**
   * Source de vérité unique : le score d'un joueur est la somme de ses
   * tours, jamais un champ stocké. C'est ce qui rend possibles
   * l'annulation, la courbe de progression et une migration sans cas
   * particulier.
   */
  turns: Turn[]
  currentPlayerIndex: number
  createdAt: string
  finishedAt?: string
  winnerPlayerId?: PlayerId
  /** Variante figée à la création de la partie. */
  rules: RuleSet
}

export interface Settings {
  /** Variante appliquée aux nouvelles parties. */
  rules: RuleSet
  theme: 'dark' | 'light'
}

export interface PersistedState {
  version: 2
  games: Game[]
  settings: Settings
}
