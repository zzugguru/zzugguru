import { describe, expect, it, vi } from 'vitest';
import { RESCUE_TARGETS } from '../shared/rescueLogic';
import {
  ALIEN_FAMILY_FRAME_HEIGHT,
  ALIEN_FAMILY_FRAME_WIDTH,
  alienFamilyDestination,
  drawAlienFamilyNpc,
} from './alienFamilyNpcSprite';

describe('alien family NPC sprite renderer', () => {
  const father = RESCUE_TARGETS.find((target) => target.id === 'father')!;

  it('anchors a native-size frame to the fallback marker baseline', () => {
    expect(alienFamilyDestination(father)).toEqual({ x: 488, y: 200, width: 64, height: 80 });
  });

  it('draws at native scale with nearest-neighbor sampling', () => {
    const drawImage = vi.fn();
    const context = { imageSmoothingEnabled: true, drawImage } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 64, naturalHeight: 80 } as HTMLImageElement;

    expect(drawAlienFamilyNpc(context, image, father)).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(image, 488, 200, ALIEN_FAMILY_FRAME_WIDTH, ALIEN_FAMILY_FRAME_HEIGHT);
  });

  it('returns false for unavailable or malformed images so the caller keeps its fallback', () => {
    const context = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    expect(drawAlienFamilyNpc(context, { complete: false } as HTMLImageElement, father)).toBe(false);
    expect(drawAlienFamilyNpc(context, { complete: true, naturalWidth: 63, naturalHeight: 80 } as HTMLImageElement, father)).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});
