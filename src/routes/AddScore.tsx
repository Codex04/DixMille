import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Screen from '../components/Screen'
import ComboPicker from '../components/ComboPicker'
import Numpad from '../components/Numpad'
import { evaluateSelection, type ComboSelection } from '../domain/rules'
import { scoreOf } from '../domain/score'
import type { ComboEntry } from '../domain/types'
import { validateTurn } from '../domain/validation'
import { useGameStore } from '../store/useGameStore'

type Mode = 'combo' | 'numpad'

export default function AddScore() {
  const { gameId, playerId } = useParams()
  const navigate = useNavigate()
  const game = useGameStore((state) => state.games.find((entry) => entry.id === gameId))
  const addTurn = useGameStore((state) => state.addTurn)

  const [mode, setMode] = useState<Mode>('combo')
  const [selection, setSelection] = useState<ComboSelection>({})
  const [digits, setDigits] = useState('')
  const [negative, setNegative] = useState(false)

  const player = game?.players.find((entry) => entry.id === playerId)

  const total = useMemo(() => {
    if (!game) return { points: 0, diceUsed: 0, entries: [] }
    return evaluateSelection(selection, game.rules)
  }, [game, selection])

  if (!game || !player) {
    return (
      <Screen title="Joueur introuvable" back="/">
        <p className="text-cream-dim">Ce joueur ne fait pas partie de cette partie.</p>
      </Screen>
    )
  }

  const magnitude = mode === 'combo' ? total.points : Number(digits || '0')
  const points = negative ? -magnitude : magnitude
  const validation = validateTurn(points, game.rules)
  const currentScore = scoreOf(game, player.id)

  function submit() {
    if (!game || !player || !validation.canSubmit) return

    const breakdown: ComboEntry[] =
      mode === 'combo'
        ? total.entries.map((entry) => ({
            comboId: entry.combo.id,
            count: entry.count,
            points: entry.points,
          }))
        : []

    addTurn(game.id, player.id, validation.effectivePoints, breakdown)
    navigate(`/partie/${game.id}`)
  }

  function reset() {
    setSelection({})
    setDigits('')
    setNegative(false)
  }

  return (
    <Screen title={player.name} back={`/partie/${game.id}`}>
      <p className="-mt-2 mb-3 text-sm text-cream-dim">
        Score actuel : <span className="tabular">{currentScore.toLocaleString('fr-FR')}</span>
      </p>

      {/* Total du tour */}
      <div className="surface mb-3 px-4 py-5 text-center">
        <p
          className={`tabular text-5xl font-bold ${
            points < 0 ? 'text-die-red' : 'text-copper-400'
          }`}
        >
          {points > 0 ? '+' : ''}
          {points.toLocaleString('fr-FR')}
        </p>

        {mode === 'combo' && total.entries.length > 0 && (
          <p className="mt-2 text-sm text-cream-dim">
            {total.entries
              .map((entry) => `${entry.count > 1 ? `${entry.count} × ` : ''}${entry.combo.label}`)
              .join(' + ')}
            {total.diceUsed > 6 && ' — relances cumulées'}
          </p>
        )}

        <p
          className={`mt-2 text-sm ${
            validation.status === 'below-minimum' || validation.status === 'invalid-step'
              ? 'text-copper-400'
              : 'text-cream-dim'
          }`}
        >
          {validation.message}
        </p>
      </div>

      {/* Sélecteur de mode */}
      <div className="mb-3 flex gap-2" role="tablist">
        {(['combo', 'numpad'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={`btn flex-1 ${mode === value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode(value)}
          >
            {value === 'combo' ? 'Combinaisons' : 'Clavier'}
          </button>
        ))}
      </div>

      {mode === 'combo' ? (
        <ComboPicker rules={game.rules} selection={selection} onChange={setSelection} />
      ) : (
        <Numpad value={digits} onChange={setDigits} />
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`btn ${negative ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={negative}
          onClick={() => setNegative(!negative)}
          title="Relance ratée après un hot dice"
        >
          − Négatif
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Effacer
        </button>
      </div>

      <div className="mt-3">
        <button
          type="button"
          className="btn btn-primary w-full text-lg"
          disabled={!validation.canSubmit}
          onClick={submit}
        >
          {validation.status === 'below-minimum'
            ? `Valider à 0 point`
            : `Valider ${validation.effectivePoints > 0 ? '+' : ''}${validation.effectivePoints}`}
        </button>
      </div>
    </Screen>
  )
}
