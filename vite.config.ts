/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// L'app est servie depuis https://codex04.github.io/DixMille/.
// Vite gère nativement ce sous-chemin : il n'y a plus de réécriture `sed`
// du <base href> dans la CI, contrairement à la version Blazor.
export default defineConfig({
  base: '/DixMille/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Dix-Mille',
        short_name: 'Dix-Mille',
        description: 'Compteur de points pour le jeu du Dix-Mille',
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
