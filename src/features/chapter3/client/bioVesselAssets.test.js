import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { bioVesselDestination, bioVesselInfoPanel } from './bioVesselSprite';

const ASSETS = [
  ['wife', [43, 4, 117, 180], 'cba9108400c68efa5a6e7a6e5e7d83970794ce7af627ec192f4d7c585c52dd33'],
  ['son', [41, 4, 119, 180], 'cd5f8407d17de054a1e915a0c46f59a50e9fb78613a7f8cbe64b11e3890b78ff'],
  ['daughter', [41, 4, 119, 180], '23f535547df4704aaaa822e0af2d0462352c813f293b54085d0813f4db07c2bd'],
];

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - above), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2] ? left
    : distances[1] <= distances[2] ? above : upperLeft;
}

function decode(path) {
  const file = readFileSync(path);
  let offset = 8; let width = 0; let height = 0; const chunks = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset); const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length); offset += length + 12;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]); }
    else if (type === 'IDAT') chunks.push(data); else if (type === 'IEND') break;
  }
  const stride = width * 4; const filtered = inflateSync(Buffer.concat(chunks)); const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < stride; x += 1) {
    const filter = filtered[y * (stride + 1)]; const target = y * stride + x; const raw = filtered[y * (stride + 1) + x + 1];
    const left = x >= 4 ? rgba[target - 4] : 0; const above = y > 0 ? rgba[target - stride] : 0; const upperLeft = y > 0 && x >= 4 ? rgba[target - stride - 4] : 0;
    const predictor = filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
    rgba[target] = (raw + predictor) & 0xff;
  }
  return { file, width, height, rgba };
}

function alphaBounds(image) {
  let minX = image.width; let minY = image.height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    if (image.rgba[(y * image.width + x) * 4 + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX + 1, maxY + 1];
}

describe('biocapsule assets', () => {
  it.each(ASSETS)('keeps approved RGBA geometry and content for %s', (id, bounds, hash) => {
    const image = decode(`src/features/chapter3/assets/bio-vessel-${id}.png`);
    expect([image.width, image.height]).toEqual([160, 184]);
    expect(alphaBounds(image)).toEqual(bounds);
    expect(new Set(image.rgba.filter((_, index) => index % 4 === 3))).toEqual(new Set([0, 255]));
    expect(createHash('sha256').update(image.file).digest('hex')).toBe(hash);
  });

  it.each([
    ['puzzle', { x: 54, y: 265, width: 264, height: 190 }],
    ['awakening', { x: 54, y: 185, width: 264, height: 220 }],
  ])('keeps every visible vessel inside the %s panel and clear of its information card', (_scene, rect) => {
    const destination = bioVesselDestination(rect);
    const info = bioVesselInfoPanel(rect);
    for (const [, bounds] of ASSETS) {
      const visible = {
        x: destination.x + bounds[0], y: destination.y + bounds[1],
        width: bounds[2] - bounds[0], height: bounds[3] - bounds[1],
      };
      expect(visible.x).toBeGreaterThan(info.x + info.width);
      expect(visible.y).toBeGreaterThanOrEqual(rect.y);
      expect(visible.x + visible.width).toBeLessThanOrEqual(rect.x + rect.width);
      expect(visible.y + visible.height).toBeLessThanOrEqual(rect.y + rect.height);
    }
  });
});
