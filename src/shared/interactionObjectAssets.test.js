import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const CELL = 362;

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const dl = Math.abs(estimate - left); const da = Math.abs(estimate - above); const du = Math.abs(estimate - upperLeft);
  return dl <= da && dl <= du ? left : da <= du ? above : upperLeft;
}

function decode(file) {
  let offset = 8; let width = 0; let height = 0; const chunks = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset); const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length); offset += length + 12;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]); }
    if (type === 'IDAT') chunks.push(data);
    if (type === 'IEND') break;
  }
  const stride = width * 4; const filtered = inflateSync(Buffer.concat(chunks)); const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < stride; x += 1) {
    const filter = filtered[y * (stride + 1)]; const source = filtered[y * (stride + 1) + 1 + x]; const row = y * stride;
    const left = x >= 4 ? rgba[row + x - 4] : 0; const above = y ? rgba[row + x - stride] : 0; const upperLeft = y && x >= 4 ? rgba[row + x - stride - 4] : 0;
    const prediction = filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
    rgba[row + x] = (source + prediction) & 255;
  }
  return { width, height, rgba };
}

function alphaBounds(image, index) {
  const cellX = index % 4 * CELL; const cellY = Math.floor(index / 4) * CELL;
  let minX = CELL; let minY = CELL; let maxX = -1; let maxY = -1;
  for (let y = 0; y < CELL; y += 1) for (let x = 0; x < CELL; x += 1) {
    if (image.rgba[((cellY + y) * image.width + cellX + x) * 4 + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1];
}

describe('interaction object sprite sheets', () => {
  it.each([
    ['src/features/chapter2/assets/interaction-objects.png', 10],
    ['src/features/chapter3/assets/interaction-objects.png', 12],
  ])('%s has exact RGBA cells with unclipped object alpha', (path, objectCount) => {
    const image = decode(readFileSync(path));
    expect([image.width, image.height]).toEqual([1448, 1086]);
    const bounds = Array.from({ length: 12 }, (_, index) => alphaBounds(image, index));
    for (const bound of bounds.slice(0, objectCount)) {
      expect(bound).not.toBeNull();
      expect(bound[0]).toBeGreaterThan(0); expect(bound[1]).toBeGreaterThan(0);
      expect(bound[2]).toBeLessThan(CELL); expect(bound[3]).toBeLessThan(CELL);
    }
    for (const bound of bounds.slice(objectCount)) expect(bound).toBeNull();
  });
});
