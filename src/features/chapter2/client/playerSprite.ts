import type { Direction } from '../shared/movement';
import type { Vector2 } from '../shared/vector';
import { MAP_PLAYER_COLLISION_SIZE, MAP_PLAYER_VISIBLE_EXTENTS } from '../shared/mapMovement';

export const PLAYER_FRAME_WIDTH = 64;
export const PLAYER_FRAME_HEIGHT = 80;
export const PLAYER_COLLISION_SIZE = MAP_PLAYER_COLLISION_SIZE;
export const PLAYER_VISIBLE_EXTENTS = MAP_PLAYER_VISIBLE_EXTENTS;

export type Facing = 'down' | 'left' | 'right' | 'up';

export function facingFromDirection(direction: Direction, current: Facing): Facing {
  if (direction.down) return 'down';
  if (direction.up) return 'up';
  if (direction.left) return 'left';
  if (direction.right) return 'right';
  return current;
}

export function frameIndexForFacing(facing: Facing): number {
  return { down: 0, left: 1, right: 2, up: 3 }[facing];
}

export function drawPlayer(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth' | 'naturalHeight'> | null,
  position: Vector2,
  facing: Facing,
): boolean {
  if (
    !image?.complete ||
    image.naturalWidth !== PLAYER_FRAME_WIDTH * 4 ||
    image.naturalHeight !== PLAYER_FRAME_HEIGHT
  ) return false;

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image as CanvasImageSource,
    frameIndexForFacing(facing) * PLAYER_FRAME_WIDTH,
    0,
    PLAYER_FRAME_WIDTH,
    PLAYER_FRAME_HEIGHT,
    position.x - PLAYER_FRAME_WIDTH / 2,
    position.y + PLAYER_COLLISION_SIZE / 2 - 76,
    PLAYER_FRAME_WIDTH,
    PLAYER_FRAME_HEIGHT,
  );
  return true;
}
