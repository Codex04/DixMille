import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Screen from '../components/Screen'
import type { Preset } from '../domain/preset'
import { readShareHash } from '../lib/shareLink'
import { useGameStore } from '../store/useGameStore'

/**
 * Réception d'un lien de partage.
 *
 * L'import n'est **jamais** automatique : le contenu vient d'une URL, donc
 * de n'importe qui. L'écran montre ce qui sera ajouté et attend une
 * confirmation explicite.
 */
export default function ImportLink() {
  const navigate = useNavigate()
  const settings = useGameStore((state) => state.settings)
  const importPresets = useGameStore((state) => state.importPresets)

  // Lu une seule fois : importer nettoie le fragment, ce qui relancerait la
  // lecture et ferait disparaître le récapitulatif.
  const received = useMemo<Preset[] | null>(() => readShareHash(window.location.hash), [])
  const [added, setAdded] = useState<number | null>(null)

  if (!received) {
    return (
      <Screen title="Lien invalide" back="/">
        <p className="text-cream-dim">
          Ce lien ne contient aucun jeu exploitable. Il a peut-être été tronqué à l’envoi :
          demande à ce qu’il te soit renvoyé en entier.
        </p>
      </Screen>
    )
  }

  const known = new Set(settings.presets.map((preset) => preset.id))
  const nouveaux = received.filter((preset) => !known.has(preset.id))

  if (added !== null) {
    return (
      <Screen title="Jeux importés" back="/">
        <p className="mb-4">
          {added === 0
            ? 'Tu avais déjà ces jeux : rien n’a été modifié.'
            : `${added} jeu${added > 1 ? 'x' : ''} ajouté${added > 1 ? 's' : ''}.`}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
          Retour à l’accueil
        </button>
      </Screen>
    )
  }

  return (
    <Screen
      title="Jeux partagés"
      back="/"
      footer={
        <button
          type="button"
          className="btn btn-primary w-full text-lg"
          onClick={() => {
            setAdded(importPresets(received))
            // Le fragment est retiré pour qu'un rechargement ne repropose
            // pas l'import.
            window.history.replaceState(null, '', window.location.pathname)
          }}
        >
          {nouveaux.length > 0
            ? `Ajouter ${nouveaux.length} jeu${nouveaux.length > 1 ? 'x' : ''}`
            : 'Tout est déjà présent'}
        </button>
      }
    >
      <p className="mb-4 text-sm text-cream-dim">
        Quelqu’un t’a partagé {received.length > 1 ? 'ces jeux' : 'ce jeu'}. Rien n’est ajouté
        tant que tu ne confirmes pas, et tes jeux existants ne seront pas modifiés.
      </p>

      <ul className="flex flex-col gap-2">
        {received.map((preset) => {
          const dejaConnu = known.has(preset.id)
          return (
            <li key={preset.id} className="surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">{preset.name}</span>
                {dejaConnu && <span className="text-xs text-cream-dim">déjà présent</span>}
              </div>
              <p className="tabular mt-1 text-sm text-cream-dim">
                Objectif {preset.target.toLocaleString('fr-FR')}
              </p>
              <p className="tabular mt-1 text-sm">{preset.amounts.join(' · ')}</p>
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}
