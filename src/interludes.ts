export interface InterludeConfig {
  afterLevel: number; // show this interlude after completing this level number
  photo: string;      // filename in public/interludes/ (e.g. 'interlude1.png')
}

// ── Customize here ────────────────────────────────────────────────────────────
// Drop your photos in public/interludes/ before gifting.
// The message is baked into each photo as a speech bubble.

export const INTERLUDES: InterludeConfig[] = [
  { afterLevel: 3,  photo: 'interlude1.png' },
  { afterLevel: 7,  photo: 'interlude2.png' },
  { afterLevel: 11, photo: 'interlude3.png' },
  { afterLevel: 16, photo: 'interlude4.png' },
];

// ── Helper ────────────────────────────────────────────────────────────────────

export function getInterludeForLevel(level: number): InterludeConfig | null {
  return INTERLUDES.find(i => i.afterLevel === level) ?? null;
}
