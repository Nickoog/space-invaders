import { GEN1_COUNT, ENEMY_COLS, ENEMY_ROWS, POKEMON_LOAD_TIMEOUT_MS, WRONG_TYPE_RATIO } from '../constants.js';
import { shuffleArray } from '../utils.js';

const TOTAL = ENEMY_COLS * ENEMY_ROWS; // 55
const CACHE_KEY_TYPES = 'pokemon_invaders_types_v1';

// Official artwork sprites — high-res PNGs, URL is predictable from ID alone.
function officialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// ── Level type rotation ───────────────────────────────────────────────────────

const LEVEL_TYPES = [
  'fire', 'water', 'grass', 'electric', 'psychic',
  'poison', 'ground', 'rock', 'flying', 'bug',
  'ice', 'fighting', 'ghost', 'dragon',
] as const;

export type PokemonType = typeof LEVEL_TYPES[number];

export const TYPE_LABELS: Record<PokemonType, string> = {
  fire: 'Feu', water: 'Eau', grass: 'Plante', electric: 'Électrik',
  psychic: 'Psy', poison: 'Poison', ground: 'Sol', rock: 'Roche',
  flying: 'Vol', bug: 'Insecte', ice: 'Glace', fighting: 'Combat',
  ghost: 'Spectre', dragon: 'Dragon',
};

export const TYPE_COLORS: Record<PokemonType, string> = {
  fire: '#ff6030', water: '#6890f0', grass: '#78c850', electric: '#f8d030',
  psychic: '#f85888', poison: '#a040a0', ground: '#e0c068', rock: '#b8a038',
  flying: '#a890f0', bug: '#a8b820', ice: '#98d8d8', fighting: '#c03028',
  ghost: '#705898', dragon: '#7038f8',
};

export function getLevelType(level: number): PokemonType {
  return LEVEL_TYPES[(level - 1) % LEVEL_TYPES.length]!;
}

// ── Sprite and type preloading ───────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed: ${url}`));
    // PokeAPI occasionally returns http:// URLs — force https to avoid mixed-content blocks
    img.src = url.replace('http://', 'https://');
  });
}

export async function preloadSprites(
  ids: number[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<Map<number, HTMLImageElement | null>> {
  // Sprite URLs are constructed directly — no API call needed for sprites.
  // Type data still fetched from API and cached in sessionStorage.
  let typeCached: Record<string, string> = {};
  try { typeCached = JSON.parse(sessionStorage.getItem(CACHE_KEY_TYPES) ?? '{}') as Record<string, string>; } catch { /**/ }

  const map = new Map<number, HTMLImageElement | null>();
  let loaded = 0;

  const loadAll = Promise.allSettled(
    ids.map(async id => {
      try {
        // Fetch type data from API only if not already cached
        if (!typeCached[id]) {
          const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await res.json() as {
            types: Array<{ type: { name: string } }>;
          };
          typeCached[id] = data.types[0]?.type.name ?? 'normal';
        }
        // Official artwork — high-res PNG, URL derived from ID directly
        const img = await loadImage(officialArtworkUrl(id));
        map.set(id, img);
      } catch { /**/ }
      loaded++;
      onProgress?.(loaded, ids.length);
    })
  );

  const timeout = new Promise<'timeout'>(resolve =>
    setTimeout(() => resolve('timeout'), POKEMON_LOAD_TIMEOUT_MS)
  );

  await Promise.race([loadAll, timeout]);

  try { sessionStorage.setItem(CACHE_KEY_TYPES, JSON.stringify(typeCached)); } catch { /**/ }

  const typeCount = Object.keys(typeCached).length;
  console.debug(`[PRELOAD] Types en cache après chargement: ${typeCount}/${ids.length}`);

  // Ensure every requested ID has an entry (null = use fallback drawing)
  for (const id of ids) {
    if (!map.has(id)) map.set(id, null);
  }

  return map;
}

// ── ID selection per level ───────────────────────────────────────────────────

export function getIdsForLevel(level: number): { ids: number[]; correctFlags: boolean[]; levelType: PokemonType } {
  const levelType = getLevelType(level);

  // Load type cache — populated by preloadSprites() on first run
  let typeCached: Record<string, string> = {};
  try { typeCached = JSON.parse(sessionStorage.getItem(CACHE_KEY_TYPES) ?? '{}') as Record<string, string>; } catch { /**/ }

  const cacheSize = Object.keys(typeCached).length;
  console.debug(`[TYPE] Level ${level} → type cible: "${levelType}", entrées dans le cache: ${cacheSize}/${GEN1_COUNT}`);

  // Separate Gen1 Pokémon by whether they match the target type
  const correctIds: number[] = [];
  const wrongIds:   number[] = [];
  for (let id = 1; id <= GEN1_COUNT; id++) {
    const t = typeCached[String(id)];
    if (!t) continue;
    if (t === levelType) correctIds.push(id);
    else wrongIds.push(id);
  }

  console.debug(`[TYPE] Pokémon du bon type: ${correctIds.length}, mauvais type: ${wrongIds.length}, sans type: ${GEN1_COUNT - correctIds.length - wrongIds.length}`);

  // Fallback: type cache not yet populated (first session before preload completes)
  if (correctIds.length === 0) {
    console.warn('[TYPE] FALLBACK: cache vide → tous les ennemis marqués correctType=true');
    const ids: number[] = [];
    for (let i = 0; i < TOTAL; i++) {
      ids.push((((level - 1) * TOTAL + i) % GEN1_COUNT) + 1);
    }
    return { ids, correctFlags: ids.map(() => true), levelType };
  }

  const wrongCount   = Math.floor(TOTAL * WRONG_TYPE_RATIO);
  const correctCount = TOTAL - wrongCount;

  // Allow duplicates when there aren't enough unique Pokémon of the target type
  const shuffledCorrect = shuffleArray(correctIds);
  const pickedCorrect: number[] = Array.from({ length: correctCount }, (_, i) => shuffledCorrect[i % shuffledCorrect.length]!);

  const pickedWrong = shuffleArray(wrongIds).slice(0, wrongCount);

  // Bottom SAFE_ROWS rows are always correct-type so the player is never forced to hit a wrong-type
  // to progress. Wrong-type enemies only appear in the top (ENEMY_ROWS - SAFE_ROWS) rows.
  const SAFE_ROWS       = 2;
  const safeSlots       = SAFE_ROWS * ENEMY_COLS;          // 22 — rows 3 & 4 (bottom)
  // rows 0-2 (top) = TOTAL - safeSlots = 33 slots
  const correctForSafe  = pickedCorrect.slice(0, safeSlots);
  const correctForMixed = pickedCorrect.slice(safeSlots);  // remaining 17 correct for top rows

  const topSection    = shuffleArray([...correctForMixed, ...pickedWrong]); // 17 correct + 16 wrong = 33
  const bottomSection = shuffleArray(correctForSafe);                        // 22 correct

  // combined is row-major: indices 0–32 = rows 0-2 (top), 33–54 = rows 3-4 (bottom)
  const combined = [...topSection, ...bottomSection];

  const ids          = combined;
  const correctFlags = combined.map(id => (typeCached[String(id)] ?? '') === levelType);

  const wrongInGrid = correctFlags.filter(f => !f).length;
  console.debug(`[TYPE] Grille: ${correctFlags.length - wrongInGrid} bon type, ${wrongInGrid} mauvais type`);
  console.debug(`[TYPE] IDs mauvais type:`, combined.filter((_, i) => !correctFlags[i]).map(id => `#${id}(${typeCached[String(id)]})`).join(', '));

  return { ids, correctFlags, levelType };
}
