const LS_KEY = 'pokemon_invaders_interests';
const LS_KEY_AGE = 'pokemon_invaders_age';

export interface OnboardingQuestion {
  text: string;
  options: string[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    text: "🎮 Ton univers principal quand t'as du temps libre ?",
    options: ['Gaming', 'Sport', 'Musique', 'Cuisine', 'Cinéma / Séries'],
  },
  {
    text: "⚽ Ton rapport au sport ?",
    options: [
      'Je pratique sérieusement',
      'Spectateur passionné',
      'Un peu des deux',
      "Le sport c'est pour les autres",
      'Les Pokémon comptent comme sport',
    ],
  },
  {
    text: "🎵 Ce qui tourne chez toi en ce moment ?",
    options: ['Rock / Metal', 'Hip-hop / Rap', 'Pop / R&B', 'Électro / Dance', 'Variété française'],
  },
  {
    text: "🍕 Ta cuisine préférée ?",
    options: ['Française', 'Italienne', 'Asiatique', 'Américaine / Tex-mex', 'Tout ce qui va au micro-ondes'],
  },
];

export function getPlayerInterests(): string[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed as string[];
    }
    return null;
  } catch {
    return null;
  }
}

export function savePlayerInterests(interests: string[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(interests));
  } catch { /* ignore — non-blocking */ }
}

export function getPlayerAge(): number | null {
  try {
    const raw = localStorage.getItem(LS_KEY_AGE);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function savePlayerAge(age: number): void {
  try {
    localStorage.setItem(LS_KEY_AGE, String(age));
  } catch { /* ignore — non-blocking */ }
}
