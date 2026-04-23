import { W, H, MENU_BLINK_MS, GAMEOVER_DELAY_MS, LEVEL_UP_MS } from './constants.js';

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

export function renderLevelUpScreen(ctx: CanvasRenderingContext2D, nextLevel: number, timer: number): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Fade in then hold
  const alpha = Math.min(1, timer / 300);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#ffff44';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('NIVEAU', W / 2, H / 2 - 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 90px monospace`;
  ctx.fillText(String(nextLevel), W / 2, H / 2 + 50);

  ctx.globalAlpha = 1;
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
