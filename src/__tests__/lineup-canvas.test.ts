import { describe, expect, it } from 'vitest';
import {
  LINEUP_W,
  SPONSOR_GAP,
  SPONSOR_MAX,
  SPONSOR_PILL_W,
  STARTER_NAME_X_LEFT,
  STARTER_NAME_X_RIGHT,
  STARTER_NUM_X_LEFT,
  STARTER_NUM_X_RIGHT,
  fitContain,
  sponsorPillPositions,
  uniformFitSize,
} from '@/components/LineupGraphic/drawLineup';

type FitCtx = Pick<CanvasRenderingContext2D, 'font' | 'measureText'>;

// Fake 2d context whose text width scales with the currently-set font size,
// like a real canvas (0.5 * px per char).
function fakeCtx() {
  const ctx = {
    font: '',
    measureText: (text: string) => {
      const px = Number(ctx.font.match(/(\d+)px/)?.[1] ?? 34);
      return { width: text.length * px * 0.5 };
    },
  };
  return ctx as unknown as FitCtx;
}

describe('fitContain', () => {
  it('fits wide and tall images inside the box preserving aspect', () => {
    expect(fitContain(400, 100, 200, 100)).toEqual({ w: 200, h: 50 });
    expect(fitContain(100, 400, 200, 100)).toEqual({ w: 25, h: 100 });
  });

  it('rejects empty dimensions', () => {
    expect(fitContain(0, 100, 200, 100)).toEqual({ w: 0, h: 0 });
  });
});

describe('sponsorPillPositions', () => {
  it('centers uniform pills with even gutters', () => {
    const xs = sponsorPillPositions(2);
    expect(xs).toHaveLength(2);
    expect(xs[1] - xs[0]).toBe(SPONSOR_PILL_W + SPONSOR_GAP);
    const totalW = 2 * SPONSOR_PILL_W + SPONSOR_GAP;
    expect(xs[0]).toBe(Math.round((LINEUP_W - totalW) / 2));
  });

  it('caps at SPONSOR_MAX and empties at zero', () => {
    expect(sponsorPillPositions(0)).toEqual([]);
    expect(sponsorPillPositions(99)).toHaveLength(SPONSOR_MAX);
  });
});

describe('uniformFitSize', () => {
  it('sizes to the longest label so every row matches', () => {
    // 8 chars * size * 0.5 <= 100 → size 25
    expect(uniformFitSize(fakeCtx(), ['AB', 'ABCDEFGH'], 100, 34)).toBe(25);
  });

  it('keeps base size when everything fits', () => {
    expect(uniformFitSize(fakeCtx(), ['AB', 'CD'], 380, 34)).toBe(34);
  });

  it('starter number gutter stays symmetric around canvas center', () => {
    const gutterMid = STARTER_NUM_X_LEFT + (STARTER_NUM_X_RIGHT - STARTER_NUM_X_LEFT) / 2;
    expect(gutterMid).toBe(LINEUP_W / 2);
  });

  it('name-to-number padding is uniform on both sides', () => {
    expect(STARTER_NUM_X_LEFT - STARTER_NAME_X_LEFT).toBe(
      STARTER_NAME_X_RIGHT - STARTER_NUM_X_RIGHT
    );
    expect(STARTER_NAME_X_LEFT + (STARTER_NAME_X_RIGHT - STARTER_NAME_X_LEFT) / 2).toBe(
      LINEUP_W / 2
    );
  });
});
