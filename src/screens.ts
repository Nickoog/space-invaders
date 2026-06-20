import { W, H, MENU_BLINK_MS, GAMEOVER_DELAY_MS, ENEMY_COLS, ENEMY_ROWS, LEVEL_CLEAR_RATIO, WRONG_TYPE_RATIO, MAX_LEVELS, VICTORY_DELAY_MS } from './constants.js';
import { TYPE_LABELS, TYPE_COLORS } from './api/pokeapi.js';

export function renderLoadingScreen(ctx: CanvasRenderingContext2D, loaded: number, total: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillText('POKEMON', W / 2, 170);

  ctx.fillStyle = '#ffff00';
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillText('INVADERS', W / 2, 222);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '13px "Press Start 2P", monospace';
  ctx.fillText('Chargement du Pokédex…', W / 2, 300);

  // Progress bar
  const bw = 320, bh = 18, bx = W / 2 - bw / 2, by = 324;
  ctx.strokeStyle = '#00ff44';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#00ff44';
  const fill = total > 0 ? (bw - 4) * (loaded / total) : 0;
  ctx.fillRect(bx + 2, by + 2, fill, bh - 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.fillText(`${loaded} / ${total}`, W / 2, 366);

  ctx.textAlign = 'left';
}

export function renderMenuScreen(ctx: CanvasRenderingContext2D, highScore: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = '26px "Press Start 2P", monospace';
  ctx.fillText('POKEMON', W / 2, 158);

  ctx.fillStyle = '#ffff00';
  ctx.font = '26px "Press Start 2P", monospace';
  ctx.fillText('INVADERS', W / 2, 214);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '13px "Press Start 2P", monospace';
  ctx.fillText('← → pour bouger', W / 2, 308);
  ctx.fillText('ESPACE pour lancer une Pokéball', W / 2, 342);

  if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText('— APPUYER SUR ENTRÉE —', W / 2, 426);
  }

  if (highScore > 0) {
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText(`MEILLEUR : ${String(highScore).padStart(4, '0')} Pokémon capturés`, W / 2, 504);
  }

  ctx.textAlign = 'left';
}

export function renderLevelUpScreen(ctx: CanvasRenderingContext2D, nextLevel: number, timer: number, levelType: string, won = false): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Fade in then hold
  const alpha = Math.min(1, timer / 300);
  ctx.globalAlpha = alpha;

  if (won) {
    // Victory transition — player just finished level 17
    ctx.fillStyle = '#ffff44';
    ctx.font = '30px "Press Start 2P", monospace';
    ctx.fillText('VICTOIRE !', W / 2, H / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText('Tu as terminé les 17 niveaux !', W / 2, H / 2 + 10);

    ctx.fillStyle = '#00ff44';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('Félicitations, Flavien !', W / 2, H / 2 + 50);
  } else {
    ctx.fillStyle = '#ffff44';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('NIVEAU', W / 2, H / 2 - 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.fillText(String(nextLevel), W / 2, H / 2 + 10);

    if (nextLevel === MAX_LEVELS) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('DERNIER NIVEAU !', W / 2, H / 2 + 58);
    }

    // Type objective
    const typeColor    = TYPE_COLORS[levelType] ?? '#ffffff';
    const typeLabel    = TYPE_LABELS[levelType] ?? levelType;
    const correctTotal = Math.round(ENEMY_COLS * ENEMY_ROWS * (1 - WRONG_TYPE_RATIO));
    const toCatch      = correctTotal - Math.floor(correctTotal * (1 - LEVEL_CLEAR_RATIO));
    const typeY        = nextLevel === MAX_LEVELS ? H / 2 + 88 : H / 2 + 70;
    ctx.fillStyle = typeColor;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText(`Attrape ${toCatch} Pokémon ${typeLabel} !`, W / 2, typeY);

    ctx.fillStyle = '#888888';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('Évite les autres types', W / 2, typeY + 30);
  }

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ── Confetti helper ───────────────────────────────────────────────────────────
function drawConfetti(ctx: CanvasRenderingContext2D): void {
  const colors = ['#ff4444', '#ffff44', '#44ff44', '#44ffff', '#ff44ff', '#ff9900', '#ffffff'];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const speed = 0.04 + (i % 5) * 0.015;
    const x = (i * 137.508 + (i % 3) * 80) % W;
    const y = ((now * speed + i * 40) % (H + 20)) - 10;
    const size = 6 + (i % 4) * 3;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(now * 0.002 * (i % 2 === 0 ? 1 : -1) + i);
    ctx.fillStyle = colors[i % colors.length] as string;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

// ── Text word-wrap helper ─────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, y);
}

// ── Victory screen ────────────────────────────────────────────────────────────
export function renderVictoryScreen(ctx: CanvasRenderingContext2D, score: number, highScore: number, delay: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  drawConfetti(ctx);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = '22px "Press Start 2P", monospace';
  ctx.fillText('JOYEUX ANNIVERSAIRE', W / 2, 130);

  ctx.fillStyle = '#ffff44';
  ctx.font = '36px "Press Start 2P", monospace';
  ctx.fillText('FLAVIEN !', W / 2, 200);

  ctx.fillStyle = '#00ff44';
  ctx.font = '20px "Press Start 2P", monospace';
  ctx.fillText('17 ANS !', W / 2, 258);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '13px "Press Start 2P", monospace';
  ctx.fillText(`Score final : ${score}`, W / 2, 320);
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ffff44';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('★ NOUVEAU RECORD ★', W / 2, 350);
  }

  if (delay > VICTORY_DELAY_MS) {
    if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText('[ ENTRÉE ]  Rejouer en MODE HARD', W / 2, 430);
      ctx.fillStyle = '#888888';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText('[ ÉCHAP ]  Retour au menu', W / 2, 462);
    }
  }

  ctx.textAlign = 'left';
}

