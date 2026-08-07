import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface SwipeableRowProps {
  /** Vrai quand cette ligne est celle qui est ouverte. */
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivate: () => void
  onDelete: () => void
  /** Décrit la ligne pour les lecteurs d'écran, qui ne peuvent pas glisser. */
  deleteLabel: string
  children: ReactNode
}

/** Largeur du bouton révélé, en pixels. */
const ACTION_WIDTH = 104
/** Déplacement au-delà duquel on décide s'il s'agit d'un glissement ou d'un défilement. */
const DECISION_THRESHOLD = 8

/**
 * Ligne de liste que l'on fait glisser vers la gauche pour révéler une
 * suppression.
 *
 * Deux précautions pour ne pas casser les usages normaux :
 *  - la direction est arbitrée au premier mouvement, et un geste vertical
 *    rend la main au défilement de la page (`touch-action: pan-y`) ;
 *  - un glissement n'est jamais interprété comme un appui, sinon ouvrir une
 *    ligne déclencherait aussi sa navigation.
 *
 * Le bouton de suppression existe toujours dans le DOM : le glissement n'est
 * pas accessible au clavier ni aux lecteurs d'écran, qui atteignent ainsi
 * l'action directement.
 */
export default function SwipeableRow({
  open,
  onOpenChange,
  onActivate,
  onDelete,
  deleteLabel,
  children,
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const start = useRef({ x: 0, y: 0 })
  const active = useRef(false)
  const decided = useRef(false)
  // Distingue un glissement d'un appui au moment du clic.
  const moved = useRef(false)
  /**
   * Décalage courant, doublé dans une ref.
   *
   * Le relâchement doit décider d'après la dernière position réelle. Relire
   * l'état React ici exposerait à une closure périmée si le rendu n'a pas
   * encore eu lieu — la ligne resterait alors figée à mi-course.
   */
  const offsetRef = useRef(0)

  function moveTo(next: number) {
    offsetRef.current = next
    setOffset(next)
  }

  const translate = dragging ? offset : open ? -ACTION_WIDTH : 0

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Souris : n'intercepter que le bouton principal.
    if (event.pointerType === 'mouse' && event.button !== 0) return
    start.current = { x: event.clientX, y: event.clientY }
    active.current = true
    decided.current = false
    moved.current = false
    offsetRef.current = open ? -ACTION_WIDTH : 0
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!active.current) return

    const dx = event.clientX - start.current.x
    const dy = event.clientY - start.current.y

    if (!decided.current) {
      if (Math.abs(dx) < DECISION_THRESHOLD && Math.abs(dy) < DECISION_THRESHOLD) return
      // Geste plutôt vertical : c'est un défilement, on se retire.
      if (Math.abs(dy) >= Math.abs(dx)) {
        active.current = false
        return
      }
      decided.current = true
      moved.current = true
      setDragging(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Le pointeur peut déjà avoir été relâché : la capture est un
        // confort, son échec ne doit pas interrompre le geste.
      }
    }

    const base = open ? -ACTION_WIDTH : 0
    moveTo(Math.min(0, Math.max(-ACTION_WIDTH, base + dx)))
  }

  function handlePointerUp() {
    if (!active.current) return
    active.current = false

    if (!decided.current) return
    setDragging(false)
    onOpenChange(offsetRef.current < -ACTION_WIDTH / 2)
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)]">
      {/* Action révélée, sous la ligne. */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          className="btn btn-danger h-full rounded-none px-4"
          style={{ width: ACTION_WIDTH }}
          onClick={onDelete}
          aria-label={deleteLabel}
          tabIndex={open ? 0 : -1}
        >
          Supprimer
        </button>
      </div>

      <div
        style={{
          transform: `translateX(${translate}px)`,
          transition: dragging ? 'none' : 'transform 180ms ease',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button
          type="button"
          className="surface flex w-full items-center gap-3 px-4 py-3 text-left"
          onClick={() => {
            // Un glissement ne doit pas ouvrir la partie.
            if (moved.current) {
              moved.current = false
              return
            }
            // Ligne déjà ouverte : le premier appui la referme.
            if (open) {
              onOpenChange(false)
              return
            }
            onActivate()
          }}
        >
          {children}
        </button>
      </div>
    </div>
  )
}
