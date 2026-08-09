import { describe, expect, it } from 'vitest';
import { canActivateDevice, canInteract, clearDirections, createFlow, MAP_BOUNDS, movePlayer, PLAYER_SIZE, PLAYER_SPRITE_TOP_OVERHANG, transitionFlow } from './mapLogic';
import { MEMORY_ROOM_MAP, SPACESHIP_MAP } from './mapAssetManifest';

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

  it('keeps the visible sprite inside both background borders', () => {
    for (const map of [SPACESHIP_MAP, MEMORY_ROOM_MAP]) {
      const topmost = { x: map.bounds.x + 30, y: map.bounds.y + PLAYER_SPRITE_TOP_OVERHANG };
      expect(movePlayer(topmost, 0, -1, map)).toEqual(topmost);

      const bottommost = { x: map.bounds.x + 30, y: map.bounds.y + map.bounds.height - PLAYER_SIZE };
      expect(movePlayer(bottommost, 0, 1, map)).toEqual(bottommost);

      const leftmost = { x: map.bounds.x, y: map.bounds.y + 100 };
      expect(movePlayer(leftmost, -1, 0, map)).toEqual(leftmost);

      const rightmost = { x: map.bounds.x + map.bounds.width - PLAYER_SIZE, y: map.bounds.y + 100 };
      expect(movePlayer(rightmost, 1, 0, map)).toEqual(rightmost);
    }
  });

  it('allows interaction only beside the reconstruction device', () => {
    expect(canInteract({ x: 650, y: 235 })).toBe(true);
    expect(canInteract({ x: 80, y: 250 })).toBe(false);
  });

  it('uses the device rectangle edge and disables the device in the memory room', () => {
    expect(canInteract({ x: 646, y: 330 }, SPACESHIP_MAP)).toBe(true);
    expect(canInteract({ x: 560, y: 330 }, SPACESHIP_MAP)).toBe(false);
    expect(canInteract(MEMORY_ROOM_MAP.spawn, MEMORY_ROOM_MAP)).toBe(false);
  });

  it('uses room-specific furniture collisions after reconstruction', () => {
    expect(movePlayer(MEMORY_ROOM_MAP.spawn, 8, 0, MEMORY_ROOM_MAP)).toEqual({ x: 602, y: 298 });
    expect(movePlayer({ x: 700, y: 280 }, 8, 0, MEMORY_ROOM_MAP)).toEqual({ x: 700, y: 280 });
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
