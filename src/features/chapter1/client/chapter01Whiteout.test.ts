import { describe, expect, it } from 'vitest';
import { getChapter01WhiteoutPresentation } from './chapter01Whiteout';

describe('Chapter 01 whiteout continuity', () => {
  it('keeps the character fixed on screen 41 while the interference moves', () => {
    const first = getChapter01WhiteoutPresentation(40, 1);
    const later = getChapter01WhiteoutPresentation(40, 1.05);

    expect(first.character).toEqual({ x: 480, y: 212, opacity: 0.62 });
    expect(later.character).toEqual(first.character);
    expect([later.scanlineOffset, later.tearOffset]).not.toEqual([first.scanlineOffset, first.tearOffset]);
  });

  it('continues the same static silhouette and strengthens the glitch on screen 42', () => {
    const screen41 = getChapter01WhiteoutPresentation(40, 2.4);
    const screen42 = getChapter01WhiteoutPresentation(41, 2.4);

    expect(screen42.character).toMatchObject({ x: screen41.character?.x, y: screen41.character?.y });
    expect(screen42.glitchIntensity).toBeGreaterThan(screen41.glitchIntensity);
    expect(screen42.scanlineOffset).toBe(screen41.scanlineOffset);
    expect(screen42.tearOffset).not.toBe(0);
  });
});
