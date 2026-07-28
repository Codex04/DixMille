import legacyFixture from '../fixtures/legacy.json'

/** Implémentation de `Storage` en mémoire, indépendante de jsdom. */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  /** Simule un quota atteint, pour vérifier que rien n'est perdu. */
  failOnWrite = false

  get length(): number {
    return this.data.size
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.failOnWrite) {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    }
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  /** Instantané brut, pour vérifier que les clés legacy sont intactes. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.data)
  }
}

/** Stockage pré-rempli avec les données de l'app Blazor. */
export function storageWithLegacyData(): MemoryStorage {
  const storage = new MemoryStorage()
  for (const [key, value] of Object.entries(legacyFixture)) {
    if (key.startsWith('_')) continue
    storage.setItem(key, value as string)
  }
  return storage
}

/** Générateurs déterministes, pour des assertions stables. */
export function deterministicDeps(start = 0) {
  let counter = start
  return {
    createId: () => `id-${(counter += 1)}`,
    now: () => new Date('2026-07-28T12:00:00.000Z'),
  }
}
