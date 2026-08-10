import { describe, expect, it, vi } from 'vitest';
import { drawInteractionObject, OBJECT_SHEET_CELL_SIZE } from './interactionObjectSprite';

describe('Chapter 3 interaction object sprites', () => {
  it('maps reconstruction, memory, archive, and door frames across the sheet', () => {
    const cases = [
      ['reconstruction-device', 0], ['photo', 1], ['market', 2], ['tool', 3],
      ['lens', 4], ['bowl', 5], ['archive-photo', 6], ['archive-voice', 7],
      ['archive-tool', 8], ['archive-star', 9], ['archive-table', 10], ['archive-door', 11],
    ] as const;
    for (const [asset, index] of cases) {
      const drawImage = vi.fn();
      const context = { drawImage, imageSmoothingEnabled: true, globalAlpha: 1 } as unknown as CanvasRenderingContext2D;
      const image = { complete: true, naturalWidth: 1448, naturalHeight: 1086 } as HTMLImageElement;
      expect(drawInteractionObject(context, image, asset, { x: 100, y: 100 }, { width: 50, height: 60 })).toBe(true);
      expect(drawImage.mock.calls[0]?.slice(1, 5)).toEqual([
        index % 4 * OBJECT_SHEET_CELL_SIZE, Math.floor(index / 4) * OBJECT_SHEET_CELL_SIZE,
        OBJECT_SHEET_CELL_SIZE, OBJECT_SHEET_CELL_SIZE,
      ]);
      expect(context.imageSmoothingEnabled).toBe(false);
    }
  });

  it('dims placed records, restores alpha, and preserves fallback behavior', () => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true, globalAlpha: 0.75 } as unknown as CanvasRenderingContext2D;
    expect(drawInteractionObject(context, { complete: true, naturalWidth: 1448, naturalHeight: 1086 },
      'archive-star', { x: 100, y: 100 }, { width: 58, height: 64 }, true)).toBe(true);
    expect(context.globalAlpha).toBe(0.75);
    expect(drawInteractionObject(context, { complete: false, naturalWidth: 0, naturalHeight: 0 },
      'archive-star', { x: 100, y: 100 }, { width: 58, height: 64 })).toBe(false);
  });
});
