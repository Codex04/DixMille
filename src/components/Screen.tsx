import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

interface ScreenProps {
  title?: string
  /** Destination du bouton retour. Absent : pas de bouton. */
  back?: string
  action?: ReactNode
  /**
   * Barre d'action épinglée en bas, hors de la zone défilante. Ce qu'on y
   * met reste atteignable même si le contenu déborde.
   */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Gabarit commun : en-tête et pied fixes, contenu défilant entre les deux.
 *
 * La hauteur est bornée au plus petit viewport (`.app-shell`), donc en
 * pratique rien ne défile ; le débordement n'est qu'un filet de sécurité
 * pour les petits écrans ou les grandes tailles de police système.
 */
export default function Screen({ title, back, action, footer, children }: ScreenProps) {
  const navigate = useNavigate()

  return (
    <div className="app-shell relative z-10 mx-auto flex w-full max-w-lg flex-col">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
        {back !== undefined && (
          <button
            type="button"
            className="btn btn-ghost min-h-11! px-3!"
            onClick={() => navigate(back)}
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {title && <h1 className="title flex-1 truncate text-2xl font-semibold">{title}</h1>}
        {action}
      </header>

      {/* `min-h-0` est indispensable : sans lui un enfant flex refuse de
          rétrécir sous sa taille de contenu et déborde la coquille. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2">{children}</main>

      {footer && <div className="shrink-0 px-4 pb-3 pt-2">{footer}</div>}
    </div>
  )
}
