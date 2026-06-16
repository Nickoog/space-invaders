import type { PlayerProfile } from './types.js';

export const MAX_PROFILES = 3;

const LS_KEY           = 'pokemon_invaders_profiles';
const LEGACY_HI        = 'pokemon_invaders_hi';
const LEGACY_INTERESTS = 'pokemon_invaders_interests';
const LEGACY_AGE       = 'pokemon_invaders_age';

const PSEUDO_PATTERN = /^[a-zA-Z0-9_\-]+$/;

// ── Validation ────────────────────────────────────────────────────────────────

function isValidProfile(p: unknown): p is PlayerProfile {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o['id'] === 'string' && o['id'].length > 0 &&
    typeof o['pseudo'] === 'string' && o['pseudo'].length >= 2 &&
    typeof o['highScore'] === 'number' &&
    typeof o['gamesPlayed'] === 'number' &&
    Array.isArray(o['interests']) &&
    (o['age'] === null || typeof o['age'] === 'number') &&
    typeof o['difficultyOffset'] === 'number' &&
    typeof o['createdAt'] === 'number'
  );
}

export function validatePseudo(pseudo: string, existingProfiles: PlayerProfile[]): string | null {
  const trimmed = pseudo.trim();
  if (trimmed.length < 2)   return 'Minimum 2 caractères.';
  if (trimmed.length > 12)  return 'Maximum 12 caractères.';
  if (!PSEUDO_PATTERN.test(trimmed)) return 'Lettres, chiffres, _ et - uniquement.';
  const taken = existingProfiles.some(
    p => p.pseudo.toLowerCase() === trimmed.toLowerCase()
  );
  if (taken) return 'Ce pseudo est déjà pris.';
  return null;
}

// ── Load / Save ───────────────────────────────────────────────────────────────

export function loadProfiles(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidProfile);
  } catch {
    return [];
  }
}

function saveProfiles(profiles: PlayerProfile[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  } catch { /**/ }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function createProfile(
  pseudo: string,
  interests: string[],
  age: number | null,
): PlayerProfile {
  return {
    id:              `profile_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    pseudo:          pseudo.trim(),
    highScore:       0,
    gamesPlayed:     0,
    interests,
    age,
    difficultyOffset: 0,
    createdAt:       Date.now(),
  };
}

export function addProfile(profile: PlayerProfile): void {
  const profiles = loadProfiles();
  if (profiles.length >= MAX_PROFILES) return;
  profiles.push(profile);
  saveProfiles(profiles);
}

export function updateProfile(profile: PlayerProfile): void {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx === -1) return;
  profiles[idx] = profile;
  saveProfiles(profiles);
}

export function deleteProfile(id: string): void {
  saveProfiles(loadProfiles().filter(p => p.id !== id));
}

// ── Birthday gift: auto-create Flavien's profile on first launch ──────────────

export function ensureFlavienProfile(): void {
  if (loadProfiles().length > 0) return; // profiles already exist, nothing to do
  const profile = createProfile('FLAVIEN', ['gaming', 'réseaux sociaux', 'jeux vidéo'], 17);
  addProfile(profile);
}

// ── Migration from legacy keys ────────────────────────────────────────────────

export function migrateFromLegacy(): void {
  try {
    if (loadProfiles().length > 0) return; // already migrated or fresh start

    const rawInterests = localStorage.getItem(LEGACY_INTERESTS);
    if (!rawInterests) return; // no legacy data to migrate

    const parsed: unknown = JSON.parse(rawInterests);
    if (!Array.isArray(parsed) || !parsed.every(i => typeof i === 'string')) return;
    const interests = parsed as string[];

    const rawAge = localStorage.getItem(LEGACY_AGE);
    const parsedAge = rawAge !== null ? parseInt(rawAge, 10) : NaN;
    const age = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : null;

    const rawHi = localStorage.getItem(LEGACY_HI);
    const parsedHi = rawHi !== null ? parseInt(rawHi, 10) : NaN;
    const highScore = Number.isFinite(parsedHi) ? parsedHi : 0;

    const profile = createProfile('Joueur 1', interests, age);
    profile.highScore = highScore;
    addProfile(profile);
  } catch { /**/ }
}
