import { useState } from 'react'
import { MAX_AMOUNTS, type Preset } from '../domain/preset'

interface PresetEditorProps {
  preset: Preset
  /** Absent si c'est le dernier preset : il doit toujours en rester un. */
  onRemove?: (() => void) | undefined
  onChange: (patch: Partial<Preset>) => void
}

/** Édition d'un jeu : son nom, son objectif, ses montants de saisie rapide. */
export default function PresetEditor({ preset, onChange, onRemove }: PresetEditorProps) {
  const [draft, setDraft] = useState('')

  const parsed = Number(draft)
  const canAdd =
    draft.trim() !== '' &&
    Number.isFinite(parsed) &&
    Math.trunc(parsed) > 0 &&
    !preset.amounts.includes(Math.trunc(parsed)) &&
    preset.amounts.length < MAX_AMOUNTS

  function addAmount() {
    if (!canAdd) return
    onChange({ amounts: [...preset.amounts, Math.trunc(parsed)] })
    setDraft('')
  }

  return (
    <section className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg bg-felt-950/60 px-3 py-2 text-lg font-semibold outline-none"
          value={preset.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-label="Nom du jeu"
          placeholder="Nom du jeu"
        />
        {onRemove && (
          <button
            type="button"
            className="btn btn-ghost min-h-11! px-3!"
            onClick={onRemove}
            aria-label={`Supprimer ${preset.name}`}
          >
            ✕
          </button>
        )}
      </div>

      <label className="flex items-center gap-3">
        <span className="flex-1 text-sm">Objectif</span>
        <input
          type="number"
          inputMode="numeric"
          className="tabular w-28 rounded-lg bg-felt-950/60 px-2 py-1 text-right text-lg outline-none"
          value={preset.target}
          onChange={(event) => onChange({ target: Number(event.target.value) })}
        />
      </label>

      <div>
        <p className="mb-2 text-sm">
          Montants rapides
          <span className="ml-2 text-xs text-cream-dim">
            {preset.amounts.length} / {MAX_AMOUNTS}
          </span>
        </p>

        <ul className="mb-2 flex flex-wrap gap-2">
          {preset.amounts.map((amount) => (
            <li key={amount}>
              <button
                type="button"
                className="tabular flex min-h-11 items-center gap-2 rounded-lg border border-copper-500/40 bg-felt-950/50 px-3 text-base"
                onClick={() =>
                  onChange({ amounts: preset.amounts.filter((other) => other !== amount) })
                }
                aria-label={`Retirer ${amount}`}
              >
                {amount}
                <span aria-hidden="true" className="text-copper-400">
                  ✕
                </span>
              </button>
            </li>
          ))}
          {preset.amounts.length === 0 && (
            <li className="text-sm text-copper-400">
              Ajoute au moins un montant, sinon l’onglet Rapide sera vide.
            </li>
          )}
        </ul>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            addAmount()
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            className="tabular min-w-0 flex-1 rounded-lg bg-felt-950/60 px-3 py-2 outline-none"
            placeholder="Nouveau montant"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Nouveau montant"
          />
          <button type="submit" className="btn btn-ghost" disabled={!canAdd}>
            Ajouter
          </button>
        </form>
      </div>
    </section>
  )
}
