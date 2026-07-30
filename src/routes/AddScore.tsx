import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Screen from '../components/Screen'
import Numpad from '../components/Numpad'
import QuickAmounts from '../components/QuickAmounts'
import { scoreOf } from '../domain/score'
import { validateTurn } from '../domain/validation'
import { useGameStore } from '../store/useGameStore'

type Mode = 'quick' | 'numpad'

export default function AddScore() {
  const { gameId, playerId } = useParams()
  const navigate = useNavigate()
  const game = useGameStore((state) => state.games.find((entry) => entry.id === gameId))
  const addTurn = useGameStore((state) => state.addTurn)

  const [mode, setMode] = useState<Mode>('quick')
  const [quickTotal, setQuickTotal] = useState(0)
  const [digits, setDigits] = useState('')
  const [negative, setNegative] = useState(false)

  const player = game?.players.find((entry) => entry.id === playerId)

  if (!game || !player) {
    return (
      <Screen title="Joueur introuvable" back="/">
        <p className="text-cream-dim">Ce joueur ne fait pas partie de cette partie.</p>
      </Screen>
    )
  }

  const magnitude = mode === 'quick' ? quickTotal : Number(digits || '0')
  const points = negative ? -magnitude : magnitude
  const validation = validateTurn(points, game.preset)
  const currentScore = scoreOf(game, player.id)

  function submit() {
    if (!game || !player || !validation.canSubmit) return
    addTurn(game.id, player.id, validation.effectivePoints)
    navigate(`/partie/${game.id}`)
  }

  function reset() {
    setQuickTotal(0)
    setDigits('')
    setNegative(false)
  }

  return (
    <Screen
      title={player.name}
      back={`/partie/${game.id}`}
      // Un seul bouton épinglé : à deux étages, le pied mangeait 132 px de
      // hauteur, au détriment du pavé numérique.
      footer={
        <button
          type="button"
          className="btn btn-primary w-full text-lg"
          disabled={!validation.canSubmit}
          onClick={submit}
        >
          {validation.status === 'below-minimum'
            ? 'Valider à 0 point'
            : `Valider ${validation.effectivePoints > 0 ? '+' : ''}${validation.effectivePoints}`}
        </button>
      }
    >
      <div className="surface mb-3 shrink-0 px-4 py-3">
        <p className="text-center text-xs text-cream-dim">
          Score actuel <span className="tabular">{currentScore.toLocaleString('fr-FR')}</span>
        </p>
        <p
          className={`tabular text-center text-4xl font-bold ${
            points < 0 ? 'text-die-red' : 'text-copper-400'
          }`}
        >
          {points > 0 ? '+' : ''}
          {points.toLocaleString('fr-FR')}
        </p>
        <p
          className={`text-center text-sm ${
            validation.status === 'below-minimum' || validation.status === 'invalid-step'
              ? 'text-copper-400'
              : 'text-cream-dim'
          }`}
        >
          {validation.message}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className={`btn min-h-11! flex-1 text-sm ${negative ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={negative}
            onClick={() => setNegative(!negative)}
            title="Le tour fait perdre des points"
          >
            − Négatif
          </button>
          <button
            type="button"
            className="btn btn-ghost min-h-11! flex-1 text-sm"
            onClick={reset}
          >
            Effacer
          </button>
        </div>
      </div>

      <div className="mb-3 flex shrink-0 gap-2" role="tablist">
        {(['quick', 'numpad'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={`btn flex-1 ${mode === value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode(value)}
          >
            {value === 'quick' ? 'Rapide' : 'Clavier'}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {mode === 'quick' ? (
          <QuickAmounts
            amounts={game.preset.amounts}
            // Mise à jour fonctionnelle : deux appuis rapprochés tombent dans
            // le même rendu, et une closure sur `quickTotal` en perdrait un.
            onAdd={(amount) => setQuickTotal((total) => total + amount)}
          />
        ) : (
          <Numpad value={digits} onChange={setDigits} />
        )}
      </div>

    </Screen>
  )
}
