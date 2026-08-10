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

const SPEED_PER_SECOND = 160;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function isAllowed(position: Vector2, floor: Rect, collisions: readonly Rect[]): boolean {
  const visible = {
    x: position.x - MAP_PLAYER_VISIBLE_EXTENTS.left,
    y: position.y - MAP_PLAYER_VISIBLE_EXTENTS.top,
    width: MAP_PLAYER_VISIBLE_EXTENTS.left + MAP_PLAYER_VISIBLE_EXTENTS.right,
    height: MAP_PLAYER_VISIBLE_EXTENTS.top + MAP_PLAYER_VISIBLE_EXTENTS.bottom,
  };
  const visibleInside =
    position.x - MAP_PLAYER_VISIBLE_EXTENTS.left >= floor.x &&
    position.x + MAP_PLAYER_VISIBLE_EXTENTS.right <= floor.x + floor.width &&
    position.y - MAP_PLAYER_VISIBLE_EXTENTS.top >= floor.y &&
    position.y + MAP_PLAYER_VISIBLE_EXTENTS.bottom <= floor.y + floor.height;
  return visibleInside && !collisions.some((collision) => overlaps(visible, collision));
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
