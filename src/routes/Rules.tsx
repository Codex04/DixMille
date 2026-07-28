import { useRef, useState } from 'react'
import Screen from '../components/Screen'
import { DEFAULT_RULES, type RuleSet } from '../domain/rules'
import { exportState, importState } from '../storage/repository'
import { useGameStore } from '../store/useGameStore'

/** Champs numériques éditables de la table de points. */
const NUMERIC_FIELDS: { key: keyof RuleSet; label: string; hint?: string }[] = [
  { key: 'target', label: 'Objectif de la partie' },
  { key: 'minimumTurnScore', label: 'Minimum par tour', hint: 'En dessous, le tour ne rapporte rien' },
  { key: 'single1', label: 'Un 1' },
  { key: 'single5', label: 'Un 5' },
  { key: 'tripleOf1', label: 'Brelan d’as' },
  { key: 'tripleMultiplier', label: 'Brelan de X', hint: 'Multiplié par la face : 3 × 4 = 400' },
  { key: 'quadFactor', label: 'Carré', hint: 'Multiplicateur appliqué au brelan' },
  { key: 'quintMultiplier', label: 'Cinq fois X', hint: 'Multiplié par la face : 5 × 4 = 4000' },
  { key: 'quintOf1', label: 'Cinq as' },
]

export default function Rules() {
  const settings = useGameStore((state) => state.settings)
  const games = useGameStore((state) => state.games)
  const migration = useGameStore((state) => state.migration)
  const updateRules = useGameStore((state) => state.updateRules)
  const applyImport = useGameStore((state) => state.applyImport)

  const fileInput = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const rules = settings.rules

  function setField(key: keyof RuleSet, value: number) {
    updateRules({ ...rules, [key]: value })
  }

  function download() {
    const json = exportState({ version: 2, games, settings })
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dixmille-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function upload(file: File) {
    const result = importState(await file.text())
    if (!result.ok) {
      setFeedback(result.error)
      return
    }
    const added = applyImport(result.state)
    setFeedback(
      added === 0
        ? 'Aucune nouvelle partie : elles étaient déjà présentes.'
        : `${added} partie${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}.`,
    )
  }

  return (
    <Screen title="Règles et réglages" back="/">
      <p className="mb-4 text-sm text-cream-dim">
        Ces valeurs s’appliquent aux <strong>nouvelles</strong> parties. Une partie en cours garde
        la variante avec laquelle elle a démarré.
      </p>

      <section className="mb-6 flex flex-col gap-2">
        {NUMERIC_FIELDS.map((field) => (
          <label key={field.key} className="surface flex items-center gap-3 px-4 py-2">
            <span className="flex-1">
              <span className="block">{field.label}</span>
              {field.hint && <span className="block text-xs text-cream-dim">{field.hint}</span>}
            </span>
            <input
              type="number"
              inputMode="numeric"
              className="tabular w-28 rounded-lg bg-felt-950/60 px-2 py-1 text-right text-lg outline-none"
              value={rules[field.key] as number}
              onChange={(event) => setField(field.key, Number(event.target.value))}
            />
          </label>
        ))}
      </section>

      <section className="mb-6 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
          Combinaisons optionnelles
        </h2>
        {(['straight', 'threePairs'] as const).map((key) => (
          <div key={key} className="surface flex items-center gap-3 px-4 py-2">
            <input
              id={key}
              type="checkbox"
              className="h-5 w-5 accent-[var(--color-copper-400)]"
              checked={rules[key].enabled}
              onChange={(event) =>
                updateRules({ ...rules, [key]: { ...rules[key], enabled: event.target.checked } })
              }
            />
            <label htmlFor={key} className="flex-1">
              {key === 'straight' ? 'Suite 1-2-3-4-5-6' : 'Trois paires'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="tabular w-24 rounded-lg bg-felt-950/60 px-2 py-1 text-right outline-none"
              value={rules[key].points}
              onChange={(event) =>
                updateRules({
                  ...rules,
                  [key]: { ...rules[key], points: Number(event.target.value) },
                })
              }
            />
          </div>
        ))}
      </section>

      <section className="mb-6 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
          Sauvegarde
        </h2>
        <p className="text-sm text-cream-dim">
          Les parties sont stockées dans ce navigateur uniquement. Exporte-les avant de changer
          d’appareil ou de vider ton historique de navigation.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={download}>
            Exporter
          </button>
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={() => fileInput.current?.click()}
          >
            Importer
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
        {feedback && <p className="text-sm text-copper-400">{feedback}</p>}
      </section>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => updateRules({ ...DEFAULT_RULES })}
      >
        Rétablir la table par défaut
      </button>

      {migration && (
        <p className="mt-6 text-xs text-cream-dim">
          Migration depuis l’ancienne version : {migration.importedGames} partie(s) importée(s)
          {migration.skipped.length > 0 && `, ${migration.skipped.length} entrée(s) illisible(s)`}.
          Les données d’origine sont conservées intactes dans le navigateur.
        </p>
      )}
    </Screen>
  )
}
