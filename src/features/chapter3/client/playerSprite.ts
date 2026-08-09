import { PLAYER_SIZE, type Point } from '../shared/mapLogic';

export { PLAYER_SPRITE_TOP_OVERHANG } from '../shared/mapLogic';

export type PlayerFacing = 'down' | 'left' | 'right' | 'up';

export const PLAYER_SPRITE_FRAME_WIDTH = 32;
export const PLAYER_SPRITE_FRAME_HEIGHT = 40;
const FRAME_INDEX: Readonly<Record<PlayerFacing, number>> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

export function facingFromMovement(dx: number, dy: number, current: PlayerFacing): PlayerFacing {
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  return dx < 0 ? 'left' : 'right';
}

export function drawPlayerSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  position: Point,
  facing: PlayerFacing,
): boolean {
  if (!image.complete || image.naturalWidth < PLAYER_SPRITE_FRAME_WIDTH * 4 || image.naturalHeight < PLAYER_SPRITE_FRAME_HEIGHT) return false;

  const sourceX = FRAME_INDEX[facing] * PLAYER_SPRITE_FRAME_WIDTH;
  const destinationX = Math.round(position.x + (PLAYER_SIZE - PLAYER_SPRITE_FRAME_WIDTH) / 2);
  const destinationY = Math.round(position.y + PLAYER_SIZE - PLAYER_SPRITE_FRAME_HEIGHT);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    sourceX,
    0,
    PLAYER_SPRITE_FRAME_WIDTH,
    PLAYER_SPRITE_FRAME_HEIGHT,
    destinationX,
    destinationY,
    PLAYER_SPRITE_FRAME_WIDTH,
    PLAYER_SPRITE_FRAME_HEIGHT,
  );
  return true;
}
