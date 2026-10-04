import { displayName, finishersOf, startersOf, type LineupData } from '@/utils/lineup';

export const LINEUP_W = 1080;
export const LINEUP_H = 1350;

// Athletic stack — loaded via Google Fonts on the page (Anton + Teko +
// Barlow Condensed + Oswald), with heavy system fallbacks for canvas export.
const DISPLAY = '"Anton", "Arial Black", Impact, sans-serif';
const NAME_FONT = '"Teko", "Barlow Condensed", "Arial Narrow", sans-serif';
const CONDENSED = '"Barlow Condensed", "Oswald", "Arial Narrow", Impact, sans-serif';
const NUMBER_FONT = '"Oswald", "Arial Narrow", Impact, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Diagonal wash running top-left (light) to bottom-right (dark).
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#1c4f9c');
  g.addColorStop(0.45, '#12367a');
  g.addColorStop(1, '#061a45');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Subtle diagonal light wash (like the reference's soft sheen)
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-18 * Math.PI) / 180);
  const sheen = ctx.createLinearGradient(-w, 0, w, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.restore();

  // Soft vignette top/bottom for text legibility
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(0,10,40,0.38)');
  v.addColorStop(0.25, 'rgba(0,10,40,0)');
  v.addColorStop(0.72, 'rgba(0,10,40,0)');
  v.addColorStop(1, 'rgba(0,5,25,0.6)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawDivisionBadge(ctx: CanvasRenderingContext2D, division: string) {
  // Oversized eyebrow label, tilted to match the title card — no box, no border.
  ctx.save();
  ctx.translate(120, 92);
  ctx.rotate((-4 * Math.PI) / 180);
  const label = (division || 'D1').toUpperCase();
  ctx.font = `400 72px ${DISPLAY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, home: string, away: string, subtitle: string) {
  const cx = LINEUP_W / 2;
  const cy = 272;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  const boxW = 800;
  const boxH = 320;
  roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 6);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  const homeLine = (home || 'ROCKY GORGE').toUpperCase();
  const awayLine = (away || 'WASHINGTON IRISH').toUpperCase();
  ctx.fillStyle = '#ffffff';
  let size = 92;
  ctx.font = `${size}px ${DISPLAY}`;
  while (ctx.measureText(homeLine).width > boxW - 70 && size > 30) {
    size -= 4;
    ctx.font = `${size}px ${DISPLAY}`;
  }
  ctx.fillText(homeLine, 0, -108);
  ctx.font = `italic 600 36px ${CONDENSED}`;
  ctx.fillText('V.', 0, -38);
  size = 78;
  ctx.font = `${size}px ${DISPLAY}`;
  while (ctx.measureText(awayLine).width > boxW - 70 && size > 28) {
    size -= 4;
    ctx.font = `${size}px ${DISPLAY}`;
  }
  ctx.fillText(awayLine, 0, 28);
  // Date/KO | venue rides inside the border at the same tilt, in gold.
  const sub = (subtitle || '').trim();
  if (sub) {
    ctx.fillStyle = '#f3ec9a';
    fitFont(ctx, sub, boxW - 70, 30, `italic 500 30px ${CONDENSED}`);
    ctx.fillText(sub, 0, 108);
  }
  ctx.restore();
}

// Maryland flag divider: slightly slanted blocks cycling the flag colors —
// red, white, black, gold. Flat parallelograms, no fine detail, so the strip
// reads cleanly at banner scale.
export const MARYLAND_TAPE_H = 40;
export const MARYLAND_BLOCK_W = 54;
export const MARYLAND_SLANT = 8;
export const MARYLAND_COLORS = ['#c8102e', '#ffffff', '#111111', '#ffd200'];
function drawMarylandTape(ctx: CanvasRenderingContext2D, y: number) {
  const h = MARYLAND_TAPE_H;
  ctx.save();
  // white keylines above/below like athletic tape
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y - 12, LINEUP_W, h + 24);

  // Clip so slanted end blocks don't overshoot the canvas edge.
  ctx.beginPath();
  ctx.rect(0, y, LINEUP_W, h);
  ctx.clip();
  let i = 0;
  for (let x = -MARYLAND_SLANT; x < LINEUP_W + MARYLAND_SLANT; x += MARYLAND_BLOCK_W, i++) {
    ctx.fillStyle = MARYLAND_COLORS[i % MARYLAND_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + MARYLAND_SLANT, y);
    ctx.lineTo(x + MARYLAND_BLOCK_W + MARYLAND_SLANT, y);
    ctx.lineTo(x + MARYLAND_BLOCK_W, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  // thin dark rules top/bottom of tape
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, y, LINEUP_W, 3);
  ctx.fillRect(0, y + h - 3, LINEUP_W, 3);
  ctx.restore();
}

export interface SponsorLogo {
  element: HTMLImageElement;
}

export const SPONSOR_MAX = 4;
export const SPONSOR_PILL_W = 280;
export const SPONSOR_PILL_H = 110;
export const SPONSOR_GAP = 30;
export const SPONSOR_PAD = 16;

/** Contain-fit dimensions preserving aspect ratio. Pure — unit tested. */
export function fitContain(iw: number, ih: number, maxW: number, maxH: number): { w: number; h: number } {
  if (iw <= 0 || ih <= 0 || maxW <= 0 || maxH <= 0) return { w: 0, h: 0 };
  const scale = Math.min(maxW / iw, maxH / ih);
  return { w: Math.round(iw * scale), h: Math.round(ih * scale) };
}

/** Horizontal layout for N uniform sponsor pills, centered. Pure — unit tested. */
export function sponsorPillPositions(count: number): number[] {
  const n = Math.max(0, Math.min(SPONSOR_MAX, count));
  if (n === 0) return [];
  const totalW = n * SPONSOR_PILL_W + (n - 1) * SPONSOR_GAP;
  const startX = Math.round((LINEUP_W - totalW) / 2);
  return Array.from({ length: n }, (_, i) => startX + i * (SPONSOR_PILL_W + SPONSOR_GAP));
}

function drawSponsors(ctx: CanvasRenderingContext2D, sponsors: SponsorLogo[]) {
  const ready = sponsors.filter(
    (s) => s?.element && s.element.naturalWidth > 0 && s.element.naturalHeight > 0
  ).slice(0, SPONSOR_MAX);
  if (ready.length === 0) return;
  const xs = sponsorPillPositions(ready.length);
  const y = LINEUP_H - 160;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ready.forEach((_, i) => {
    const x = xs[i];
    // uniform white pill behind every logo so mixed artwork reads on navy
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, SPONSOR_PILL_W, SPONSOR_PILL_H, 14);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ready.forEach((s, i) => {
    const x = xs[i];
    const iw = s.element.naturalWidth;
    const ih = s.element.naturalHeight;
    const innerW = SPONSOR_PILL_W - SPONSOR_PAD * 2;
    const innerH = SPONSOR_PILL_H - SPONSOR_PAD * 2;
    const { w, h } = fitContain(iw, ih, innerW, innerH);
    if (w === 0 || h === 0) return;
    const dx = x + (SPONSOR_PILL_W - w) / 2;
    const dy = y + (SPONSOR_PILL_H - h) / 2;
    ctx.drawImage(s.element, dx, dy, w, h);
  });
  ctx.restore();
}
/** Uniform fit: largest size where EVERY label fits maxWidth. Keeps roster rows even. */
export function uniformFitSize(
  ctx: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>,
  labels: string[],
  maxWidth: number,
  base: number,
  style = `italic 700 ${base}px ${CONDENSED}`
): number {
  const prefix = style.replace(/\d+px.*$/, '');
  const suffix = style.replace(/^.*\d+px\s*/, '');
  let size = base;
  while (size > 12) {
    ctx.font = `${prefix}${size}px ${suffix}`;
    const widest = labels.reduce((m, t) => Math.max(m, ctx.measureText(t).width), 0);
    if (widest <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// Starter grid geometry (symmetric around canvas center 540):
// left names right-aligned ending at 440 | numbers centered at 492/588 |
// right names left-aligned starting at 640 — 52px name-to-number padding both sides.
export const STARTER_NAME_X_LEFT = 440;
export const STARTER_NUM_X_LEFT = 492;
export const STARTER_NUM_X_RIGHT = 588;
export const STARTER_NAME_X_RIGHT = 640;
export const STARTER_NAME_MAX_W = 340;
export const STARTER_ROW_H = 56;
export const STARTER_FIRST_CENTER_Y = 500;
export const STARTER_BASE_SIZE = 34;
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  base: number,
  style = `italic 700 ${base}px ${CONDENSED}`
) {
  const prefix = style.replace(/\d+px.*$/, '');
  const suffix = style.replace(/^.*\d+px\s*/, '');
  let size = base;
  ctx.font = `${prefix}${size}px ${suffix}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 1;
    ctx.font = `${prefix}${size}px ${suffix}`;
  }
  return size;
}

