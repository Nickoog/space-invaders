import { GEN1_COUNT, ENEMY_COLS, ENEMY_ROWS, POKEMON_LOAD_TIMEOUT_MS, WRONG_TYPE_RATIO } from '../constants.js';

const TOTAL = ENEMY_COLS * ENEMY_ROWS; // 55
const CACHE_KEY       = 'pokemon_invaders_sprites_v1';
const CACHE_KEY_TYPES = 'pokemon_invaders_types_v1';

// ── Level type rotation ───────────────────────────────────────────────────────

const LEVEL_TYPES = [
  'fire', 'water', 'grass', 'electric', 'psychic',
  'poison', 'ground', 'rock', 'flying', 'bug',
  'ice', 'fighting', 'ghost', 'dragon',
] as const;

export const TYPE_LABELS: Record<string, string> = {
  fire: 'Feu', water: 'Eau', grass: 'Plante', electric: 'Électrik',
  psychic: 'Psy', poison: 'Poison', ground: 'Sol', rock: 'Roche',
  flying: 'Vol', bug: 'Insecte', ice: 'Glace', fighting: 'Combat',
  ghost: 'Spectre', dragon: 'Dragon',
};

export const TYPE_COLORS: Record<string, string> = {
  fire: '#ff6030', water: '#6890f0', grass: '#78c850', electric: '#f8d030',
  psychic: '#f85888', poison: '#a040a0', ground: '#e0c068', rock: '#b8a038',
  flying: '#a890f0', bug: '#a8b820', ice: '#98d8d8', fighting: '#c03028',
  ghost: '#705898', dragon: '#7038f8',
};

export function getLevelType(level: number): string {
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
  let cached: Record<string, string> = {};
  try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, string>; } catch { /**/ }

  let typeCached: Record<string, string> = {};
  try { typeCached = JSON.parse(sessionStorage.getItem(CACHE_KEY_TYPES) ?? '{}') as Record<string, string>; } catch { /**/ }

  const map = new Map<number, HTMLImageElement | null>();
  let loaded = 0;

  const loadAll = Promise.allSettled(
    ids.map(async id => {
      try {
        let url = cached[id];
        if (!url || !typeCached[id]) {
          const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await res.json() as {
            sprites: { front_default: string };
            types: Array<{ type: { name: string } }>;
          };
          url = data.sprites.front_default;
          if (url) cached[id] = url;
          // Extract primary type — persisted for getIdsForLevel()
          const pokemonType = data.types[0]?.type.name ?? 'normal';
          typeCached[id] = pokemonType;
        }
        if (url) {
          const img = await loadImage(url);
          map.set(id, img);
        }
      } catch { /**/ }
      loaded++;
      onProgress?.(loaded, ids.length);
    })
  );

  const timeout = new Promise<'timeout'>(resolve =>
    setTimeout(() => resolve('timeout'), POKEMON_LOAD_TIMEOUT_MS)
  );

  await Promise.race([loadAll, timeout]);

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached)); } catch { /**/ }
  try { sessionStorage.setItem(CACHE_KEY_TYPES, JSON.stringify(typeCached)); } catch { /**/ }

  // Ensure every requested ID has an entry (null = use fallback drawing)
  for (const id of ids) {
    if (!map.has(id)) map.set(id, null);
  }

  return map;
}

// ── ID selection per level ───────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function getIdsForLevel(level: number): { ids: number[]; correctFlags: boolean[]; levelType: string } {
  const levelType = getLevelType(level);

  // Load type cache — populated by preloadSprites() on first run
  let typeCached: Record<string, string> = {};
  try { typeCached = JSON.parse(sessionStorage.getItem(CACHE_KEY_TYPES) ?? '{}') as Record<string, string>; } catch { /**/ }

  // Separate Gen1 Pokémon by whether they match the target type
  const correctIds: number[] = [];
  const wrongIds:   number[] = [];
  for (let id = 1; id <= GEN1_COUNT; id++) {
    const t = typeCached[String(id)];
    if (!t) continue;
    if (t === levelType) correctIds.push(id);
    else wrongIds.push(id);
  }

  // Fallback: type cache not yet populated (first session before preload completes)
  if (correctIds.length === 0) {
    const ids: number[] = [];
    for (let i = 0; i < TOTAL; i++) {
      ids.push((((level - 1) * TOTAL + i) % GEN1_COUNT) + 1);
    }
    return { ids, correctFlags: ids.map(() => true), levelType };
  }

  const wrongCount   = Math.floor(TOTAL * WRONG_TYPE_RATIO);
  const correctCount = TOTAL - wrongCount;

  const pickedCorrect = shuffle(correctIds).slice(0, correctCount);
  const pickedWrong   = shuffle(wrongIds).slice(0, wrongCount);

  // Interleave so wrong-type enemies are spread across the grid
  const combined = shuffle([...pickedCorrect, ...pickedWrong]);

  const ids          = combined;
  const correctFlags = combined.map(id => (typeCached[String(id)] ?? '') === levelType);

  return { ids, correctFlags, levelType };
}
