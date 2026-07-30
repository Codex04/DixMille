interface NumpadProps {
  value: string
  onChange: (value: string) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Longueur maximale : un tour ne dépasse jamais quelques milliers de points. */
const MAX_DIGITS = 7

/**
 * Pavé numérique, repris de l'app d'origine pour qui préfère taper le
 * total directement.
 *
 * La grille occupe la hauteur restante et se comprime sur les petits
 * écrans. Sa largeur est bornée et centrée : étalées sur toute la largeur,
 * les touches devenaient larges et plates, ce qui se lit mal.
 */
export default function Numpad({ value, onChange }: NumpadProps) {
  function append(digits: string) {
    const next = `${value}${digits}`.replace(/^0+(?=\d)/, '')
    if (next.length > MAX_DIGITS) return
    onChange(next)
  }

  const key = 'surface tabular min-h-12 text-3xl font-semibold'

  return (
    <div className="mx-auto grid h-full w-full max-w-xs grid-cols-3 grid-rows-4 gap-3">
      {KEYS.map((digit) => (
        <button key={digit} type="button" className={key} onClick={() => append(digit)}>
          {digit}
        </button>
      ))}

      <button
        type="button"
        className={key}
        onClick={() => append('00')}
        aria-label="Ajouter deux zéros"
      >
        00
      </button>

      <button type="button" className={key} onClick={() => append('0')}>
        0
      </button>

      <button
        type="button"
        className="surface min-h-12 text-2xl"
        onClick={() => onChange(value.slice(0, -1))}
        aria-label="Effacer le dernier chiffre"
      >
        ⌫
      </button>
    </div>
  )
}
