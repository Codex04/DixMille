import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

interface ScreenProps {
  title?: string
  /** Destination du bouton retour. Absent : pas de bouton. */
  back?: string
  action?: ReactNode
  children: ReactNode
}

/**
 * Gabarit commun : colonne centrée, largeur limitée pour rester lisible
 * aussi bien sur téléphone que sur un écran large.
 */
export default function Screen({ title, back, action, children }: ScreenProps) {
  const navigate = useNavigate()

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8">
      <header className="flex items-center gap-3 py-4">
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
        {title && <h1 className="title flex-1 text-2xl font-semibold">{title}</h1>}
        {action}
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