export function drawLineup(
  ctx: CanvasRenderingContext2D,
  data: LineupData,
  sponsors: SponsorLogo[] = []
) {
  const w = LINEUP_W;
  ctx.clearRect(0, 0, w, LINEUP_H);
  drawBackground(ctx, w, LINEUP_H);
  drawDivisionBadge(ctx, data.division);

  drawTitleBlock(ctx, data.homeTeam, data.awayTeam, data.subtitle);

  const starters = startersOf(data.players);
  const left = starters.filter((p) => p.number <= 8);
  const right = starters.filter((p) => p.number >= 9);

  // One shared name size across ALL rows + middle baselines on row centers,
  // so digits and names sit on an even rhythm instead of drifting per row.
  const nameLabels = starters.map((p) => displayName(p));
  const nameSize = uniformFitSize(
    ctx,
    nameLabels,
    STARTER_NAME_MAX_W,
    STARTER_BASE_SIZE,
    `600 ${STARTER_BASE_SIZE}px ${NAME_FONT}`
  );
  const nameFont = `600 ${nameSize}px ${NAME_FONT}`;
  const numberFont = `700 ${STARTER_BASE_SIZE}px ${NUMBER_FONT}`;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  left.forEach((p, idx) => {
    const y = STARTER_FIRST_CENTER_Y + idx * STARTER_ROW_H;
    ctx.textAlign = 'right';
    ctx.font = nameFont;
    ctx.fillText(displayName(p), STARTER_NAME_X_LEFT, y);
    ctx.textAlign = 'center';
    ctx.font = numberFont;
    ctx.fillText(String(p.number), STARTER_NUM_X_LEFT, y);
  });

  right.forEach((p, idx) => {
    const y = STARTER_FIRST_CENTER_Y + idx * STARTER_ROW_H;
    ctx.textAlign = 'center';
    ctx.font = numberFont;
    ctx.fillText(String(p.number), STARTER_NUM_X_RIGHT, y);
    ctx.textAlign = 'left';
    ctx.font = nameFont;
    ctx.fillText(displayName(p), STARTER_NAME_X_RIGHT, y);
  });
  ctx.restore();

  const tapeY = STARTER_FIRST_CENTER_Y + 7 * STARTER_ROW_H + STARTER_ROW_H / 2 + 24;
  drawMarylandTape(ctx, tapeY);

  // Finishers: wrapped centered lines, ~3 per row
  const finishers = finishersOf(data.players);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  const groups: string[] = [];
  if (finishers.length > 0) {
    const tokens = finishers.map((p) => `${p.number} ${displayName(p)}`);
    for (let k = 0; k < tokens.length; k += 3) {
      groups.push(tokens.slice(k, k + 3).join('  -  '));
    }
  } else {
    groups.push('16  -  17  -  18');
  }
  let fy = tapeY + 112;
  groups.forEach((line) => {
    fitFont(ctx, line, w - 140, 29, `italic 700 29px ${CONDENSED}`);
    ctx.fillText(line, w / 2, fy);
    fy += 46;
  });
  ctx.restore();

  // Sponsor logos (user-uploaded, uniform pills). Empty → clean footer.
  drawSponsors(ctx, sponsors);
}
