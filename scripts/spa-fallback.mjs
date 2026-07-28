// GitHub Pages ne sait pas réécrire les URL inconnues vers index.html.
// Sans ce fichier, un rechargement sur /DixMille/historique renvoie un 404.
// Copier index.html en 404.html fait servir l'app à Pages pour toute route
// inconnue, ce qui préserve des URL propres (pas de routing en #).
import { copyFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

const dist = new URL('../dist/', import.meta.url)
const source = fileURLToPath(new URL('index.html', dist))
const target = fileURLToPath(new URL('404.html', dist))

await copyFile(source, target)
console.log('spa-fallback: dist/index.html -> dist/404.html')
