import { W, H, MENU_BLINK_MS, GAMEOVER_DELAY_MS, LEVEL_UP_MS, ENEMY_COLS, ENEMY_ROWS, LEVEL_CLEAR_RATIO, WRONG_TYPE_RATIO, MAX_LEVELS, VICTORY_DELAY_MS } from './constants.js';
import { TYPE_LABELS, TYPE_COLORS } from './api/pokeapi.js';

export function renderLoadingScreen(ctx: CanvasRenderingContext2D, loaded: number, total: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 42px monospace';
  ctx.fillText('POKEMON', W / 2, 170);

  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 42px monospace';
  ctx.fillText('INVADERS', W / 2, 222);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '20px monospace';
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
  ctx.font = '16px monospace';
  ctx.fillText(`${loaded} / ${total}`, W / 2, 366);

  ctx.textAlign = 'left';
}

export function renderMenuScreen(ctx: CanvasRenderingContext2D, highScore: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 50px monospace';
  ctx.fillText('POKEMON', W / 2, 158);

  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 50px monospace';
  ctx.fillText('INVADERS', W / 2, 214);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '20px monospace';
  ctx.fillText('← → pour bouger', W / 2, 308);
  ctx.fillText('ESPACE pour lancer une Pokéball', W / 2, 342);

  if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('— APPUYER SUR ENTRÉE —', W / 2, 426);
  }

  if (highScore > 0) {
    ctx.fillStyle = '#ffff00';
    ctx.font = '18px monospace';
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
    ctx.font = 'bold 54px monospace';
    ctx.fillText('VICTOIRE !', W / 2, H / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('Tu as terminé les 17 niveaux !', W / 2, H / 2 + 10);

    ctx.fillStyle = '#00ff44';
    ctx.font = '18px monospace';
    ctx.fillText('Félicitations, Flavien !', W / 2, H / 2 + 50);
  } else {
    ctx.fillStyle = '#ffff44';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('NIVEAU', W / 2, H / 2 - 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px monospace';
    ctx.fillText(String(nextLevel), W / 2, H / 2 + 10);

    if (nextLevel === MAX_LEVELS) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('DERNIER NIVEAU !', W / 2, H / 2 + 58);
    }

    // Type objective
    const typeColor    = TYPE_COLORS[levelType] ?? '#ffffff';
    const typeLabel    = TYPE_LABELS[levelType] ?? levelType;
    const correctTotal = Math.round(ENEMY_COLS * ENEMY_ROWS * (1 - WRONG_TYPE_RATIO));
    const toCatch      = correctTotal - Math.floor(correctTotal * (1 - LEVEL_CLEAR_RATIO));
    const typeY        = nextLevel === MAX_LEVELS ? H / 2 + 88 : H / 2 + 70;
    ctx.fillStyle = typeColor;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Attrape ${toCatch} Pokémon ${typeLabel} !`, W / 2, typeY);

    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
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
  ctx.font = 'bold 42px monospace';
  ctx.fillText('JOYEUX ANNIVERSAIRE', W / 2, 130);

  ctx.fillStyle = '#ffff44';
  ctx.font = 'bold 60px monospace';
  ctx.fillText('FLAVIEN !', W / 2, 200);

  ctx.fillStyle = '#00ff44';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('17 ANS !', W / 2, 258);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '20px monospace';
  ctx.fillText(`Score final : ${score}`, W / 2, 320);
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ffff44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('★ NOUVEAU RECORD ★', W / 2, 350);
  }

  if (delay > VICTORY_DELAY_MS) {
    if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('[ ENTRÉE ]  Rejouer en MODE HARD', W / 2, 430);
      ctx.fillStyle = '#888888';
      ctx.font = '16px monospace';
      ctx.fillText('[ ÉCHAP ]  Retour au menu', W / 2, 462);
    }
  }

  ctx.textAlign = 'left';
}

// ── Interlude screen (personal message + optional photo) ──────────────────────
export function renderInterludeScreen(ctx: CanvasRenderingContext2D, message: string, image: HTMLImageElement | null): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  if (image && image.complete && image.naturalWidth > 0) {
    const maxW = W * 0.72, maxH = H * 0.52;
    const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    ctx.drawImage(image, W / 2 - iw / 2, 40, iw, ih);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  wrapText(ctx, message, W / 2, H * 0.74, W - 80, 28);

  if (Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#00ff44';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('[ ENTRÉE pour continuer ]', W / 2, H - 24);
  }

  ctx.textAlign = 'left';
}

export function renderGameOverScreen(ctx: CanvasRenderingContext2D, score: number, highScore: number, level: number, delay: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 54px monospace';
  ctx.fillText('GAME OVER', W / 2, 210);

  ctx.fillStyle = '#ffff00';
  ctx.font = '24px monospace';
  ctx.fillText(`Capturés : ${score}`, W / 2, 296);

  ctx.fillStyle = '#aaffaa';
  ctx.font = '22px monospace';
  ctx.fillText(`Meilleur : ${highScore}`, W / 2, 336);
  ctx.fillText(`Niveau atteint : ${level}`, W / 2, 374);

  if (delay > GAMEOVER_DELAY_MS && Math.floor(Date.now() / MENU_BLINK_MS) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('ENTRÉE pour rejouer', W / 2, 452);
  }

  ctx.textAlign = 'left';
}
