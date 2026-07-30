import { useRef, useState } from 'react'
import PresetEditor from '../components/PresetEditor'
import Screen from '../components/Screen'
import { buildShareUrl } from '../lib/shareLink'
import { exportState, importState } from '../storage/repository'
import { useGameStore } from '../store/useGameStore'

/** L'utilisateur a fermé la feuille de partage : ce n'est pas une erreur. */
function estAnnulation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export default function Settings() {
  const settings = useGameStore((state) => state.settings)
  const games = useGameStore((state) => state.games)
  const addPreset = useGameStore((state) => state.addPreset)
  const updatePreset = useGameStore((state) => state.updatePreset)
  const removePreset = useGameStore((state) => state.removePreset)
  const applyImport = useGameStore((state) => state.applyImport)

  const clearGames = useGameStore((state) => state.clearGames)

  const fileInput = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  /**
   * Partage des jeux par lien : quelques centaines d'octets tiennent dans
   * une URL, qui s'envoie par message. Bien plus maniable qu'un fichier sur
   * téléphone.
   */
  async function sharePresets() {
    const url = buildShareUrl(settings.presets, `${window.location.origin}${import.meta.env.BASE_URL}`)

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Mes jeux Ardoise', url })
        return
      } catch (error) {
        if (estAnnulation(error)) return
        // Partage indisponible malgré tout : on retombe sur la copie.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setFeedback('Lien copié. Colle-le dans un message.')
    } catch {
      setFeedback(url)
    }
  }

  /**
   * Sauvegarde complète. L'historique est trop volumineux pour une URL,
   * donc un fichier — mais passé à la feuille de partage native quand elle
   * existe, plutôt qu'en téléchargement.
   */
  async function backup() {
    const json = exportState({ version: 2, games, settings })
    const nom = `ardoise-${new Date().toISOString().slice(0, 10)}.json`
    const file = new File([json], nom, { type: 'application/json' })

    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Sauvegarde Ardoise' })
        return
      } catch (error) {
        if (estAnnulation(error)) return
      }
    }

    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = nom
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
    const parts: string[] = []
    if (added.games > 0) {
      parts.push(`${added.games} partie${added.games > 1 ? 's' : ''}`)
    }
    if (added.presets > 0) {
      parts.push(`${added.presets} jeu${added.presets > 1 ? 'x' : ''}`)
    }

    setFeedback(
      parts.length === 0
        ? 'Rien de nouveau : tout était déjà présent.'
        : `${parts.join(' et ')} importé${added.games + added.presets > 1 ? 's' : ''}.`,
    )
  }

  return (
    <Screen title="Réglages" back="/">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream-dim">
        Jeux
      </h2>
      <p className="mb-3 text-sm text-cream-dim">
        Chaque jeu définit son objectif et ses montants de saisie rapide. Les modifications ne
        s’appliquent qu’aux nouvelles parties.
      </p>

      <div className="flex flex-col gap-3">
        {settings.presets.map((preset) => (
          <PresetEditor
            key={preset.id}
            preset={preset}
            onChange={(patch) => updatePreset(preset.id, patch)}
            onRemove={settings.presets.length > 1 ? () => removePreset(preset.id) : undefined}
          />
        ))}
      </div>

      <button type="button" className="btn btn-ghost mt-3" onClick={() => addPreset()}>
        + Nouveau jeu
      </button>

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
          Partage
        </h2>
        <p className="text-sm text-cream-dim">
          Envoie tes jeux par message : la personne ouvre le lien et les retrouve chez elle.
          L’historique des parties n’est pas inclus.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => void sharePresets()}>
          Partager mes jeux
        </button>
      </section>

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
          Sauvegarde complète
        </h2>
        <p className="text-sm text-cream-dim">
          Parties et jeux, dans un fichier. Les données ne vivent que dans ce navigateur :
          sauvegarde avant de changer d’appareil ou de vider ton historique de navigation.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={() => void backup()}>
            Sauvegarder
          </button>
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={() => fileInput.current?.click()}
          >
            Restaurer
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

      <section className="mb-4 mt-8 flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
          Zone de danger
        </h2>

        {!confirmClear ? (
          <>
            <p className="text-sm text-cream-dim">
              Efface toutes les parties. Les jeux et leurs réglages sont conservés.
              Pense à sauvegarder avant.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={games.length === 0}
              onClick={() => setConfirmClear(true)}
            >
              {games.length === 0
                ? 'Aucune partie à effacer'
                : `Effacer l’historique (${games.length})`}
            </button>
          </>
        ) : (
          <div className="surface border-die-red p-4">
            <p className="mb-1 font-semibold">
              Effacer {games.length} partie{games.length > 1 ? 's' : ''} ?
            </p>
            {/* Annoncer précisément ce qui disparaît et ce qui reste : c'est
                ce qui distingue une confirmation utile d'un réflexe. */}
            <p className="mb-4 text-sm text-cream-dim">
              L’historique et le palmarès seront vidés définitivement. Tes jeux sont conservés.
              Cette action est irréversible — seule une sauvegarde permet de revenir en arrière.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => setConfirmClear(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger flex-1"
                onClick={() => {
                  const removed = clearGames()
                  setConfirmClear(false)
                  setFeedback(
                    `${removed} partie${removed > 1 ? 's' : ''} effacée${removed > 1 ? 's' : ''}.`,
                  )
                }}
              >
                Effacer
              </button>
            </div>
          </div>
        )}
      </section>
    </Screen>
  )
}
