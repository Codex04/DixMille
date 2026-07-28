import { buildCombos, type ComboGroup, type ComboSelection, type RuleSet } from '../domain/rules'

interface ComboPickerProps {
  rules: RuleSet
  selection: ComboSelection
  onChange: (selection: ComboSelection) => void
}

const GROUP_LABELS: Record<ComboGroup, string> = {
  single: 'Dés isolés',
  triple: 'Brelans',
  quad: 'Carrés',
  quint: 'Cinq identiques',
  special: 'Spéciales',
}

const GROUP_ORDER: ComboGroup[] = ['single', 'triple', 'quad', 'quint', 'special']

/**
 * Sélecteur de combinaisons : un appui ajoute, un appui long retire.
 * Le joueur n'a plus à faire l'addition de tête, ce qui était toute la
 * charge mentale de l'ancienne version.
 */
export default function ComboPicker({ rules, selection, onChange }: ComboPickerProps) {
  const combos = buildCombos(rules)

  function bump(comboId: string, delta: number) {
    const next = { ...selection }
    const count = (next[comboId] ?? 0) + delta
    if (count <= 0) delete next[comboId]
    else next[comboId] = count
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {GROUP_ORDER.map((group) => {
        const items = combos.filter((combo) => combo.group === group)
        if (items.length === 0) return null

        return (
          <section key={group}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-dim">
              {GROUP_LABELS[group]}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {items.map((combo) => {
                const count = selection[combo.id] ?? 0
                return (
                  <button
                    key={combo.id}
                    type="button"
                    className={`surface relative flex flex-col items-center gap-0.5 px-2 py-3 transition ${
                      count > 0 ? 'border-copper-400 ring-2 ring-copper-400/40' : ''
                    }`}
                    onClick={() => bump(combo.id, 1)}
                    onContextMenu={(event) => {
                      // Appui long sur mobile, clic droit sur ordinateur.
                      event.preventDefault()
                      bump(combo.id, -1)
                    }}
                    aria-label={`${combo.label}, ${combo.points} points${
                      count > 0 ? `, sélectionné ${count} fois` : ''
                    }`}
                  >
                    {count > 0 && (
                      <span className="tabular absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-copper-400 text-sm font-bold text-felt-950">
                        {count}
                      </span>
                    )}
                    <span className="text-base font-semibold">{combo.label}</span>
                    <span className="tabular text-sm text-cream-dim">{combo.points}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="text-xs text-cream-dim">
        Appui long sur une pastille pour retirer une occurrence.
      </p>
    </div>
  )
}
