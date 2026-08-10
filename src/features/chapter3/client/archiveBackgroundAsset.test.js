import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const CELL = 362;
const ARCHIVE_FRAMES = {
  photo: { index: 6, center: [230, 170], size: [58, 64], pad: [176, 126, 286, 219] },
  voice: { index: 7, center: [307, 375], size: [58, 64], pad: [255, 334, 366, 424] },
  tool: { index: 8, center: [463, 170], size: [58, 64], pad: [414, 126, 524, 219] },
  star: { index: 9, center: [632, 375], size: [58, 64], pad: [576, 334, 686, 424] },
  table: { index: 10, center: [712, 170], size: [58, 64], pad: [659, 126, 759, 219] },
  door: { index: 11, center: [850, 270], size: [62, 76], pad: [824, 219, 919, 322] },
};

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - above), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2] ? left
    : distances[1] <= distances[2] ? above : upperLeft;
}

function decodeRgbaPng(file) {
  let offset = 8; let width = 0; let height = 0; const chunks = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset); const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length); offset += length + 12;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
    else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') break;
  }
  const stride = width * 4; const filtered = inflateSync(Buffer.concat(chunks)); const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < stride; x += 1) {
    const filter = filtered[y * (stride + 1)]; const target = y * stride + x; const raw = filtered[y * (stride + 1) + x + 1];
    const left = x >= 4 ? rgba[target - 4] : 0; const above = y ? rgba[target - stride] : 0;
    const upperLeft = y && x >= 4 ? rgba[target - stride - 4] : 0;
    const predictor = filter === 1 ? left : filter === 2 ? above
      : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
    rgba[target] = (raw + predictor) & 255;
  }
  return { width, height, rgba };
}

function frameAlphaBounds(image, frame) {
  const cellX = frame % 4 * CELL; const cellY = Math.floor(frame / 4) * CELL;
  let minX = CELL; let minY = CELL; let maxX = -1; let maxY = -1;
  for (let y = 0; y < CELL; y += 1) for (let x = 0; x < CELL; x += 1) {
    if (image.rgba[((cellY + y) * image.width + cellX + x) * 4 + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX + 1, maxY + 1];
}

describe('Chapter03 archive background asset', () => {
  it('keeps the approved 960×540 RGB pixel-art canvas', () => {
    const file = readFileSync('src/features/chapter3/assets/chapter03-archive.png');
    expect(file.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(file.readUInt32BE(16)).toBe(960);
    expect(file.readUInt32BE(20)).toBe(540);
    expect([...file.subarray(24, 29)]).toEqual([8, 2, 0, 0, 0]);
    expect(createHash('sha256').update(file).digest('hex'))
      .toBe('0a18c1231e6c579f5c95739fdf368c6c198a63d984fee68ae248395d99cb218d');
  });

  it.each(Object.entries(ARCHIVE_FRAMES))('aligns the actual %s alpha silhouette with its background pad', (_id, layout) => {
    const sheet = decodeRgbaPng(readFileSync('src/features/chapter3/assets/interaction-objects.png'));
    const source = frameAlphaBounds(sheet, layout.index);
    const destinationLeft = Math.round(layout.center[0] - layout.size[0] / 2);
    const destinationTop = Math.round(layout.center[1] - layout.size[1] / 2);
    const visible = [
      destinationLeft + source[0] * layout.size[0] / CELL,
      destinationTop + source[1] * layout.size[1] / CELL,
      destinationLeft + source[2] * layout.size[0] / CELL,
      destinationTop + source[3] * layout.size[1] / CELL,
    ];

    expect(visible[0]).toBeGreaterThanOrEqual(layout.pad[0]);
    expect(visible[1]).toBeGreaterThanOrEqual(layout.pad[1]);
    expect(visible[2]).toBeLessThanOrEqual(layout.pad[2]);
    expect(visible[3]).toBeLessThanOrEqual(layout.pad[3]);
  });
});
