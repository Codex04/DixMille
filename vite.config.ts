/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sert le site depuis un sous-dossier portant le nom du dépôt.
// Ce nom est injecté par la CI (`VITE_BASE`) plutôt qu'écrit en dur : ainsi,
// renommer le dépôt ne demande aucune modification de code, il suffit de
// relancer un build. En local, la racine suffit.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ardoise',
        short_name: 'Ardoise',
        description: 'Compteur de points pour vos jeux de société',
        lang: 'fr',
        // Chemins relatifs au `base`, sinon le manifest pointe hors du sous-dossier.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B3D2E',
        theme_color: '#0B3D2E',
        // SVG uniquement : aucun PNG n'a pu être généré sans outillage
        // d'image. Chrome et Safari récents l'acceptent ; ajouter des PNG
        // 192 et 512 améliorerait la compatibilité des anciens Android.
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    // Doit rester aligné sur `compilerOptions.paths` de tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
