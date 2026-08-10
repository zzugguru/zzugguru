import type { Direction } from './movement';
import type { Vector2 } from './vector';
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MAP_PLAYER_COLLISION_SIZE = 24;
export const MAP_PLAYER_VISIBLE_EXTENTS = { left: 18, right: 18, top: 56, bottom: 12 } as const;
export const MAP_PLAYER_COLLISION_HALF = MAP_PLAYER_COLLISION_SIZE / 2;

const SPEED_PER_SECOND = 160;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function isAllowed(position: Vector2, floor: Rect, collisions: readonly Rect[]): boolean {
  const feet = {
    x: position.x - MAP_PLAYER_COLLISION_HALF,
    y: position.y - MAP_PLAYER_COLLISION_HALF,
    width: MAP_PLAYER_COLLISION_SIZE,
    height: MAP_PLAYER_COLLISION_SIZE,
  };
  const feetInside =
    feet.x >= floor.x &&
    feet.x + feet.width <= floor.x + floor.width &&
    feet.y >= floor.y &&
    feet.y + feet.height <= floor.y + floor.height;
  return feetInside && !collisions.some((collision) => overlaps(feet, collision));
}

export function moveMapPlayer(
  position: Vector2,
  direction: Direction,
  deltaSeconds: number,
  floor: Rect,
  collisions: readonly Rect[],
): Vector2 {
  let dx = Number(direction.right) - Number(direction.left);
  let dy = Number(direction.down) - Number(direction.up);
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  const distance = SPEED_PER_SECOND * deltaSeconds;
  const afterX = { x: position.x + dx * distance, y: position.y };
  const xPosition = isAllowed(afterX, floor, collisions) ? afterX : position;
  const afterY = { x: xPosition.x, y: position.y + dy * distance };
  return isAllowed(afterY, floor, collisions) ? afterY : xPosition;
}

export function isPositionAllowed(position: Vector2, floor: Rect, collisions: readonly Rect[]): boolean {
  return isAllowed(position, floor, collisions);
}
