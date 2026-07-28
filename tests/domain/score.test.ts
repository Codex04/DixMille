import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '../../src/domain/rules'
import { currentPlayer, detectWinner, progression, scoreOf, standings } from '../../src/domain/score'
import type { Game, Turn } from '../../src/domain/types'

function gameWith(turns: Array<[playerId: string, points: number]>): Game {
  return {
    id: 'g1',
    players: [
      { id: 'p1', name: 'Quentin' },
      { id: 'p2', name: 'Clem' },
      { id: 'p3', name: 'Julie' },
    ],
    turns: turns.map<Turn>(([playerId, points], index) => ({
      id: `t${index}`,
      playerId,
      points,
      at: new Date(2026, 0, 1, 0, index).toISOString(),
    })),
    currentPlayerIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    rules: DEFAULT_RULES,
  }
}

describe('score dérivé', () => {
  it('additionne les tours d’un joueur', () => {
    const game = gameWith([
      ['p1', 500],
      ['p2', 400],
      ['p1', 1000],
    ])

    expect(scoreOf(game, 'p1')).toBe(1500)
    expect(scoreOf(game, 'p2')).toBe(400)
    expect(scoreOf(game, 'p3')).toBe(0)
  })

  it('prend en compte les tours négatifs', () => {
    const game = gameWith([
      ['p1', 1000],
      ['p1', -450],
    ])

    expect(scoreOf(game, 'p1')).toBe(550)
  })
})

describe('classement', () => {
  it('trie du meilleur au moins bon et attribue les rangs', () => {
    const game = gameWith([
      ['p1', 500],
      ['p2', 1500],
      ['p3', 900],
    ])
    const result = standings(game)

    expect(result.map((entry) => entry.player.id)).toEqual(['p2', 'p3', 'p1'])
    expect(result.map((entry) => entry.rank)).toEqual([1, 2, 3])
  })

  it('donne le même rang aux ex æquo', () => {
    const game = gameWith([
      ['p1', 900],
      ['p2', 900],
      ['p3', 400],
    ])
    const result = standings(game)

    expect(result[0]?.rank).toBe(1)
    expect(result[1]?.rank).toBe(1)
    expect(result[2]?.rank).toBe(3)
  })

  it('ne couronne personne tant qu’aucun point n’a été marqué', () => {
    const game = gameWith([])

    expect(standings(game).every((entry) => !entry.isLeader)).toBe(true)
    expect(standings(game).every((entry) => !entry.isLast)).toBe(true)
  })

  it('n’affiche pas de dernier quand tout le monde est à égalité', () => {
    const game = gameWith([
      ['p1', 500],
      ['p2', 500],
      ['p3', 500],
    ])

    expect(standings(game).every((entry) => entry.isLeader)).toBe(true)
    expect(standings(game).every((entry) => !entry.isLast)).toBe(true)
  })
})

describe('détection du gagnant', () => {
  it('désigne le premier à franchir la cible, dans l’ordre des tours', () => {
    const game = gameWith([
      ['p1', 9800],
      ['p2', 9900],
      ['p2', 500],
      ['p1', 500],
    ])

    // p2 franchit 10000 avant p1, même si p1 avait pris l'avantage plus tôt.
    expect(detectWinner(game)).toBe('p2')
  })

  it('ne désigne personne tant que la cible n’est pas atteinte', () => {
    expect(detectWinner(gameWith([['p1', 9990]]))).toBeUndefined()
  })

  it('respecte le gagnant importé, qui n’est pas recalculable', () => {
    const game = { ...gameWith([['p1', 10_500]]), winnerPlayerId: 'p3' }

    expect(detectWinner(game)).toBe('p3')
  })
})

describe('tour de table', () => {
  it('désigne le joueur courant', () => {
    const game = { ...gameWith([]), currentPlayerIndex: 1 }

    expect(currentPlayer(game)?.name).toBe('Clem')
  })

  it('reboucle sur le premier joueur', () => {
    const game = { ...gameWith([]), currentPlayerIndex: 3 }

    expect(currentPlayer(game)?.name).toBe('Quentin')
  })
})

describe('progression', () => {
  it('produit une série cumulée partant de zéro', () => {
    const game = gameWith([
      ['p1', 500],
      ['p1', 400],
      ['p1', -100],
    ])
    const series = progression(game).find((entry) => entry.player.id === 'p1')

    expect(series?.points).toEqual([0, 500, 900, 800])
  })
})
