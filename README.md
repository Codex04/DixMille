# Ardoise

### 👉 **[Open the app — codex04.github.io/Ardoise](https://codex04.github.io/Ardoise/)**

A score keeper for your board and dice games. Static site, no server, works offline.

Each game is described by a **preset**: a name, a target score, and a list of
quick-entry amounts. Dix-Mille ships as the default preset; you create the
others from the settings screen, and share them with a link.

---

## ⚠️ Read this before changing the hosting

Games are stored in the browser's `localStorage`, which is bound to the
**origin** `https://codex04.github.io` — not to the path.

- ✅ Renaming the repository loses **nothing**: the `/<repo>/` path is not part
  of the origin. Just re-run the workflow afterwards so the site is rebuilt
  with the right base path.
- ❌ Moving to a custom domain, Netlify, Vercel or Cloudflare Pages **destroys
  every user's history**, silently and irreversibly.

If a custom domain ever becomes necessary: ship the change only after letting
people back up from *Settings → Save*, then switch.

### Storage keys keep the old name

`localStorage` uses the `dixmille:v2:` prefix, inherited from the app's original
name. That prefix is **data, not branding**: renaming those keys would hide
every existing user's history. It stays as it is, deliberately.

## Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

The first `npm install` generates `package-lock.json`; it must be committed, as
CI runs `npm ci`.

Locally the site is served from the root. In production the base path is
injected by CI through `VITE_BASE`, derived from the repository name — it is
hardcoded nowhere.

## Deployment

`.github/workflows/deploy.yml` runs typecheck, tests and build, then publishes
**on every push to `main`**. Pull requests are checked but never published.

GitHub Pages must be set to **GitHub Actions** as its source (`build_type:
workflow`). If it is left on "deploy from a branch", Actions deployments still
report success but a branch build silently overwrites them — the workflow shows
green while the site never changes.

## Migrating from the old Blazor version

On first load the app reads the `game-1`, `game-2`… keys written by the previous
version and converts them to its own format. Imported games get the Dix-Mille
preset.

Guarantees:

- `game-*` keys are **never** deleted or overwritten;
- a raw copy is saved to `dixmille:v2:legacyBackup` before any write;
- migration is idempotent and can replay without creating duplicates;
- an unreadable entry is skipped and reported, without blocking startup.

The Blazor source has been removed from the repository. It remains reachable in
git history, at commit `407322b` and earlier.

## Sharing and backup

- **Share my games** encodes the presets into a link (`/importer#jeux=…`) and
  opens the native share sheet. A link is untrusted input: its contents are
  re-validated and clamped on read, and importing always requires an explicit
  confirmation.
- **Save / Restore** handles a JSON file containing both games and presets.
  Restoring only adds what is missing and never overwrites a local setting.

## The Dix-Mille preset

| Field | Value |
| --- | --- |
| Target | 10,000 |
| Quick amounts | 50, 100, 400, 500, 1000 |
| Minimum per turn | 400 |
| Score step | 10 |

Two rules specific to Dix-Mille, carried by the preset and **absent from new
presets** (minimum 0, step 1) — imposing them on a game of tarot would make no
sense:

- a turn must be worth **at least 400 points** to be recorded; below that it
  counts as zero;
- scores are multiples of 10.

A turn can lose points, whatever the preset, so negative entry is available
everywhere.

## Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · Valibot · Vitest.
Roughly 87 kB gzipped, against about 2 MB for the Blazor version it replaces.
