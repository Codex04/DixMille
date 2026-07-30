interface QuickAmountsProps {
  amounts: number[]
  onAdd: (amount: number) => void
}

/**
 * Ajout rapide : les montants définis par le preset. Chaque appui s'ajoute
 * au total du tour.
 *
 * Le nombre de montants étant configurable, la grille s'ajuste d'elle-même
 * plutôt que de fixer un nombre de colonnes : cinq montants tiennent sur une
 * ligne, douze se répartissent sur trois.
 */
export default function QuickAmounts({ amounts, onAdd }: QuickAmountsProps) {
  if (amounts.length === 0) {
    return (
      <p className="text-sm text-cream-dim">
        Aucun montant rapide pour ce jeu. Ajoutes-en dans les réglages, ou utilise le clavier.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          type="button"
          className="surface tabular py-5 text-lg font-semibold"
          onClick={() => onAdd(amount)}
          aria-label={`Ajouter ${amount} points`}
        >
          {amount}
        </button>
      ))}
    </div>
  )
}
