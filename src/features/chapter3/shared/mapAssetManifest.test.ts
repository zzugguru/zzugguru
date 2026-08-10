import { describe, expect, it } from 'vitest';
import { assetProcessingReport, MAP_ASSET_MANIFEST, MEMORY_ROOM_MAP, requirePlayableMap, SPACESHIP_MAP, validateMapAssetManifest, type MapAssetEntry } from './mapAssetManifest';
import { canInteract, isMapPositionAllowed, overlaps, PLAYER_SIZE } from './mapLogic';

function reachableFloor(map: typeof MEMORY_ROOM_MAP | typeof SPACESHIP_MAP): { x: number; y: number }[] {
  const step = 5;
  const start = { x: Math.round(map.spawn.x / step) * step, y: Math.round(map.spawn.y / step) * step };
  const queue = [start]; const visited = new Set([`${start.x},${start.y}`]);
  const open = (x: number, y: number) => isMapPositionAllowed({ x, y }, map);
  for (let index = 0; index < queue.length; index += 1) {
    const point = queue[index];
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]] as const) {
      const next = { x: point.x + dx, y: point.y + dy }; const key = `${next.x},${next.y}`;
      if (open(next.x, next.y) && !visited.has(key)) { visited.add(key); queue.push(next); }
    }
  }
  return queue;
}

describe('Chapter03 map asset manifest', () => {
  it('shrinks every mapped object around its center by ten percent', () => {
    const rooms = [
      [SPACESHIP_MAP, [
        { x: 170, y: 91, width: 220, height: 76 }, { x: 170, y: 365, width: 220, height: 68 },
        { x: 443, y: 72, width: 54, height: 116 }, { x: 445, y: 318, width: 54, height: 110 },
        { x: 630, y: 178, width: 185, height: 184 }, { x: 608, y: 392, width: 240, height: 55 },
      ]],
      [MEMORY_ROOM_MAP, [
        { x: 210, y: 108, width: 90, height: 92 }, { x: 345, y: 66, width: 165, height: 122 },
        { x: 630, y: 39, width: 100, height: 141 }, { x: 756, y: 75, width: 124, height: 127 },
        { x: 113, y: 218, width: 66, height: 92 }, { x: 183, y: 348, width: 62, height: 48 },
        { x: 358, y: 257, width: 125, height: 69 }, { x: 308, y: 338, width: 221, height: 79 },
        { x: 682, y: 235, width: 118, height: 116 }, { x: 659, y: 405, width: 112, height: 82 },
      ]],
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
    expect(SPACESHIP_MAP.device!.bounds).toBe(SPACESHIP_MAP.collisions[4]);
  });

  it('registers every runtime background as verified and valid', () => {
    expect(MAP_ASSET_MANIFEST.map((entry) => entry.id)).toEqual([
      'chapter03-spaceship-lab', 'chapter03-memory-room-v2',
    ]);
    expect(MAP_ASSET_MANIFEST.every((entry) => entry.status === 'verified')).toBe(true);
    expect(validateMapAssetManifest(MAP_ASSET_MANIFEST)).toEqual([]);
    expect(requirePlayableMap(SPACESHIP_MAP)).toBe(SPACESHIP_MAP);
    expect(requirePlayableMap(MEMORY_ROOM_MAP)).toBe(MEMORY_ROOM_MAP);
  });

  it('reports duplicate ids, invalid rectangles, and out-of-bounds markers', () => {
    const invalid: MapAssetEntry = {
      ...SPACESHIP_MAP,
      bounds: { x: 0, y: 0, width: 961, height: 540 },
      spawn: { x: 999, y: 999 },
      collisions: [{ x: 20, y: 20, width: 0, height: 30 }],
    };
    const errors = validateMapAssetManifest([invalid, invalid]);
    expect(errors.some((error) => error.includes('duplicate asset id'))).toBe(true);
    expect(errors.some((error) => error.includes('invalid map bounds'))).toBe(true);
    expect(errors.some((error) => error.includes('spawn is outside'))).toBe(true);
    expect(errors.some((error) => error.includes('collision 0'))).toBe(true);
  });

  it('prevents unfinished mappings from becoming runtime maps', () => {
    const pending: MapAssetEntry = { id: 'future-room', file: 'future.png', version: 'draft', status: 'unmapped', canvas: { width: 960, height: 540 } };
    expect(assetProcessingReport([...MAP_ASSET_MANIFEST, pending]).unprocessed).toEqual(['future-room']);
    expect(validateMapAssetManifest([pending], ['future-room'])).toContain('future-room: runtime asset is not processed');
    expect(validateMapAssetManifest(MAP_ASSET_MANIFEST, [...MAP_ASSET_MANIFEST.map((entry) => entry.id), 'missing-room']))
      .toContain('missing-room: runtime asset is missing from manifest');
    expect(() => requirePlayableMap(pending)).toThrow(/cannot be used/);
  });

  it('keeps every memory object connected to the room spawn', () => {
    const queue = reachableFloor(MEMORY_ROOM_MAP);
    for (const { interaction } of Object.values(MEMORY_ROOM_MAP.memoryObjects!)) {
      const reachable = queue.some(({ x, y }) => Math.hypot(x + PLAYER_SIZE / 2 - interaction.x, y + PLAYER_SIZE / 2 - interaction.y) <= 72);
      expect(reachable).toBe(true);
    }
  });

  it('places family sprites on open room floor', () => {
    for (const marker of Object.values(MEMORY_ROOM_MAP.familyMarkers!)) {
      const sprite = { ...marker, width: 24, height: 30 };
      expect(MEMORY_ROOM_MAP.collisions.some((collision) => overlaps(sprite, collision))).toBe(false);
      expect(sprite.x + sprite.width).toBeLessThanOrEqual(MEMORY_ROOM_MAP.bounds.x + MEMORY_ROOM_MAP.bounds.width);
      expect(sprite.y + sprite.height).toBeLessThanOrEqual(MEMORY_ROOM_MAP.bounds.y + MEMORY_ROOM_MAP.bounds.height);
    }
  });

  it('connects the spaceship spawn to an open device interaction point', () => {
    expect(reachableFloor(SPACESHIP_MAP).some((point) => canInteract(point, SPACESHIP_MAP))).toBe(true);
  });
});
