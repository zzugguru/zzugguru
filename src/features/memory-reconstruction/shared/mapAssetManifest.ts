import type { Point, Rect } from './mapLogic';

export type MapAssetStatus = 'unmapped' | 'mapped' | 'verified' | 'needs-remap';
export type MemoryObjectId = 'photo' | 'market' | 'tool' | 'lens' | 'bowl';
export type FamilyMarkerId = 'wife' | 'son' | 'daughter';
type AssetBase = { id: string; file: string; version: string; status: MapAssetStatus; canvas: { width: number; height: number } };
export type UnprocessedMapAssetEntry = AssetBase & { status: 'unmapped' | 'needs-remap' };
export type PlayableMapAssetEntry = AssetBase & {
  status: 'mapped' | 'verified'; bounds: Rect; spawn: Point; collisions: readonly Rect[];
  device?: { bounds: Rect; interactionMargin: number };
  memoryObjects?: Readonly<Record<MemoryObjectId, { marker: Point; interaction: Point }>>;
  familyMarkers?: Readonly<Record<FamilyMarkerId, Point>>;
};
export type MapAssetEntry = UnprocessedMapAssetEntry | PlayableMapAssetEntry;

export const SPACESHIP_MAP: PlayableMapAssetEntry = {
  id: 'chapter03-spaceship-lab', file: 'chapter03-spaceship-lab.png', version: '2026-08-09.2', status: 'verified',
  canvas: { width: 960, height: 540 }, bounds: { x: 40, y: 22, width: 876, height: 482 }, spawn: { x: 78, y: 258 },
  collisions: [
    { x: 170, y: 91, width: 220, height: 76 }, { x: 170, y: 365, width: 220, height: 68 },
    { x: 443, y: 72, width: 54, height: 116 }, { x: 445, y: 318, width: 54, height: 110 },
    { x: 630, y: 178, width: 185, height: 184 }, { x: 608, y: 392, width: 240, height: 55 },
  ],
  device: { bounds: { x: 630, y: 178, width: 185, height: 184 }, interactionMargin: 46 },
};

export const MEMORY_ROOM_MAP: PlayableMapAssetEntry = {
  id: 'chapter03-memory-room-v2', file: 'chapter03-memory-room-v2.png', version: '2026-08-09.2', status: 'verified',
  canvas: { width: 960, height: 540 }, bounds: { x: 70, y: 18, width: 836, height: 486 }, spawn: { x: 570, y: 300 },
  collisions: [
    { x: 210, y: 108, width: 90, height: 92 }, { x: 345, y: 66, width: 165, height: 122 },
    { x: 630, y: 39, width: 100, height: 141 }, { x: 756, y: 75, width: 124, height: 127 },
    { x: 113, y: 218, width: 66, height: 92 }, { x: 183, y: 348, width: 62, height: 48 },
    { x: 358, y: 257, width: 125, height: 69 }, { x: 308, y: 338, width: 221, height: 79 },
    { x: 682, y: 235, width: 118, height: 116 }, { x: 659, y: 405, width: 112, height: 82 },
  ],
  memoryObjects: {
    photo: { marker: { x: 415, y: 65 }, interaction: { x: 415, y: 201 } },
    market: { marker: { x: 204, y: 359 }, interaction: { x: 204, y: 332 } },
    tool: { marker: { x: 143, y: 244 }, interaction: { x: 190, y: 244 } },
    lens: { marker: { x: 706, y: 421 }, interaction: { x: 706, y: 392 } },
    bowl: { marker: { x: 774, y: 286 }, interaction: { x: 814, y: 286 } },
  },
  familyMarkers: { wife: { x: 590, y: 365 }, son: { x: 820, y: 360 }, daughter: { x: 250, y: 300 } },
};

export const MAP_ASSET_MANIFEST: readonly MapAssetEntry[] = [SPACESHIP_MAP, MEMORY_ROOM_MAP];
export const RUNTIME_MAP_ASSET_IDS = ['chapter03-spaceship-lab', 'chapter03-memory-room-v2'] as const;

function rectInsideCanvas(rect: Rect, canvas: AssetBase['canvas']): boolean {
  return rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width && rect.y + rect.height <= canvas.height;
}
function pointInsideBounds(point: Point, bounds: Rect): boolean {
  return point.x >= bounds.x && point.y >= bounds.y && point.x <= bounds.x + bounds.width && point.y <= bounds.y + bounds.height;
}
export function assetProcessingReport(entries: readonly MapAssetEntry[]) {
  return { processed: entries.filter((entry) => entry.status === 'mapped' || entry.status === 'verified').map((entry) => entry.id), unprocessed: entries.filter((entry) => entry.status === 'unmapped' || entry.status === 'needs-remap').map((entry) => entry.id) };
}
export function validateMapAssetManifest(entries: readonly MapAssetEntry[], runtimeIds: readonly string[] = RUNTIME_MAP_ASSET_IDS): string[] {
  const errors: string[] = []; const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) errors.push(`${entry.id}: duplicate asset id`); seen.add(entry.id);
    if (!entry.file.trim() || !entry.version.trim()) errors.push(`${entry.id}: missing file or version`);
    if (entry.canvas.width <= 0 || entry.canvas.height <= 0) errors.push(`${entry.id}: invalid canvas size`);
    if (entry.status === 'unmapped' || entry.status === 'needs-remap') continue;
    if (!('bounds' in entry)) continue;
    if (!rectInsideCanvas(entry.bounds, entry.canvas)) errors.push(`${entry.id}: invalid map bounds`);
    if (!pointInsideBounds(entry.spawn, entry.bounds)) errors.push(`${entry.id}: spawn is outside map bounds`);
    entry.collisions.forEach((rect, index) => { if (!rectInsideCanvas(rect, entry.canvas)) errors.push(`${entry.id}: collision ${index} is outside canvas or invalid`); });
    if (entry.device && (!rectInsideCanvas(entry.device.bounds, entry.canvas) || entry.device.interactionMargin < 0)) errors.push(`${entry.id}: device mapping is invalid`);
    for (const [id, points] of Object.entries(entry.memoryObjects ?? {})) {
      if (!pointInsideBounds(points.marker, entry.bounds) || !pointInsideBounds(points.interaction, entry.bounds)) errors.push(`${entry.id}: memory object ${id} is outside map bounds`);
    }
    for (const [id, point] of Object.entries(entry.familyMarkers ?? {})) if (!pointInsideBounds(point, entry.bounds)) errors.push(`${entry.id}: family marker ${id} is outside map bounds`);
  }
  for (const id of runtimeIds) {
    const entry = entries.find((candidate) => candidate.id === id);
    if (!entry) errors.push(`${id}: runtime asset is missing from manifest`);
    else if (entry.status !== 'mapped' && entry.status !== 'verified') errors.push(`${id}: runtime asset is not processed`);
  }
  return errors;
}
export function requirePlayableMap(entry: MapAssetEntry): PlayableMapAssetEntry {
  if (entry.status !== 'mapped' && entry.status !== 'verified') throw new Error(`Map asset ${entry.id} cannot be used while status is ${entry.status}.`);
  const errors = validateMapAssetManifest([entry], [entry.id]); if (errors.length) throw new Error(errors.join('\n'));
  return entry;
}
