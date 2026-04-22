import { GEN1_COUNT, ENEMY_COLS, ENEMY_ROWS, POKEMON_LOAD_TIMEOUT_MS } from '../constants.js';

const TOTAL = ENEMY_COLS * ENEMY_ROWS; // 55
const CACHE_KEY = 'pokemon_invaders_sprites_v1';

export function getIdsForLevel(level) {
  const ids = [];
  for (let i = 0; i < TOTAL; i++) {
    ids.push((((level - 1) * TOTAL + i) % GEN1_COUNT) + 1);
  }
  return ids;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed: ${url}`));
    // PokeAPI occasionally returns http:// URLs — force https to avoid mixed-content blocks
    img.src = url.replace('http://', 'https://');
  });
}

export async function preloadSprites(ids, onProgress) {
  let cached = {};
  try { cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { /**/ }

  const map = new Map();
  let loaded = 0;

  const loadAll = Promise.allSettled(
    ids.map(async id => {
      try {
        let url = cached[id];
        if (!url) {
          const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await res.json();
          url = data.sprites.front_default;
          if (url) cached[id] = url;
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

  const timeout = new Promise(resolve =>
    setTimeout(() => resolve('timeout'), POKEMON_LOAD_TIMEOUT_MS)
  );

  await Promise.race([loadAll, timeout]);

  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached)); } catch { /**/ }

  // Ensure every requested ID has an entry (null = use fallback drawing)
  for (const id of ids) {
    if (!map.has(id)) map.set(id, null);
  }

  return map;
}
