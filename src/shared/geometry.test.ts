import { describe, expect, it } from 'vitest';
import { OBJECT_COLLISION_SCALE, scaleRectFromCenter } from './geometry';

describe('shared collision geometry', () => {
  it('shrinks both axes by ten percent without moving the center', () => {
    const source = { x: 100, y: 50, width: 200, height: 80 };
    const result = scaleRectFromCenter(source);

    expect(OBJECT_COLLISION_SCALE).toBe(0.9);
    expect(result).toEqual({ x: 110, y: 54, width: 180, height: 72 });
    expect(result.x + result.width / 2).toBe(source.x + source.width / 2);
    expect(result.y + result.height / 2).toBe(source.y + source.height / 2);
  });
});
