import type { Preset } from './preset'

export type PlayerId = string
export type GameId = string

export interface Player {
  id: PlayerId
  name: string
}

export interface Turn {
  id: string
  playerId: PlayerId
  /** Négatif autorisé : au Dix-Mille, une relance ratée fait perdre des points. */
  points: number
  /** ISO 8601. */
  at: string
  /** Tour de report créé par la migration depuis l'ancienne app. */
  imported?: boolean
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
  /**
   * Copie du preset au moment de la création. Modifier un preset dans les
   * réglages ne réécrit donc jamais une partie déjà jouée.
   */
  preset: Preset
}

export interface Settings {
  presets: Preset[]
  /** Preset proposé par défaut à la création d'une partie. */
  activePresetId: string
  theme: 'dark' | 'light'
}

export interface PersistedState {
  version: 2
  games: Game[]
  settings: Settings
}
