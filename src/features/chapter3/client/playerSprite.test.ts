import { describe, expect, it, vi } from 'vitest';
import { drawPlayerSprite, facingFromMovement, PLAYER_SPRITE_DISPLAY_BOTTOM_PADDING, PLAYER_SPRITE_DISPLAY_HEIGHT, PLAYER_SPRITE_DISPLAY_TOP_PADDING, PLAYER_SPRITE_DISPLAY_WIDTH, PLAYER_SPRITE_FRAME_HEIGHT, PLAYER_SPRITE_FRAME_WIDTH, PLAYER_SPRITE_TOP_OVERHANG, type PlayerFacing } from './playerSprite';

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
    const image = { complete: true, naturalWidth: 256, naturalHeight: 80 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, 'right')).toBe(true);
    expect([PLAYER_SPRITE_DISPLAY_WIDTH, PLAYER_SPRITE_DISPLAY_HEIGHT]).toEqual([48, 60]);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      PLAYER_SPRITE_FRAME_WIDTH * 2,
      0,
      PLAYER_SPRITE_FRAME_WIDTH,
      PLAYER_SPRITE_FRAME_HEIGHT,
      69,
      219,
      PLAYER_SPRITE_DISPLAY_WIDTH,
      PLAYER_SPRITE_DISPLAY_HEIGHT,
    );
    expect(PLAYER_SPRITE_DISPLAY_TOP_PADDING).toBe(6);
    expect(PLAYER_SPRITE_DISPLAY_BOTTOM_PADDING).toBe(3);
    expect(250 - (219 + PLAYER_SPRITE_DISPLAY_TOP_PADDING)).toBe(PLAYER_SPRITE_TOP_OVERHANG);
    expect(219 + PLAYER_SPRITE_DISPLAY_HEIGHT - PLAYER_SPRITE_DISPLAY_BOTTOM_PADDING).toBe(250 + 26);
  });

  it.each<[PlayerFacing, number]>([
    ['down', 0],
    ['left', 1],
    ['right', 2],
    ['up', 3],
  ])('crops the %s frame from the high-resolution sheet', (facing, frameIndex) => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 256, naturalHeight: 80 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, facing)).toBe(true);
    expect(drawImage.mock.calls[0]?.slice(1, 5)).toEqual([
      PLAYER_SPRITE_FRAME_WIDTH * frameIndex,
      0,
      PLAYER_SPRITE_FRAME_WIDTH,
      PLAYER_SPRITE_FRAME_HEIGHT,
    ]);
  });

  it('waits for the complete sprite sheet before drawing', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: false, naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, 'down')).toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('rejects the previous low-resolution sheet dimensions', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 128, naturalHeight: 40 } as HTMLImageElement;

    expect(drawPlayerSprite(context, image, { x: 80, y: 250 }, 'down')).toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });
});
