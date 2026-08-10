import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { SPACESHIP_MAP } from '../shared/mapAssetManifest';
import { RESCUE_TARGETS } from '../shared/rescueLogic';
import { ALIEN_FAMILY_PROFILES, alienFamilyDestination } from './alienFamilyNpcSprite';

const ASSETS = [
  ['father', [21, 4, 43, 76], 'bd25668937905d55adff6e40d75a52b5885fe7011fcf4cbaa9cdb92ae4898f09'],
  ['mother', [21, 4, 42, 76], 'cf35465dbc00b7194153579dcc28921884e1ff1f2ae3a63dcfc2ae37bcbf1d71'],
  ['sister', [22, 4, 42, 76], 'ab0c65570b6e2599cca2b1f37bbdd4a8656294db847b01a5332ec41028c16f01'],
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

const overlaps = (left, right) => left.x < right.x + right.width && left.x + left.width > right.x
  && left.y < right.y + right.height && left.y + left.height > right.y;

describe('alien family NPC assets', () => {
  it.each(ASSETS)('keeps approved RGBA geometry and content for %s', (id, bounds, hash) => {
    const image = decode(`src/features/chapter3/assets/alien-family-${id}.png`);
    expect([image.width, image.height]).toEqual([64, 80]);
    expect(alphaBounds(image)).toEqual(bounds);
    expect(new Set(image.rgba.filter((_, index) => index % 4 === 3))).toEqual(new Set([0, 255]));
    expect(createHash('sha256').update(image.file).digest('hex')).toBe(hash);
  });

  it.each(ASSETS)('places the visible %s silhouette on open spaceship floor', (id, bounds) => {
    const target = RESCUE_TARGETS.find((candidate) => candidate.id === id);
    const destination = alienFamilyDestination(target);
    const visible = { x: destination.x + bounds[0], y: destination.y + bounds[1], width: bounds[2] - bounds[0], height: bounds[3] - bounds[1] };
    const map = SPACESHIP_MAP.bounds;
    expect(visible.x).toBeGreaterThanOrEqual(map.x);
    expect(visible.y).toBeGreaterThanOrEqual(map.y);
    expect(visible.x + visible.width).toBeLessThanOrEqual(map.x + map.width);
    expect(visible.y + visible.height).toBeLessThanOrEqual(map.y + map.height);
    expect(SPACESHIP_MAP.collisions.some((collision) => overlaps(visible, collision))).toBe(false);
  });

  it('records the approved slow-aging family appearance and smart-casual setting', () => {
    expect(ALIEN_FAMILY_PROFILES.father.humanEquivalentAge).toBe('late-50s');
    expect(ALIEN_FAMILY_PROFILES.mother.humanEquivalentAge).toBe('late-50s');
    expect(ALIEN_FAMILY_PROFILES.sister.humanEquivalentAge).toBe('late-40s');
    for (const profile of Object.values(ALIEN_FAMILY_PROFILES)) {
      expect(profile.speciesTraits).toContain('blue-gray skin');
      expect(profile.attire).toMatch(/navy|indigo/);
      expect(profile.attire).not.toMatch(/spacesuit|uniform|armor/);
    }
  });
});
