# Dix-Mille

Compteur de points pour le jeu du Dix-Mille, avec aide au calcul des combinaisons.
App statique, sans serveur : <https://codex04.github.io/DixMille/>

## ⚠️ À lire avant de toucher à l'hébergement

Les parties des utilisateurs sont stockées dans le `localStorage` du navigateur,
lié à l'**origine** `https://codex04.github.io` — pas au chemin.

- ✅ Redéployer sur le même compte GitHub Pages conserve les données, **même en
  renommant le dépôt** (le `/DixMille/` ne fait pas partie de l'origine).
- ❌ Basculer vers un domaine personnalisé, Netlify, Vercel ou Cloudflare Pages
  **détruit l'historique de tous les utilisateurs**, sans avertissement.

Si un domaine personnalisé devient nécessaire un jour : laisser les gens exporter
leurs parties depuis « Règles et réglages » → *Exporter*, puis basculer.

## Développement

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

Le premier `npm install` génère `package-lock.json` : il doit être committé,
la CI utilise `npm ci`.

## Déploiement

Le workflow `.github/workflows/deploy.yml` vérifie (typecheck, tests, build) à
chaque push sur `main`, mais **ne publie que sur déclenchement manuel**
(`workflow_dispatch`), le temps de valider la bascule.

Avant la première publication, régler la source de GitHub Pages sur
« GitHub Actions » dans les paramètres du dépôt : elle pointe encore sur la
branche `gh-pages` produite par l'ancienne version Blazor.

## Migration depuis la version Blazor

L'app lit au premier démarrage les clés `game-1`, `game-2`… écrites par
l'ancienne version, et les convertit dans son propre format.

Garanties :

- les clés `game-*` ne sont **jamais** supprimées ni écrasées ;
- une copie brute est prise dans `dixmille:v2:legacyBackup` avant toute écriture ;
- la migration est idempotente et se rejoue sans créer de doublon ;
- une entrée illisible est ignorée et signalée, sans empêcher le démarrage.

### Retour arrière

L'ancienne app reste déployable via le workflow `main.yml` (`workflow_dispatch`),
et la branche `gh-pages` est intacte. En revanche sa page Historique
désérialise **toutes** les clés du `localStorage` et lèverait une exception sur
les clés `dixmille:v2:*`. Un retour arrière suppose donc de les purger, dans la
console du navigateur :

```js
Object.keys(localStorage).filter(k => k.startsWith('dixmille:v2:')).forEach(k => localStorage.removeItem(k))
```

Le code Blazor est conservé dans `DixMille/` tant que la version React n'est pas
validée en production.

## Règles

Table de points par défaut, entièrement modifiable dans l'app :

| Combinaison | Points |
| --- | --- |
| Un `1` | 100 |
| Un `5` | 50 |
| Brelan de `1` | 1000 |
| Brelan de `X` | `X` × 100 |
| Carré | brelan × 2 |
| Cinq fois `X` | `X` × 1000 |
| Cinq `1` | 10000 |
| Suite 1-2-3-4-5-6 | 1500 (désactivée) |
| Trois paires | 750 (désactivée) |

Un tour doit rapporter **au moins 400 points** pour être enregistré ; en dessous,
il compte pour zéro. Après un *hot dice*, la relance peut faire perdre des
points : la saisie négative est prévue pour ça.
