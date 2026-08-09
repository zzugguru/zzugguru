import { distance, type Vector2 } from './vector';

export function isWithinRange(a: Vector2, b: Vector2, radius: number): boolean {
  return distance(a, b) <= radius;
}
