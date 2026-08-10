import { describe, expect, it, vi } from 'vitest';
import { drawChapter01TopViewSprite } from './chapter01TopViewSprite';

describe('Chapter 01 guard sprite renderer', () => {
  it('draws four 64x80 frames at native scale with visible feet on the requested baseline', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 256, naturalHeight: 80 };

    (['down', 'left', 'right', 'up'] as const).forEach((facing, index) => {
      expect(drawChapter01TopViewSprite(context, image, { x: 300, y: 260 }, facing)).toBe(true);
      expect(drawImage).toHaveBeenLastCalledWith(image, index * 64, 0, 64, 80, 268, 184, 64, 80);
    });
    expect(context.imageSmoothingEnabled).toBe(false);
  });

  it('falls back until the exact four-frame sheet is loaded', () => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    expect(drawChapter01TopViewSprite(context, null, { x: 0, y: 0 }, 'down')).toBe(false);
    expect(drawChapter01TopViewSprite(context, { complete: false, naturalWidth: 256, naturalHeight: 80 }, { x: 0, y: 0 }, 'down')).toBe(false);
    expect(drawChapter01TopViewSprite(context, { complete: true, naturalWidth: 255, naturalHeight: 80 }, { x: 0, y: 0 }, 'down')).toBe(false);
  });
});
