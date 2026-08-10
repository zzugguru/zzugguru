import { describe, expect, it, vi } from 'vitest';
import type { Direction } from '../shared/movement';
import {
  drawPlayer,
  facingFromDirection,
  frameIndexForFacing,
  PLAYER_COLLISION_SIZE,
  PLAYER_FRAME_HEIGHT,
  PLAYER_FRAME_WIDTH,
} from './playerSprite';

const stopped: Direction = { up: false, down: false, left: false, right: false };

describe('Chapter 2 player sprite', () => {
  it('selects all four frames and keeps the idle facing', () => {
    expect(facingFromDirection({ ...stopped, down: true }, 'up')).toBe('down');
    expect(facingFromDirection({ ...stopped, left: true }, 'down')).toBe('left');
    expect(facingFromDirection({ ...stopped, right: true }, 'left')).toBe('right');
    expect(facingFromDirection({ ...stopped, up: true }, 'right')).toBe('up');
    expect(facingFromDirection(stopped, 'up')).toBe('up');
    expect((['down', 'left', 'right', 'up'] as const).map(frameIndexForFacing)).toEqual([0, 1, 2, 3]);
  });

  it('draws the native frame without smoothing and aligns visible feet to the old player baseline', () => {
    const drawImage = vi.fn();
    const context = { drawImage, imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 256, naturalHeight: 80 } as HTMLImageElement;

    expect(drawPlayer(context, image, { x: 480, y: 300 }, 'right')).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      128,
      0,
      PLAYER_FRAME_WIDTH,
      PLAYER_FRAME_HEIGHT,
      448,
      236,
      64,
      80,
    );
    expect(236 + 76).toBe(300 + PLAYER_COLLISION_SIZE / 2);
  });

  it('falls back until the exact shared sprite sheet is ready', () => {
    const context = { drawImage: vi.fn(), imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D;
    expect(drawPlayer(context, null, { x: 0, y: 0 }, 'down')).toBe(false);
    expect(drawPlayer(context, { complete: true, naturalWidth: 128, naturalHeight: 40 }, { x: 0, y: 0 }, 'down')).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});
