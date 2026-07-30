import { MAX_AMOUNTS, normalizeAmounts, type Preset } from '../domain/preset'

/**
 * Partage des jeux par lien.
 *
 * Un fichier JSON est peu maniable sur téléphone : il faut le ranger quelque
 * part, puis le retrouver depuis l'autre appareil. Les presets étant
 * minuscules (quelques centaines d'octets), ils tiennent dans une URL, qui
 * s'envoie par message en deux gestes.
 *
 * ⚠️ Le contenu d'un lien est une **entrée non fiable** : n'importe qui peut
 * en fabriquer un. Tout est donc revalidé et borné à la lecture, et l'import
 * n'est jamais automatique — l'écran de réception demande confirmation.
 */

/** Clé du fragment d'URL. Le fragment n'est jamais envoyé au serveur. */
export const SHARE_HASH_KEY = 'jeux'

const MAX_NAME_LENGTH = 40
const MAX_PRESETS_PER_LINK = 20
const MAX_TARGET = 10_000_000

/** Forme compacte, pour garder l'URL courte. */
interface WirePreset {
  i: string
  n: string
  t: number
  a: number[]
  m: number
  s: number
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function encodePresets(presets: Preset[]): string {
  const wire: WirePreset[] = presets.slice(0, MAX_PRESETS_PER_LINK).map((preset) => ({
    i: preset.id,
    n: preset.name,
    t: preset.target,
    a: preset.amounts,
    m: preset.minimumTurnScore,
    s: preset.scoreStep,
  }))
  return toBase64Url(JSON.stringify(wire))
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

/** Relit un lien. Renvoie `null` si le contenu n'est pas exploitable. */
export function decodePresets(encoded: string): Preset[] | null {
  const json = fromBase64Url(encoded)
  if (json === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null

  const presets: Preset[] = []
  for (const entry of parsed.slice(0, MAX_PRESETS_PER_LINK)) {
    if (typeof entry !== 'object' || entry === null) continue
    const wire = entry as Partial<WirePreset>

    const name = typeof wire.n === 'string' ? wire.n.trim().slice(0, MAX_NAME_LENGTH) : ''
    const amounts = normalizeAmounts(Array.isArray(wire.a) ? wire.a : [])
    // Un preset sans nom ou sans montant serait inutilisable.
    if (name === '' || amounts.length === 0) continue

    const target = clamp(wire.t, 1, MAX_TARGET, 1000)
    presets.push({
      id: typeof wire.i === 'string' && wire.i.length > 0 ? wire.i.slice(0, 64) : name.toLowerCase(),
      name,
      target,
      amounts: amounts.slice(0, MAX_AMOUNTS),
      minimumTurnScore: clamp(wire.m, 0, target, 0),
      scoreStep: clamp(wire.s, 1, 1000, 1),
    })
  }

  return presets.length > 0 ? presets : null
}

/** URL complète à partager, le contenu logé dans le fragment. */
export function buildShareUrl(presets: Preset[], base: string): string {
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}importer#${SHARE_HASH_KEY}=${encodePresets(presets)}`
}

/** Extrait la charge utile d'un fragment d'URL (`#jeux=…`). */
export function readShareHash(hash: string): Preset[] | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  const payload = params.get(SHARE_HASH_KEY)
  return payload ? decodePresets(payload) : null
}
