import type { GameState } from '../types.js';

let stylesInjected = false;

function injectRulesStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    #rules-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.96);
      display: flex; justify-content: center; align-items: flex-start;
      z-index: 1000; overflow-y: auto;
      padding: 20px; box-sizing: border-box;
    }
    .rules-box {
      background: #0a0a0a; border: 3px solid #ffcc00;
      padding: 32px 36px; max-width: 520px; width: 100%;
      box-shadow: 0 0 40px rgba(255,204,0,0.2);
      color: #fff; box-sizing: border-box;
      font-family: 'Press Start 2P', monospace;
      margin: auto;
    }
    .rules-title {
      color: #ffcc00; font-size: 13px; text-align: center;
      margin-bottom: 24px; letter-spacing: 1px;
    }
    .rules-section-title {
      color: #ffcc00; font-size: 9px; margin: 18px 0 8px 0;
      display: block;
    }
    .rules-text {
      color: #ccc; font-size: 8px; line-height: 1.9;
      margin: 0 0 4px 0; display: block;
    }
    .rules-item {
      color: #aaa; font-size: 8px; line-height: 1.9;
      padding-left: 12px; margin: 2px 0; display: block;
    }
    .rules-start-btn {
      display: block; width: 100%; margin-top: 28px;
      padding: 14px; background: #111;
      border: 2px solid #ffcc00; color: #ffcc00; cursor: pointer;
      font-family: 'Press Start 2P', monospace; font-size: 11px;
      text-align: center; transition: background 0.12s; box-sizing: border-box;
    }
    .rules-start-btn:hover { background: #1a1400; }
  `;
  document.head.appendChild(style);
}

export function removeRulesScreen(): void {
  document.getElementById('rules-overlay')?.remove();
}

export function showRulesScreen(game: GameState, onStart: (g: GameState) => void): void {
  injectRulesStyles();
  removeRulesScreen();

  const overlay = document.createElement('div');
  overlay.id = 'rules-overlay';
  document.body.appendChild(overlay);

  const box = document.createElement('div');
  box.className = 'rules-box';
  overlay.appendChild(box);

  const title = document.createElement('div');
  title.className = 'rules-title';
  title.textContent = '🎮 RÈGLES DE POKÉMON INVADERS';
  box.appendChild(title);

  const content = document.createElement('div');
  box.appendChild(content);

  const sections: Array<{ heading: string; lines: string[]; items?: string[] }> = [
    {
      heading: '🏆 BUT DU JEU',
      lines: ["Termine les 17 niveaux pour débloquer ton cadeau d'anniversaire !"],
    },
    {
      heading: '💀 VIES',
      lines: ['Tu commences avec 3 vies.', 'Perds ta dernière vie → Game Over, retour au niveau 1. Pas de pitié !'],
    },
    {
      heading: '📋 AVANT CHAQUE NIVEAU',
      lines: [],
      items: [
        '• Tu commences avec 0 Pokéball.',
        '• Réponds correctement à des questions de culture geek pour en gagner.',
        '• Tu dois en avoir 20 avant de lancer le niveau.',
      ],
    },
    {
      heading: '⚡ PENDANT UN NIVEAU',
      lines: [],
      items: [
        "• Capture 20 Pokémon du type demandé (ex : type Feu).",
        '• Chaque tir utilise 1 Pokéball.',
        '• Bon type capturé → il rejoint ton équipe ✅',
        '• Mauvais type capturé → il t\'attaque plus fort ⚠️',
        '• Plus de Pokéballs → réponds à des questions pour en regagner.',
      ],
    },
    {
      heading: '🛡️ SI TU ES TOUCHÉ',
      lines: [],
      items: [
        '• Réponds à une question de culture geek.',
        '• Bonne réponse → tu gardes ta vie, tu continues.',
        '• Mauvaise réponse → tu perds 1 vie et le niveau devient plus dur.',
      ],
    },
    {
      heading: '🎁 VICTOIRE',
      lines: [
        'Termine les 17 niveaux pour gagner ton cadeau !',
        'Défi bonus : essaie de finir avant tes 18 ans 😄',
      ],
    },
  ];

  for (const section of sections) {
    const sectionTitle = document.createElement('span');
    sectionTitle.className = 'rules-section-title';
    sectionTitle.textContent = section.heading;
    content.appendChild(sectionTitle);

    for (const line of section.lines) {
      const p = document.createElement('span');
      p.className = 'rules-text';
      p.textContent = line;
      content.appendChild(p);
    }

    for (const item of section.items ?? []) {
      const p = document.createElement('span');
      p.className = 'rules-item';
      p.textContent = item;
      content.appendChild(p);
    }
  }

  const btn = document.createElement('button');
  btn.className = 'rules-start-btn';
  btn.id = 'rules-start';
  btn.textContent = "▶ C'EST PARTI !";
  box.appendChild(btn);

  btn.addEventListener('click', () => {
    removeRulesScreen();
    onStart(game);
  });
}
