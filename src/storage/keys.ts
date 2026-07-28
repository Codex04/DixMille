/**
 * ⚠️ Les données des utilisateurs sont liées à l'origine
 * `https://codex04.github.io`, pas au chemin. Redéployer sur le même compte
 * GitHub Pages les conserve, même en renommant le dépôt. Basculer vers un
 * domaine personnalisé, Netlify ou Vercel les détruirait toutes, sans
 * avertissement. Voir README avant tout changement d'hébergement.
 */

/** Clés écrites par l'app Blazor : `game-1`, `game-2`, … */
export const LEGACY_KEY_PATTERN = /^game-(\d+)$/

export const NAMESPACE = 'dixmille:v2:'

/** État applicatif (parties + réglages). */
export const KEY_STATE = `${NAMESPACE}state`
/** Copie brute des clés legacy, prise avant toute écriture. */
export const KEY_LEGACY_BACKUP = `${NAMESPACE}legacyBackup`
/** Drapeau d'idempotence de la migration. */
export const KEY_MIGRATED_AT = `${NAMESPACE}migratedAt`
/** Compte rendu de la dernière migration, consultable dans les réglages. */
export const KEY_MIGRATION_REPORT = `${NAMESPACE}migrationReport`
/** État illisible mis de côté plutôt que supprimé. */
export const KEY_CORRUPT_STATE = `${NAMESPACE}state.corrupt`
