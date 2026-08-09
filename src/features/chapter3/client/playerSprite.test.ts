import { describe, expect, it, vi } from 'vitest';
import { drawPlayerSprite, facingFromMovement, PLAYER_SPRITE_FRAME_HEIGHT, PLAYER_SPRITE_FRAME_WIDTH, PLAYER_SPRITE_TOP_OVERHANG } from './playerSprite';

describe('Chapter03 player sprite', () => {
  it('selects a four-direction frame and keeps the last facing while stopped', () => {
    expect(facingFromMovement(0, -1, 'down')).toBe('up');
    expect(facingFromMovement(0, 1, 'up')).toBe('down');
    expect(facingFromMovement(-1, 0, 'down')).toBe('left');
    expect(facingFromMovement(1, 0, 'left')).toBe('right');
    expect(facingFromMovement(0, 0, 'right')).toBe('right');
    expect(facingFromMovement(1, -1, 'down')).toBe('up');
  });

  it('draws the selected frame with its feet aligned to the collision box', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 128, naturalHeight: 40 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, 'right')).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      PLAYER_SPRITE_FRAME_WIDTH * 2,
      0,
      PLAYER_SPRITE_FRAME_WIDTH,
      PLAYER_SPRITE_FRAME_HEIGHT,
      77,
      236,
      PLAYER_SPRITE_FRAME_WIDTH,
      PLAYER_SPRITE_FRAME_HEIGHT,
    );
    expect(250 - 236 - 4).toBe(PLAYER_SPRITE_TOP_OVERHANG);
  });

  it('waits for the complete sprite sheet before drawing', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: false, naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, 'down')).toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });
});
