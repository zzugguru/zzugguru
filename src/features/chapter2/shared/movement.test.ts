import { describe, expect, it } from 'vitest';
import { step } from './movement';

const bounds = { width: 800, height: 600 };
const noDirection = { up: false, down: false, left: false, right: false };

describe('step', () => {
  it('moves right when the right direction is pressed', () => {
    const next = step({ x: 100, y: 100 }, { ...noDirection, right: true }, bounds, 1);
    expect(next.x).toBeGreaterThan(100);
    expect(next.y).toBe(100);
  });

  it('normalizes diagonal movement so it is not faster than axis movement', () => {
    const axis = step({ x: 100, y: 100 }, { ...noDirection, right: true }, bounds, 1);
    const diagonal = step({ x: 100, y: 100 }, { ...noDirection, right: true, down: true }, bounds, 1);
    const axisDistance = axis.x - 100;
    const diagonalDistance = Math.hypot(diagonal.x - 100, diagonal.y - 100);
    expect(diagonalDistance).toBeCloseTo(axisDistance, 5);
  });

  it('clamps position to stay within bounds', () => {
    const next = step({ x: 0, y: 0 }, { ...noDirection, left: true, up: true }, bounds, 1);
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });
});
