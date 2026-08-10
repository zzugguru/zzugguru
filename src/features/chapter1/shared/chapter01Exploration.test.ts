import { describe, expect, it } from 'vitest';
import {
  CHAPTER01_EXPLORATIONS,
  CHAPTER01_STORY_PLAYFIELDS,
  clampExplorationPoint,
  explorationForBeat,
  facingForDirection,
  getExplorationPlayerCollisionBounds,
  getExplorationPlayerVisibleBounds,
  getSafeExplorationAnchorBounds,
  isExplorationTargetReached,
  isExplorationPositionAllowed,
  moveExplorationPlayer,
  moveExplorationPlayerToward,
} from './chapter01Exploration';

describe('Chapter 01 top-view exploration', () => {
  it('places three concise objectives on the intended story beats', () => {
    expect(CHAPTER01_EXPLORATIONS.map(({ beatIndex, scene }) => [beatIndex, scene])).toEqual([
      [1, 'guard-room'],
      [10, 'basement'],
      [39, 'whiteout'],
    ]);
    expect(explorationForBeat(10)?.id).toBe('basement-stairs');
    expect(explorationForBeat(11)).toBeUndefined();
  });

  it('moves with cardinal input, preserves facing, and clamps every scene to its floor', () => {
    for (const definition of CHAPTER01_EXPLORATIONS) {
      const left = moveExplorationPlayer(definition.start, 'left', 10, definition);
      expect(left.x).toBeGreaterThanOrEqual(definition.bounds.left);
      const up = moveExplorationPlayer(definition.start, 'up', 10, definition);
      expect(up.y).toBeGreaterThanOrEqual(definition.bounds.top);
      expect(facingForDirection('right', 'down')).toBe('right');
      expect(facingForDirection(null, 'up')).toBe('up');
    }
  });

  it('lets pointer movement reach every interaction target without leaving the floor', () => {
    for (const definition of CHAPTER01_EXPLORATIONS) {
      let position = { x: Number(definition.start.x), y: Number(definition.start.y) };
      for (let step = 0; step < 200; step += 1) {
        const movement = moveExplorationPlayerToward(position, definition.target, 0.05, definition);
        position = movement.position;
        if (movement.reached) break;
      }

      expect(isExplorationTargetReached(position, definition)).toBe(true);
      expect(position.x).toBeGreaterThanOrEqual(definition.bounds.left);
      expect(position.x).toBeLessThanOrEqual(definition.bounds.right);
      expect(position.y).toBeGreaterThanOrEqual(definition.bounds.top);
      expect(position.y).toBeLessThanOrEqual(definition.bounds.bottom);
    }
  });

  it('blocks the player body from every mapped wall and furniture footprint', () => {
    for (const definition of CHAPTER01_EXPLORATIONS) {
      expect(isExplorationPositionAllowed(definition.start, definition), `${definition.id} start`).toBe(true);
      expect(isExplorationPositionAllowed(definition.target, definition), `${definition.id} target`).toBe(true);

      for (const obstacle of definition.obstacles) {
        const inside = {
          x: (obstacle.left + obstacle.right) / 2,
          y: (obstacle.top + obstacle.bottom) / 2,
        };
        expect(isExplorationPositionAllowed(inside, definition), `${definition.id} obstacle`).toBe(false);
      }
    }
  });

  it('stops at furniture edges instead of walking through them', () => {
    const guardRoom = CHAPTER01_EXPLORATIONS[0];
    const besideCabinet = { x: 820, y: 326 };
    const movedLeft = moveExplorationPlayer(besideCabinet, 'left', 0.05, guardRoom);

    expect(getExplorationPlayerCollisionBounds(besideCabinet).left).toBe(807);
    expect(movedLeft).toEqual(besideCabinet);
  });

  it('keeps a 60Hz cardinal keyboard route from the guard-room spawn to the desk target', () => {
    const guardRoom = CHAPTER01_EXPLORATIONS[0];
    let position = { x: Number(guardRoom.start.x), y: Number(guardRoom.start.y) };
    const step = (direction: 'down' | 'left', frames: number) => {
      for (let frame = 0; frame < frames; frame += 1) {
        position = moveExplorationPlayer(position, direction, 1 / 60, guardRoom);
      }
    };

    step('down', 3);
    step('left', 80);
    step('down', 10);
    step('left', 50);

    expect(isExplorationPositionAllowed(position, guardRoom)).toBe(true);
    expect(isExplorationTargetReached(position, guardRoom)).toBe(true);
  });

  it('keeps the maximum four-direction silhouette inside the story background and above the dialogue panel', () => {
    for (const definition of CHAPTER01_EXPLORATIONS) {
      const bounds = getSafeExplorationAnchorBounds(definition);
      const playfield = CHAPTER01_STORY_PLAYFIELDS[definition.scene];
      for (const position of [
        { x: bounds.left, y: bounds.top },
        { x: bounds.right, y: bounds.bottom },
      ]) {
        const visible = getExplorationPlayerVisibleBounds(position);
        expect(visible.left).toBeGreaterThanOrEqual(playfield.left);
        expect(visible.top).toBeGreaterThanOrEqual(playfield.top);
        expect(visible.right).toBeLessThanOrEqual(playfield.right);
        expect(visible.bottom).toBeLessThanOrEqual(playfield.bottom);
      }

      expect(clampExplorationPoint({ x: -1000, y: 1000 }, definition)).toEqual({
        x: bounds.left,
        y: bounds.bottom,
      });
      expect(clampExplorationPoint(definition.target, definition)).toEqual(definition.target);
    }
  });
});
