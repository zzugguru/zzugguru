import { describe, expect, it } from 'vitest';
import { assetProcessingReport, MAP_ASSET_MANIFEST, MEMORY_ROOM_MAP, requirePlayableMap, SPACESHIP_MAP, validateMapAssetManifest, type MapAssetEntry } from './mapAssetManifest';
import { canInteract, overlaps, PLAYER_SIZE } from './mapLogic';

function reachableFloor(map: typeof MEMORY_ROOM_MAP | typeof SPACESHIP_MAP): { x: number; y: number }[] {
  const step = 5;
  const start = { x: Math.round(map.spawn.x / step) * step, y: Math.round(map.spawn.y / step) * step };
  const queue = [start]; const visited = new Set([`${start.x},${start.y}`]);
  const open = (x: number, y: number) => {
    const body = { x, y, width: PLAYER_SIZE, height: PLAYER_SIZE };
    return x >= map.bounds.x && y >= map.bounds.y && x + PLAYER_SIZE <= map.bounds.x + map.bounds.width
      && y + PLAYER_SIZE <= map.bounds.y + map.bounds.height && !map.collisions.some((collision) => overlaps(body, collision));
  };
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
