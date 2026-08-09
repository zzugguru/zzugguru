import { clamp, type Vector2 } from './vector';

export interface Direction {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface Bounds {
  width: number;
  height: number;
}

const SPEED_PER_SECOND = 160;

export function step(
  position: Vector2,
  direction: Direction,
  bounds: Bounds,
  deltaSeconds: number,
): Vector2 {
  let dx = 0;
  let dy = 0;

  if (direction.up) dy -= 1;
  if (direction.down) dy += 1;
  if (direction.left) dx -= 1;
  if (direction.right) dx += 1;

  if (dx !== 0 && dy !== 0) {
    const norm = Math.SQRT1_2;
    dx *= norm;
    dy *= norm;
  }

  const distance = SPEED_PER_SECOND * deltaSeconds;

  return {
    x: clamp(position.x + dx * distance, 0, bounds.width),
    y: clamp(position.y + dy * distance, 0, bounds.height),
  };
}
