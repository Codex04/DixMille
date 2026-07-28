interface NumpadProps {
  value: string
  onChange: (value: string) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Longueur maximale : un tour ne dépasse jamais quelques milliers de points. */
const MAX_DIGITS = 7

/**
 * Pavé numérique, repris de l'app d'origine pour qui préfère taper le
 * total directement plutôt que de passer par les combinaisons.
 */
export default function Numpad({ value, onChange }: NumpadProps) {
  function append(digits: string) {
    const next = `${value}${digits}`.replace(/^0+(?=\d)/, '')
    if (next.length > MAX_DIGITS) return
    onChange(next)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className="surface tabular py-4 text-2xl font-semibold"
          onClick={() => append(key)}
        >
          {key}
        </button>
      ))}

      <button
        type="button"
        className="surface tabular py-4 text-2xl font-semibold"
        onClick={() => append('00')}
        aria-label="Ajouter deux zéros"
      >
        00
      </button>

      <button
        type="button"
        className="surface tabular py-4 text-2xl font-semibold"
        onClick={() => append('0')}
      >
        0
      </button>

      <button
        type="button"
        className="surface py-4 text-xl"
        onClick={() => onChange(value.slice(0, -1))}
        aria-label="Effacer le dernier chiffre"
      >
        ⌫
      </button>
    </div>
  )
}
