import { describe, expect, it } from 'vitest'
import { createPreset, DIX_MILLE_PRESET } from '../../src/domain/preset'
import { buildShareUrl, decodePresets, encodePresets, readShareHash } from '../../src/lib/shareLink'

describe('aller-retour par lien', () => {
  it('restitue les jeux à l’identique', () => {
    const tarot = { ...createPreset('tarot', 'Tarot'), target: 500, amounts: [10, 20, 50] }
    const decoded = decodePresets(encodePresets([DIX_MILLE_PRESET, tarot]))

    expect(decoded).toEqual([DIX_MILLE_PRESET, tarot])
  })

  it('survit aux accents et aux caractères non latins', () => {
    const preset = { ...createPreset('p', 'Belote — Coinchée 🃏'), amounts: [10] }
    expect(decodePresets(encodePresets([preset]))?.[0]?.name).toBe('Belote — Coinchée 🃏')
  })

  it('produit une URL courte pour un jeu', () => {
    // Une URL trop longue serait tronquée par certaines messageries.
    const url = buildShareUrl([DIX_MILLE_PRESET], 'https://codex04.github.io/DixMille/')
    expect(url.length).toBeLessThan(300)
    expect(url).toContain('/importer#jeux=')
  })

  it('se relit depuis le fragment d’URL', () => {
    const url = buildShareUrl([DIX_MILLE_PRESET], 'https://exemple.fr/app')
    const hash = url.slice(url.indexOf('#'))

    expect(readShareHash(hash)?.[0]?.name).toBe('Dix-Mille')
  })

  it('ajoute la barre finale manquante à la base', () => {
    expect(buildShareUrl([DIX_MILLE_PRESET], 'https://exemple.fr/app')).toContain(
      'https://exemple.fr/app/importer#',
    )
  })
})

describe('robustesse face à un lien fabriqué', () => {
  it('rejette une charge utile qui n’est pas du base64', () => {
    expect(decodePresets('pas du base64 !!')).toBeNull()
  })

  it('rejette du base64 qui ne contient pas de JSON', () => {
    expect(decodePresets(btoa('bonjour'))).toBeNull()
  })

  it('rejette un JSON qui n’est pas un tableau', () => {
    expect(decodePresets(btoa('{"a":1}'))).toBeNull()
  })

  it('écarte un jeu sans nom ou sans montant', () => {
    const wire = [
      { i: 'a', n: '', t: 100, a: [10], m: 0, s: 1 },
      { i: 'b', n: 'Vide', t: 100, a: [], m: 0, s: 1 },
      { i: 'c', n: 'Bon', t: 100, a: [10], m: 0, s: 1 },
    ]
    const decoded = decodePresets(btoa(JSON.stringify(wire)))

    expect(decoded).toHaveLength(1)
    expect(decoded?.[0]?.name).toBe('Bon')
  })

  it('borne un objectif aberrant', () => {
    const wire = [{ i: 'a', n: 'Triche', t: 1e12, a: [10], m: 0, s: 1 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.target).toBe(10_000_000)
  })

  it('borne un objectif négatif ou absent', () => {
    const wire = [{ i: 'a', n: 'Zero', t: -5, a: [10], m: 0, s: 1 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.target).toBe(1)
  })

  it('tronque un nom démesuré', () => {
    const wire = [{ i: 'a', n: 'x'.repeat(500), t: 100, a: [10], m: 0, s: 1 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.name).toHaveLength(40)
  })

  it('plafonne le nombre de montants', () => {
    const wire = [{ i: 'a', n: 'Trop', t: 100, a: Array.from({ length: 50 }, (_, i) => i + 1), m: 0, s: 1 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.amounts.length).toBeLessThanOrEqual(12)
  })

  it('ramène un pas de score nul à 1, pour ne pas diviser par zéro', () => {
    const wire = [{ i: 'a', n: 'Pas', t: 100, a: [10], m: 0, s: 0 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.scoreStep).toBe(1)
  })

  it('empêche un minimum par tour supérieur à l’objectif', () => {
    const wire = [{ i: 'a', n: 'Bloque', t: 100, a: [10], m: 99_999, s: 1 }]
    expect(decodePresets(btoa(JSON.stringify(wire)))?.[0]?.minimumTurnScore).toBe(100)
  })

  it('renvoie null si aucun jeu n’est exploitable', () => {
    expect(decodePresets(btoa(JSON.stringify([{ n: '' }])))).toBeNull()
  })
})
