# Ardoise

Compteur de points pour vos jeux de société. App statique, sans serveur.

Chaque jeu est décrit par un **preset** : un nom, un objectif de score, et une
liste de montants proposés en saisie rapide. Le Dix-Mille est fourni d'origine
comme preset par défaut ; les autres se créent depuis les réglages, et se
partagent par lien.

## ⚠️ À lire avant de toucher à l'hébergement

Les parties des utilisateurs sont stockées dans le `localStorage` du navigateur,
lié à l'**origine** `https://codex04.github.io` — pas au chemin.

- ✅ Renommer le dépôt ne perd **aucune** donnée : le chemin `/<dépôt>/` ne fait
  pas partie de l'origine. Il faut simplement relancer le workflow après le
  renommage, pour que le site soit rebâti avec le bon chemin de base.
- ❌ Basculer vers un domaine personnalisé, Netlify, Vercel ou Cloudflare Pages
  **détruit l'historique de tous les utilisateurs**, sans avertissement.

Si un domaine personnalisé devient nécessaire un jour : laisser les gens
sauvegarder depuis « Réglages » → *Sauvegarder*, puis basculer.

### Les clés de stockage gardent l'ancien nom

Le `localStorage` utilise le préfixe `dixmille:v2:`, hérité du nom d'origine de
l'app. C'est de la **donnée**, pas de la marque : renommer ces clés rendrait
invisible l'historique de tous les utilisateurs existants. Elles restent donc
telles quelles.

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

En local le site est servi à la racine. En production, le chemin de base est
injecté par la CI via `VITE_BASE`, à partir du nom du dépôt — il n'est écrit
en dur nulle part.

## Déploiement

`.github/workflows/deploy.yml` vérifie (typecheck, tests, build) puis publie
**à chaque push sur `main`**. Les pull requests sont vérifiées mais jamais
publiées.

Prérequis, une seule fois : dans *Settings → Pages* du dépôt, régler la source
sur **GitHub Actions** (et non « Deploy from a branch »). Sans ça, le job de
déploiement échoue.

## Migration depuis l'ancienne version Blazor

L'app lit au premier démarrage les clés `game-1`, `game-2`… écrites par
l'ancienne version, et les convertit dans son propre format. Les parties
importées reçoivent le preset Dix-Mille.

Garanties :

- les clés `game-*` ne sont **jamais** supprimées ni écrasées ;
- une copie brute est prise dans `dixmille:v2:legacyBackup` avant toute écriture ;
- la migration est idempotente et se rejoue sans créer de doublon ;
- une entrée illisible est ignorée et signalée, sans empêcher le démarrage.

Le code Blazor a été supprimé du dépôt ; il reste accessible dans l'historique
git, au commit `407322b` et avant.

## Partage et sauvegarde

- **Partager mes jeux** encode les presets dans un lien (`/importer#jeux=…`) et
  ouvre la feuille de partage native. Le contenu d'un lien est une entrée non
  fiable : il est revalidé et borné à la lecture, et l'import demande toujours
  une confirmation explicite.
- **Sauvegarder / Restaurer** manipule un fichier JSON contenant parties *et*
  jeux. La restauration n'ajoute que ce qui manque et n'écrase jamais un
  réglage local.

## Le preset Dix-Mille

| Champ | Valeur |
| --- | --- |
| Objectif | 10 000 |
| Montants rapides | 50, 100, 400, 500, 1000 |
| Minimum par tour | 400 |
| Pas de score | 10 |

Deux règles propres au Dix-Mille, portées par le preset et **absentes des
nouveaux presets** (minimum à 0, pas à 1) :

- un tour doit rapporter **au moins 400 points** pour être enregistré ; en
  dessous il compte pour zéro ;
- les scores sont des multiples de 10.

Un tour peut faire perdre des points : la saisie négative existe pour ça, quel
que soit le preset.
