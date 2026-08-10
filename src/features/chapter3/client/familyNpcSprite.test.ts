import { describe, expect, it, vi } from 'vitest';
import {
  drawFamilyNpcSprite,
  familyNpcAssetPath,
  familyNpcDestination,
  FAMILY_NPC_FRAME_HEIGHT,
  FAMILY_NPC_FRAME_WIDTH,
} from './familyNpcSprite';

describe('Chapter03 family NPC sprite', () => {
  it('aligns visible feet to the existing family marker baseline at native scale', () => {
    expect(familyNpcDestination({ centerX: 602, feetY: 395 })).toEqual({
      x: 570,
      y: 319,
      width: 64,
      height: 80,
    });
  });

  it('draws a valid asset without smoothing', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 64, naturalHeight: 80 } as HTMLImageElement;

    expect(drawFamilyNpcSprite(context, image, { centerX: 602, feetY: 395 })).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(image, 570, 319, FAMILY_NPC_FRAME_WIDTH, FAMILY_NPC_FRAME_HEIGHT);
  });

  it.each([
    { complete: false, naturalWidth: 64, naturalHeight: 80 },
    { complete: true, naturalWidth: 63, naturalHeight: 80 },
    { complete: true, naturalWidth: 64, naturalHeight: 79 },
  ])('uses fallback when the image is unavailable or malformed: %o', (image) => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;

    expect(drawFamilyNpcSprite(context, image as HTMLImageElement, { centerX: 602, feetY: 395 })).toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('resolves all three Chapter 3 asset imports', () => {
    expect(['wife', 'son', 'daughter'].map((id) => familyNpcAssetPath(id as 'wife' | 'son' | 'daughter')))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('family-wife.png'),
        expect.stringContaining('family-son.png'),
        expect.stringContaining('family-daughter.png'),
      ]));
  });
});
