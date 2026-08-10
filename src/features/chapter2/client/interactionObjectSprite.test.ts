import { describe, expect, it, vi } from 'vitest';
import { drawInteractionObject, OBJECT_SHEET_CELL_SIZE } from './interactionObjectSprite';

describe('Chapter 2 interaction object sprites', () => {
  it('maps every interaction asset to its row-major cell', () => {
    const cases = [
      ['cctv', 0], ['family-photo', 1], ['presence', 2], ['toy', 3],
      ['memory-school', 4], ['memory-market', 5], ['memory-table', 6], ['archive-exit', 7],
      ['window-console', 8], ['duty-log', 9],
    ] as const;
    for (const [asset, index] of cases) {
      const drawImage = vi.fn();
      const context = { drawImage, imageSmoothingEnabled: true, globalAlpha: 1 } as unknown as CanvasRenderingContext2D;
      const image = { complete: true, naturalWidth: 1448, naturalHeight: 1086 } as HTMLImageElement;
      expect(drawInteractionObject(context, image, {
        asset, position: { x: 480, y: 240 }, width: 48, height: 54,
      })).toBe(true);
      expect(drawImage.mock.calls[0]?.slice(1, 5)).toEqual([
        index % 4 * OBJECT_SHEET_CELL_SIZE, Math.floor(index / 4) * OBJECT_SHEET_CELL_SIZE,
        OBJECT_SHEET_CELL_SIZE, OBJECT_SHEET_CELL_SIZE,
      ]);
      expect(context.imageSmoothingEnabled).toBe(false);
    }
  });

  it('dims completed objects, restores alpha, and falls back on a wrong sheet', () => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true, globalAlpha: 0.8 } as unknown as CanvasRenderingContext2D;
    const visual = { asset: 'toy' as const, position: { x: 100, y: 100 }, width: 48, height: 42 };
    expect(drawInteractionObject(context, { complete: true, naturalWidth: 1448, naturalHeight: 1086 }, visual, true)).toBe(true);
    expect(context.globalAlpha).toBe(0.8);
    expect(drawInteractionObject(context, { complete: true, naturalWidth: 1024, naturalHeight: 768 }, visual)).toBe(false);
  });
});
