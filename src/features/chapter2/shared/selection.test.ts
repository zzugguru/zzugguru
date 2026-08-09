import { describe, expect, it } from 'vitest';
import { cycleIndex } from './selection';

describe('cycleIndex', () => {
  it('moves forward within range', () => {
    expect(cycleIndex(0, 1, 3)).toBe(1);
  });

  it('moves backward within range', () => {
    expect(cycleIndex(1, -1, 3)).toBe(0);
  });

  it('wraps forward past the last index back to 0', () => {
    expect(cycleIndex(2, 1, 3)).toBe(0);
  });

  it('wraps backward past 0 to the last index', () => {
    expect(cycleIndex(0, -1, 3)).toBe(2);
  });

  it('stays put when length is 1', () => {
    expect(cycleIndex(0, 1, 1)).toBe(0);
    expect(cycleIndex(0, -1, 1)).toBe(0);
  });

  it('returns 0 for a non-positive length', () => {
    expect(cycleIndex(0, 1, 0)).toBe(0);
  });
});
