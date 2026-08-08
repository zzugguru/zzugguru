import { describe, expect, it } from 'vitest';
import { canActivateDevice, canInteract, clearDirections, createFlow, MAP_BOUNDS, movePlayer, PLAYER_SIZE, transitionFlow } from './mapLogic';

describe('Chapter03 research lab map', () => {
  it('moves freely through open floor', () => {
    expect(movePlayer({ x: 80, y: 250 }, 12, -8)).toEqual({ x: 92, y: 242 });
  });

  it('blocks map boundaries and research equipment', () => {
    expect(movePlayer({ x: MAP_BOUNDS.x, y: 250 }, -10, 0)).toEqual({ x: MAP_BOUNDS.x, y: 250 });
    expect(movePlayer({ x: 150, y: 145 }, 10, 0)).toEqual({ x: 150, y: 145 });
    expect(movePlayer({ x: MAP_BOUNDS.x + MAP_BOUNDS.width - PLAYER_SIZE, y: 250 }, 10, 0).x)
      .toBe(MAP_BOUNDS.x + MAP_BOUNDS.width - PLAYER_SIZE);
  });

  it('allows interaction only beside the reconstruction device', () => {
    expect(canInteract({ x: 650, y: 235 })).toBe(true);
    expect(canInteract({ x: 80, y: 250 })).toBe(false);
  });

  it('starts the puzzle near an unfinished device and blocks repeat activation', () => {
    expect(canActivateDevice({ x: 650, y: 235 }, false)).toBe(true);
    expect(canActivateDevice({ x: 80, y: 250 }, false)).toBe(false);
    expect(canActivateDevice({ x: 650, y: 235 }, true)).toBe(false);
  });

  it('covers map, failure retry, return, success completion, and repeat blocking', () => {
    const initial = createFlow();
    expect(transitionFlow(initial, { type: 'interact', allowed: false })).toBe(initial);
    const puzzle = transitionFlow(initial, { type: 'interact', allowed: true });
    const failure = transitionFlow(puzzle, { type: 'puzzle-failure' });
    expect(transitionFlow(failure, { type: 'retry' }).scene).toBe('puzzle');
    expect(transitionFlow(failure, { type: 'return-to-map' })).toEqual(initial);
    const success = transitionFlow(puzzle, { type: 'puzzle-success' });
    const completed = transitionFlow(success, { type: 'return-to-map' });
    expect(completed).toEqual({ scene: 'map', deviceComplete: true, outcome: null });
    expect(transitionFlow(completed, { type: 'interact', allowed: true })).toBe(completed);
  });

  it('clears held movement when focus is lost', () => {
    const directions = new Set(['left', 'up']);
    clearDirections(directions);
    expect(directions.size).toBe(0);
  });
});
