const LS_KEY = 'pokemon_invaders_interests';
const LS_KEY_AGE = 'pokemon_invaders_age';

export interface OnboardingQuestion {
  text: string;
  label: string;   // label court injecté dans le prompt AI (ex: "Genre de jeu : FPS / Action")
  options: string[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    text: "🕹️ Ton genre de jeu préféré ?",
    label: 'Genre de jeu',
    options: [
      'FPS / Action',
      'RPG / Open world',
      'Stratégie / Gestion',
      'Jeux de sport',
      'Candy Crush compte comme jeu vidéo',
    ],
  },
  {
    text: "🤖 Ton avis sur l'IA ?",
    label: "Rapport à l'IA",
    options: [
      "Fasciné, j'utilise tout",
      'Utile mais méfiant',
      'Indifférent',
      'Skynet arrive je vous dis',
      'Je parle déjà à Claude tous les jours',
    ],
  },
  {
    text: "🎬 Ton genre de film préféré ?",
    label: 'Genre de film',
    options: [
      'Action / Aventure',
      'Comédie',
      'Horreur / Thriller',
      'Science-fiction',
      "Les films où rien n'explose",
    ],
  },
  {
    text: "🌶️ Ton niveau d'épices ?",
    label: 'Tolérance aux épices',
    options: [
      'Doux uniquement',
      'Un peu de piquant',
      "Fort c'est mieux",
      'Suicide sauce sans sourciller',
      "J'appelle les pompiers après chaque repas",
    ],
  },
  {
    text: "🌅 Tu es plutôt ?",
    label: 'Rythme de vie',
    options: [
      'Lève-tôt productif',
      'Couche-tard créatif',
      "Ni l'un ni l'autre honnêtement",
      "Ça dépend si y'a du café",
      'Je dors quand je peux',
    ],
  },
  {
    text: "😂 Ton style d'humour ?",
    label: "Style d'humour",
    options: [
      'Humour noir',
      'Blagues nulles assumées',
      'Sarcasme permanent',
      'Humour absurde',
      'Je ris surtout de mes propres blagues',
    ],
  },
  {
    text: "🦸 Ton superpouvoir idéal ?",
    label: 'Superpouvoir idéal',
    options: [
      'Téléportation',
      'Lire dans les pensées',
      'Invisibilité',
      "Arrêter le temps",
      'Manger sans grossir',
    ],
  },
  {
    text: "🎓 Ton rapport à l'apprentissage ?",
    label: "Rapport à l'apprentissage",
    options: [
      "J'adore apprendre constamment",
      "Quand c'est utile",
      'YouTube University uniquement',
      "J'apprends par l'expérience",
      "L'école m'a traumatisé",
    ],
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
