export interface InterludeConfig {
  afterLevel: number; // show this interlude after completing this level number
  message: string;
  photo?: string;     // filename in public/interludes/ (e.g. 'photo1.jpg')
}

// ── Customize here ────────────────────────────────────────────────────────────
// Edit the messages and drop your photos in public/interludes/ before gifting.

export const INTERLUDES: InterludeConfig[] = [
  {
    afterLevel: 4,
    message: "Niveau 4 déjà ! Bien joué Flavien, t'es parti pour aller loin...",
    photo: 'interlude1.jpg',
  },
  {
    afterLevel: 8,
    message: "La moitié du chemin ! Tu te souviens de quand on a fait ça ensemble ?",
    photo: 'interlude2.jpg',
  },
  {
    afterLevel: 12,
    message: "Plus que 5 niveaux. T'es clairement le meilleur Pokémon Invader que je connaisse !",
    photo: 'interlude3.jpg',
  },
  {
    afterLevel: 16,
    message: "Le dernier niveau t'attend. Bonne chance champion — je suis fier de toi !",
    photo: 'interlude4.jpg',
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

export function getInterludeForLevel(level: number): InterludeConfig | null {
  return INTERLUDES.find(i => i.afterLevel === level) ?? null;
}
