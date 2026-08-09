import { describe, expect, it } from 'vitest';
import { isMapComplete, isPlayerNearObject, type MapObject } from './mapObject';

function object(overrides: Partial<MapObject> = {}): MapObject {
  return {
    id: 'window',
    position: { x: 100, y: 100 },
    interactionRadius: 40,
    required: true,
    ...overrides,
  };
}

describe('isPlayerNearObject', () => {
  it('returns true when the player is within the interaction radius', () => {
    expect(isPlayerNearObject({ x: 120, y: 100 }, object())).toBe(true);
  });

  it('returns false when the player is outside the interaction radius', () => {
    expect(isPlayerNearObject({ x: 500, y: 500 }, object())).toBe(false);
  });
});

describe('isMapComplete', () => {
  it('is false when a required object has not been interacted with', () => {
    const objects = [object({ id: 'a', required: true }), object({ id: 'b', required: true })];
    expect(isMapComplete(objects, new Set(['a']))).toBe(false);
  });

  it('is true once every required object has been interacted with', () => {
    const objects = [object({ id: 'a', required: true }), object({ id: 'b', required: true })];
    expect(isMapComplete(objects, new Set(['a', 'b']))).toBe(true);
  });

  it('ignores optional (non-required) objects entirely', () => {
    const objects = [object({ id: 'a', required: true }), object({ id: 'b', required: false })];
    expect(isMapComplete(objects, new Set(['a']))).toBe(true);
  });

  it('is true for a map with no required objects at all', () => {
    const objects = [object({ id: 'a', required: false })];
    expect(isMapComplete(objects, new Set())).toBe(true);
  });
});
