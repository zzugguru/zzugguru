import { describe, expect, it, vi } from 'vitest';
import { drawMemoryRoomBackground } from './memoryRoomBackground';

describe('Chapter03 memory room background', () => {
  it('draws a loaded image across the logical canvas without smoothing', () => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 1536 };

    expect(drawMemoryRoomBackground(context, image)).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 960, 540);
  });

  it.each([
    { complete: false, naturalWidth: 1536 },
    { complete: true, naturalWidth: 0 },
  ])('keeps the fallback for an unavailable image: %o', (image) => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;

    expect(drawMemoryRoomBackground(context, image)).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});
