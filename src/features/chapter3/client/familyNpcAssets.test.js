import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { familyNpcDestination } from './familyNpcSprite';
import { MEMORY_ROOM_MAP } from '../shared/mapAssetManifest';

const FAMILY_ASSETS = [
  ['wife', [21, 4, 43, 76]],
  ['son', [20, 12, 43, 76]],
  ['daughter', [21, 22, 42, 76]],
];

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - above), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2] ? left
    : distances[1] <= distances[2] ? above : upperLeft;
}

function decodeRgbaPng(path) {
  const file = readFileSync(resolve(path));
  let offset = 8;
  let width = 0;
  let height = 0;
  const chunks = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]);
    } else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') break;
  }
  const stride = width * 4;
  const filtered = inflateSync(Buffer.concat(chunks));
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const target = y * stride + x;
      const raw = filtered[y * (stride + 1) + x + 1];
      const left = x >= 4 ? rgba[target - 4] : 0;
      const above = y > 0 ? rgba[target - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? rgba[target - stride - 4] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? above
        : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
      rgba[target] = (raw + predictor) & 0xff;
    }
  }
  return { width, height, rgba };
}

function alphaBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    if (image.rgba[(y * image.width + x) * 4 + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX + 1, maxY + 1];
}

describe('Chapter03 family NPC assets', () => {
  it.each(FAMILY_ASSETS)('keeps the approved RGBA canvas and alpha geometry for %s', (id, expectedBounds) => {
    const image = decodeRgbaPng(`src/features/chapter3/assets/family-${id}.png`);
    expect([image.width, image.height]).toEqual([64, 80]);
    expect(alphaBounds(image)).toEqual(expectedBounds);
  });

  it.each(FAMILY_ASSETS)('keeps the visible %s silhouette on open floor with label clearance', (id, bounds) => {
    const marker = MEMORY_ROOM_MAP.familyMarkers[id];
    const destination = familyNpcDestination({ centerX: marker.x + 12, feetY: marker.y + 30 });
    const visible = {
      x: destination.x + bounds[0],
      y: destination.y + bounds[1],
      width: bounds[2] - bounds[0],
      height: bounds[3] - bounds[1],
    };
    const map = MEMORY_ROOM_MAP.bounds;
    const overlaps = (left, right) => left.x < right.x + right.width && left.x + left.width > right.x
      && left.y < right.y + right.height && left.y + left.height > right.y;

    expect(visible.x).toBeGreaterThanOrEqual(map.x);
    expect(visible.y).toBeGreaterThanOrEqual(map.y);
    expect(visible.x + visible.width).toBeLessThanOrEqual(map.x + map.width);
    expect(visible.y + visible.height).toBeLessThanOrEqual(map.y + map.height);
    expect(MEMORY_ROOM_MAP.collisions.some((collision) => overlaps(visible, collision))).toBe(false);
    expect(visible.y - (destination.y - 7)).toBeGreaterThanOrEqual(8);
  });
});
