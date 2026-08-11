// BURN — Roast card renderer
// Draws the shareable roast image on a <canvas> (1200x630, same ratio as an
// OG card) and offers download helpers. Uses the same fonts the site loads
// from Google Fonts (Inter / Outfit / Noto Sans Malayalam).

export interface RoastCardOptions {
  text: string;
  bucketLabel: string;
  lang: 'en' | 'ml' | 'mixed';
  moodMeter?: number;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

const TEXT_MAX_WIDTH = DEFAULT_WIDTH - 2 * 72;

/** Loads the fonts the card needs so canvas text renders correctly. */
export async function ensureRoastFonts(lang: 'en' | 'ml' | 'mixed'): Promise<void> {
  const fonts = document.fonts;
  if (!fonts) return;
  try {
    await Promise.all([
      fonts.load('900 64px Outfit'),
      fonts.load('900 64px Inter'),
      fonts.load('700 44px Inter'),
      fonts.load('400 44px Inter'),
      fonts.load('700 30px Inter'),
      lang === 'ml' || lang === 'mixed'
        ? fonts.load('700 44px "Noto Sans Malayalam"')
        : Promise.resolve(),
    ]);
  } catch {
    // Fonts are best-effort; canvas falls back to system fonts.
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Draws the BURN roast card onto the given canvas. */
export async function drawRoastCard(
  canvas: HTMLCanvasElement,
  options: RoastCardOptions,
): Promise<void> {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const text = options.text.trim();

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  await ensureRoastFonts(options.lang);
  const mood = typeof options.moodMeter === 'number' ? Math.min(100, Math.max(0, options.moodMeter)) : 8;

  // --- Background ---
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#16141f');
  bg.addColorStop(0.55, '#0a0a0f');
  bg.addColorStop(1, '#050507');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Glow orbs
  const glow = ctx.createRadialGradient(width * 0.85, height * 0.15, 0, width * 0.85, height * 0.15, 380);
  glow.addColorStop(0, 'rgba(255,81,72,0.16)');
  glow.addColorStop(1, 'rgba(255,81,72,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.1, height * 0.9, 0, width * 0.1, height * 0.9, 420);
  glow2.addColorStop(0, 'rgba(124,77,255,0.12)');
  glow2.addColorStop(1, 'rgba(124,77,255,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, width - 2, height - 2, 28);
  ctx.stroke();

  const left = 72;
  const right = width - 72;

  // --- Header row: BURN + കത്തൽ | badge ---
  const titleGrad = ctx.createLinearGradient(left, 0, left + 220, 0);
  titleGrad.addColorStop(0, '#ff5148');
  titleGrad.addColorStop(1, '#ff8a3d');
  ctx.font = '900 58px Outfit, Inter, sans-serif';
  ctx.fillStyle = titleGrad;
  ctx.textBaseline = 'top';
  ctx.fillText('BURN', left, 64);

  ctx.font = '400 28px "Noto Sans Malayalam", Inter, sans-serif';
  ctx.fillStyle = '#8b8b96';
  ctx.fillText('കത്തൽ', left + 175, 74);

  // Badge (right aligned)
  const badgeText = '💀 0% encouragement guaranteed';
  ctx.font = '600 22px Inter, sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 44;
  roundRect(ctx, right - badgeW, 64, badgeW, 52, 26);
  ctx.fillStyle = 'rgba(255,81,72,0.08)';
  ctx.fill();
  ctx.strokeStyle = '#3a2a3a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffb4ae';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, right - badgeW + 22, 64 + 26);

  // --- Bucket chip ---
  const chipY = 156;
  ctx.font = '600 22px Inter, sans-serif';
  const chipText = options.bucketLabel;
  const chipW = ctx.measureText(chipText).width + 44;
  roundRect(ctx, left, chipY, chipW, 48, 24);
  ctx.fillStyle = '#1c1a24';
  ctx.fill();
  ctx.strokeStyle = '#2b2836';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#d8d6e0';
  ctx.textBaseline = 'middle';
  ctx.fillText(chipText, left + 22, chipY + 24);

  // --- Roast text ---
  let fontSize = Math.max(30, 46 - Math.floor(text.length / 16));
  let roastFont =
    options.lang === 'ml' || options.lang === 'mixed'
      ? `400 ${fontSize}px "Noto Sans Malayalam", Inter, sans-serif`
      : `400 ${fontSize}px Inter, sans-serif`;
  ctx.font = roastFont;

  const textTop = chipY + 92;
  const maxTextBottom = height - 150;
  let lines = wrapText(ctx, text, TEXT_MAX_WIDTH);
  const lineHeight = fontSize * 1.4;

  // Shrink the font until the roast fits above the mood bar.
  while (lines.length * lineHeight > maxTextBottom - textTop && fontSize > 26) {
    fontSize -= 2;
    roastFont =
      options.lang === 'ml' || options.lang === 'mixed'
        ? `400 ${fontSize}px "Noto Sans Malayalam", Inter, sans-serif`
        : `400 ${fontSize}px Inter, sans-serif`;
    ctx.font = roastFont;
    lines = wrapText(ctx, text, TEXT_MAX_WIDTH);
  }

  ctx.fillStyle = '#f2f1f6';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  lines.forEach((line, i) => {
    ctx.fillText(line, left, textTop + i * lineHeight);
  });
  ctx.shadowBlur = 0;

  // --- Mood bar ---
  const moodLabelY = height - 132;
  ctx.font = '700 18px Inter, sans-serif';
  ctx.fillStyle = '#6f6c7a';
  ctx.textBaseline = 'top';
  ctx.fillText('MOOD REMAINING', left, moodLabelY);

  ctx.font = '700 18px Inter, sans-serif';
  ctx.fillStyle = '#ffb4ae';
  ctx.textAlign = 'right';
  ctx.fillText(`${mood}%`, right, moodLabelY);
  ctx.textAlign = 'left';

  const trackY = moodLabelY + 30;
  const trackW = right - left;
  roundRect(ctx, left, trackY, trackW, 10, 5);
  ctx.fillStyle = '#1c1a24';
  ctx.fill();
  const fillW = Math.max(6, (mood / 100) * trackW);
  roundRect(ctx, left, trackY, fillW, 10, 5);
  ctx.fillStyle = '#ff5148';
  ctx.fill();

  // --- Footer ---
  const footerY = height - 60;
  ctx.strokeStyle = '#23202c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, footerY - 28);
  ctx.lineTo(right, footerY - 28);
  ctx.stroke();

  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillStyle = '#6f6c7a';
  ctx.textBaseline = 'top';
  ctx.fillText('Come in a mood, leave worse.', left, footerY);

  ctx.font = '700 20px Inter, sans-serif';
  ctx.fillStyle = '#ff5148';
  ctx.textAlign = 'right';
  ctx.fillText('BURN · കത്തൽ', right, footerY);
  ctx.textAlign = 'left';
}

/** Renders the card to a PNG data URL. */
export async function roastCardToDataURL(options: RoastCardOptions): Promise<string | null> {
  const canvas = document.createElement('canvas');
  await drawRoastCard(canvas, options);
  return canvas.toDataURL('image/png');
}

/** Renders the card and triggers a PNG download. */
export async function downloadRoastCard(options: RoastCardOptions): Promise<boolean> {
  const canvas = document.createElement('canvas');
  await drawRoastCard(canvas, options);

  return new Promise<boolean>(resolve => {
    canvas.toBlob(blob => {
      if (!blob) {
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'burn-roast.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(true);
    }, 'image/png');
  });
}
