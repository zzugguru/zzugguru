import { describe, expect, it } from 'vitest';
import { isWithinRange } from './proximity';

describe('isWithinRange', () => {
  it('returns true when exactly at the radius boundary', () => {
    expect(isWithinRange({ x: 0, y: 0 }, { x: 10, y: 0 }, 10)).toBe(true);
  });

  it('returns true when closer than the radius', () => {
    expect(isWithinRange({ x: 0, y: 0 }, { x: 3, y: 4 }, 10)).toBe(true);
  });

  it('returns false when farther than the radius', () => {
    expect(isWithinRange({ x: 0, y: 0 }, { x: 100, y: 0 }, 10)).toBe(false);
  });
});
