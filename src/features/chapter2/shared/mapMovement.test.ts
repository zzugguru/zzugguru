import { describe, expect, it } from 'vitest';
import { isWithinRange } from './proximity';
import { isPositionAllowed, MAP_PLAYER_COLLISION_HALF, moveMapPlayer } from './mapMovement';
import {
  ALIEN_CHILDHOOD_ROOM,
  EARTH_OBSERVATION_ROOM,
  HOLOGRAM_ARCHIVE,
  SECURITY_OFFICE,
} from '../client/mapVisuals';

const stopped = { up: false, down: false, left: false, right: false };

describe('Chapter 2 RPG map movement', () => {
  it('uses centered ninety-percent collision rectangles in every room', () => {
    const rooms = [
      [SECURITY_OFFICE, [
        { x: 158, y: 115, width: 72, height: 145 },
        { x: 243, y: 102, width: 72, height: 124 },
        { x: 333, y: 69, width: 281, height: 188 },
        { x: 618, y: 171, width: 48, height: 62 },
        { x: 665, y: 55, width: 88, height: 179 },
        { x: 755, y: 108, width: 52, height: 97 },
        { x: 124, y: 334, width: 141, height: 136 },
        { x: 650, y: 381, width: 139, height: 99 },
      ]],
      [ALIEN_CHILDHOOD_ROOM, [{ x: 88, y: 145, width: 156, height: 176 }, { x: 714, y: 326, width: 130, height: 98 }]],
      [HOLOGRAM_ARCHIVE, [{ x: 170, y: 100, width: 162, height: 156 }, { x: 399, y: 100, width: 162, height: 156 }, { x: 628, y: 100, width: 162, height: 156 }]],
      [EARTH_OBSERVATION_ROOM, [{ x: 714, y: 205, width: 86, height: 150 }, { x: 132, y: 130, width: 86, height: 116 }]],
    ] as const;

    for (const [room, sources] of rooms) {
      expect(room.collisions).toHaveLength(sources.length);
      room.collisions.forEach((collision, index) => {
        const source = sources[index];
        expect(collision.width).toBeCloseTo(source.width * 0.9);
        expect(collision.height).toBeCloseTo(source.height * 0.9);
        expect(collision.x + collision.width / 2).toBeCloseTo(source.x + source.width / 2);
        expect(collision.y + collision.height / 2).toBeCloseTo(source.y + source.height / 2);
      });
    }
  });

  it('keeps the 24px foot collision box inside the room floor', () => {
    const floor = EARTH_OBSERVATION_ROOM.floor;
    const topLeft = {
      x: floor.x + MAP_PLAYER_COLLISION_HALF,
      y: floor.y + MAP_PLAYER_COLLISION_HALF,
    };
    expect(isPositionAllowed(topLeft, floor, [])).toBe(true);
    expect(moveMapPlayer(topLeft, { ...stopped, up: true, left: true }, 1, floor, [])).toEqual(topLeft);

    const bottomRight = {
      x: floor.x + floor.width - MAP_PLAYER_COLLISION_HALF,
      y: floor.y + floor.height - MAP_PLAYER_COLLISION_HALF,
    };
    expect(isPositionAllowed(bottomRight, floor, [])).toBe(true);
    expect(moveMapPlayer(bottomRight, { ...stopped, down: true, right: true }, 1, floor, [])).toEqual(bottomRight);
  });

  it('blocks the foot collision box from furniture while preserving axis sliding', () => {
    const floor = { x: 0, y: 0, width: 500, height: 500 };
    const collision = [{ x: 220, y: 180, width: 80, height: 80 }];
    const position = { x: 200, y: 260 };
    const moved = moveMapPlayer(position, { ...stopped, up: true, right: true }, 0.5, floor, collision);
    expect(moved.x).toBe(position.x);
    expect(moved.y).toBeLessThan(position.y);
  });

  it('allows the security-office player feet up to the top floor edge', () => {
    const topY = SECURITY_OFFICE.floor.y + MAP_PLAYER_COLLISION_HALF;
    const position = { x: 480, y: topY };

    expect(topY).toBe(268);
    expect(isPositionAllowed(position, SECURITY_OFFICE.floor, SECURITY_OFFICE.collisions)).toBe(true);
    expect(isPositionAllowed({ ...position, y: topY - 0.01 }, SECURITY_OFFICE.floor, SECURITY_OFFICE.collisions)).toBe(false);
    expect(moveMapPlayer(position, { ...stopped, up: true }, 1, SECURITY_OFFICE.floor, SECURITY_OFFICE.collisions)).toEqual(position);
  });

  it('rejects wall zones that a broad rectangular room approximation would admit', () => {
    expect(isPositionAllowed({ x: 84, y: 124 }, SECURITY_OFFICE.floor, SECURITY_OFFICE.collisions)).toBe(false);
    expect(isPositionAllowed({ x: 102, y: 126 }, ALIEN_CHILDHOOD_ROOM.floor, ALIEN_CHILDHOOD_ROOM.collisions)).toBe(false);
    expect(isPositionAllowed({ x: 60, y: 118 }, HOLOGRAM_ARCHIVE.floor, HOLOGRAM_ARCHIVE.collisions)).toBe(false);
  });

  it('keeps every spawn and required or optional interaction connected by a clear path', () => {
    const cases = [
      { map: SECURITY_OFFICE, path: [{ x: 480, y: 400 }, { x: 480, y: 312 }], target: { x: 480, y: 270 }, radius: 56 },
      { map: SECURITY_OFFICE, path: [{ x: 480, y: 320 }], target: { x: 480, y: 260 }, radius: 80 },
      { map: SECURITY_OFFICE, path: [{ x: 480, y: 400 }, { x: 480, y: 312 }], target: { x: 480, y: 270 }, radius: 48 },
      { map: SECURITY_OFFICE, path: [{ x: 480, y: 400 }, { x: 300, y: 440 }, { x: 276, y: 350 }], target: { x: 270, y: 350 }, radius: 40 },
      { map: ALIEN_CHILDHOOD_ROOM, path: [{ x: 400, y: 300 }, { x: 640, y: 216 }], target: { x: 640, y: 200 }, radius: 48 },
      { map: HOLOGRAM_ARCHIVE, path: [{ x: 480, y: 340 }, { x: 240, y: 312 }], target: { x: 240, y: 275 }, radius: 48 },
      { map: HOLOGRAM_ARCHIVE, path: [{ x: 480, y: 340 }, { x: 480, y: 312 }], target: { x: 480, y: 275 }, radius: 48 },
      { map: HOLOGRAM_ARCHIVE, path: [{ x: 480, y: 340 }, { x: 720, y: 312 }], target: { x: 720, y: 275 }, radius: 48 },
      { map: HOLOGRAM_ARCHIVE, path: [{ x: 480, y: 340 }, { x: 480, y: 420 }], target: { x: 480, y: 420 }, radius: 48 },
      { map: EARTH_OBSERVATION_ROOM, path: [{ x: 480, y: 380 }, { x: 480, y: 202 }], target: { x: 480, y: 190 }, radius: 56 },
    ];

    for (const { map, path, target, radius } of cases) {
      for (const point of path) {
        expect(isPositionAllowed(point, map.floor, map.collisions)).toBe(true);
      }
      for (let segment = 1; segment < path.length; segment += 1) {
        const start = path[segment - 1];
        const end = path[segment];
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const samples = Math.ceil(distance / 4);
        for (let sample = 0; sample <= samples; sample += 1) {
          const ratio = samples === 0 ? 0 : sample / samples;
          expect(isPositionAllowed({
            x: start.x + (end.x - start.x) * ratio,
            y: start.y + (end.y - start.y) * ratio,
          }, map.floor, map.collisions)).toBe(true);
        }
      }
      const approach = path.at(-1)!;
      expect(isWithinRange(approach, target, radius)).toBe(true);
    }
  });
});