// ── Interlude screen (personal message + optional photo) ──────────────────────
export function renderInterludeScreen(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  if (image && image.complete && image.naturalWidth > 0) {
    const maxW = W;
    const maxH = H - 40;
    const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    ctx.drawImage(image, W / 2 - iw / 2, (maxH - ih) / 2, iw, ih);
  }

  if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#00ff44';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('[ ENTRÉE pour continuer ]', W / 2, H - 24);
  }

  ctx.textAlign = 'left';
}

// ── Pre-level quiz screen ─────────────────────────────────────────────────────
export function renderPreLevelQuizScreen(
  ctx: CanvasRenderingContext2D,
  ammo: number,
  quota: number,
  level: number,
  levelType: string,
  quizInProgress = false,
): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  const typeColor = TYPE_COLORS[levelType] ?? '#00ff44';
  const typeLabel = TYPE_LABELS[levelType] ?? levelType;

  if (!quizInProgress) {
    // ── Phase 1 : écran d'intro ───────────────────────────────────────────────

    let y = level === 1 ? 30 : 50;

    if (level === 1) {
      ctx.fillStyle = '#ffff44';
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.fillText('BIENVENUE, FLAVIEN !', W / 2, y);
      y += 36;
    }

    // Titre niveau
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillText(`NIVEAU ${level}`, W / 2, y);
    y += 42;

    // Type
    ctx.fillStyle = typeColor;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`Pokémon à attraper : ${typeLabel.toUpperCase()}`, W / 2, y);
    y += 30;

    // Séparateur haut
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    y += 30;

    // Contrôles
    ctx.fillStyle = '#444444';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('← →  DÉPLACER          ESPACE  LANCER', W / 2, y);
    y += 40;

    // Règle principale — type
    ctx.fillStyle = typeColor;
    ctx.font = '17px "Press Start 2P", monospace';
    ctx.fillText(`Attrape les Pokémon ${typeLabel} !`, W / 2, y);
    y += 42;

    // Mauvais type
    ctx.fillStyle = '#ff9944';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText('Mauvais type  →  la colère des Légendaires !', W / 2, y);
    y += 32;

    // Balle ennemie
    ctx.fillStyle = '#888888';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText('Balle ennemie  →  réponds ou tu perds une vie', W / 2, y);
    y += 32;

    // Rechargement
    ctx.fillStyle = '#888888';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText('Plus de pokéballs  →  ESPACE pour en regagner', W / 2, y);
    y += 28;

    // Séparateur bas
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    y += 32;

    // Phrase de transition
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('Mais avant de commencer,', W / 2, y);
    y += 22;
    ctx.fillText('gagne tes pokéballs en répondant aux questions !', W / 2, y);
    y += 34;

    // Objectif
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(`Objectif : ${quota} pokéballs`, W / 2, y);
    y += 46;

    // CTA clignotant
    if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
      ctx.fillStyle = '#00ff44';
      ctx.font = '15px "Press Start 2P", monospace';
      ctx.fillText('[ ENTRÉE ]  COMMENCER', W / 2, y);
    }

  } else {
    // ── Phase 2 : quiz en cours, modal DOM au premier plan ───────────────────

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`NIVEAU ${level} — QUIZ`, W / 2, 80);

    ctx.fillStyle = typeColor;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`Pokémon ${typeLabel}`, W / 2, 110);

    // Barre de progression
    const progY = 180;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('POKÉBALLS GAGNÉES', W / 2, progY);

    const bw = 500, bh = 28, bx = W / 2 - bw / 2, by = progY + 18;
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    const fill = quota > 0 ? (bw - 4) * Math.min(1, ammo / quota) : 0;
    ctx.fillStyle = '#00ff44';
    ctx.fillRect(bx + 2, by + 2, fill, bh - 4);

    ctx.fillStyle = '#00ff44';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`${ammo} / ${quota}`, W / 2, by + bh + 30);
  }

  ctx.textAlign = 'left';
}

export function renderGameOverScreen(ctx: CanvasRenderingContext2D, score: number, highScore: number, level: number, delay: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = '30px "Press Start 2P", monospace';
  ctx.fillText('GAME OVER', W / 2, 210);

  ctx.fillStyle = '#ffff00';
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillText(`Capturés : ${score}`, W / 2, 296);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillText(`Meilleur : ${highScore}`, W / 2, 336);
  ctx.fillText(`Niveau atteint : ${level}`, W / 2, 374);

  if (delay > GAMEOVER_DELAY_MS && Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText('ENTRÉE pour rejouer', W / 2, 452);
  }

  ctx.textAlign = 'left';
}
