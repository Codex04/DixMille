import type { Game, Player, PlayerId } from './types'

/** Score d'un joueur : somme de ses tours. */
export function scoreOf(game: Game, playerId: PlayerId): number {
  let total = 0
  for (const turn of game.turns) {
    if (turn.playerId === playerId) total += turn.points
  }
  return total
}

/** Score de chaque joueur, en un seul passage sur les tours. */
export function scoresOf(game: Game): Map<PlayerId, number> {
  const totals = new Map<PlayerId, number>()
  for (const player of game.players) totals.set(player.id, 0)
  for (const turn of game.turns) {
    totals.set(turn.playerId, (totals.get(turn.playerId) ?? 0) + turn.points)
  }
  return totals
}

export interface Standing {
  player: Player
  score: number
  /** Rang à partir de 1, les ex æquo partagent le même rang. */
  rank: number
  isLeader: boolean
  isLast: boolean
}

/**
 * Classement, du meilleur au moins bon.
 *
 * `isLeader` / `isLast` ne sont vrais que si au moins un point a été marqué
 * dans la partie : en début de partie tout le monde est à zéro, et couronner
 * un leader à ce moment-là n'a aucun sens.
 */
export function standings(game: Game): Standing[] {
  const totals = scoresOf(game)
  const sorted = [...game.players].sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0))

  const values = sorted.map((player) => totals.get(player.id) ?? 0)
  const best = values.length > 0 ? Math.max(...values) : 0
  const worst = values.length > 0 ? Math.min(...values) : 0
  const hasProgress = values.some((value) => value !== 0)

  let rank = 0
  let previous: number | null = null

  return sorted.map((player, index) => {
    const score = totals.get(player.id) ?? 0
    if (previous === null || score !== previous) {
      rank = index + 1
      previous = score
    }
    return {
      player,
      score,
      rank,
      isLeader: hasProgress && score === best,
      // Un joueur seul en tête ne peut pas être aussi dernier.
      isLast: hasProgress && score === worst && best !== worst,
    }
  })
}

/**
 * Premier joueur à avoir franchi la cible, en rejouant les tours dans
 * l'ordre. `game.winnerPlayerId` reste prioritaire lorsqu'il est renseigné :
 * les parties importées depuis l'ancienne app portent un gagnant qui ne peut
 * pas être recalculé, faute d'historique des coups.
 */
export function detectWinner(game: Game): PlayerId | undefined {
  if (game.winnerPlayerId) return game.winnerPlayerId

  const totals = new Map<PlayerId, number>()
  for (const turn of game.turns) {
    const next = (totals.get(turn.playerId) ?? 0) + turn.points
    totals.set(turn.playerId, next)
    if (next >= game.rules.target) return turn.playerId
  }
  return undefined
}

export function isFinished(game: Game): boolean {
  return detectWinner(game) !== undefined
}

export function currentPlayer(game: Game): Player | undefined {
  if (game.players.length === 0) return undefined
  const index = game.currentPlayerIndex % game.players.length
  return game.players[index]
}

export function nextPlayerIndex(game: Game): number {
  if (game.players.length === 0) return 0
  return (game.currentPlayerIndex + 1) % game.players.length
}

/** Tours d'un joueur, dans l'ordre chronologique. */
export function turnsOf(game: Game, playerId: PlayerId): Game['turns'] {
  return game.turns.filter((turn) => turn.playerId === playerId)
}

/**
 * Progression cumulée par joueur, pour la courbe du détail de partie.
 * Chaque série démarre à zéro afin que le graphe parte de l'origine.
 */
export function progression(game: Game): { player: Player; points: number[] }[] {
  const running = new Map<PlayerId, number>()
  const series = new Map<PlayerId, number[]>()
  for (const player of game.players) {
    running.set(player.id, 0)
    series.set(player.id, [0])
  }

  for (const turn of game.turns) {
    const next = (running.get(turn.playerId) ?? 0) + turn.points
    running.set(turn.playerId, next)
    series.get(turn.playerId)?.push(next)
  }

  return game.players.map((player) => ({
    player,
    points: series.get(player.id) ?? [0],
  }))
}
