import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const EDIT_ENVELOPE = { left: 600, top: 25, right: 850, bottom: 190 };

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - above), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2] ? left
    : distances[1] <= distances[2] ? above : upperLeft;
}

function decodeRgbPng(file) {
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
      expect([...data.subarray(8, 13)]).toEqual([8, 2, 0, 0, 0]);
    } else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') break;
  }

  const bytesPerPixel = 3;
  const stride = width * bytesPerPixel;
  const filtered = inflateSync(Buffer.concat(chunks));
  const rgb = new Uint8Array(width * height * bytesPerPixel);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < stride; x += 1) {
    const filter = filtered[y * (stride + 1)];
    const target = y * stride + x;
    const raw = filtered[y * (stride + 1) + x + 1];
    const left = x >= bytesPerPixel ? rgb[target - bytesPerPixel] : 0;
    const above = y > 0 ? rgb[target - stride] : 0;
    const upperLeft = y > 0 && x >= bytesPerPixel ? rgb[target - stride - bytesPerPixel] : 0;
    const predictor = filter === 1 ? left : filter === 2 ? above
      : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
    rgb[target] = (raw + predictor) & 0xff;
  }
  return { width, height, rgb };
}

function hashPixels(image, insideEnvelope) {
  const hash = createHash('sha256');
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    const inside = x >= EDIT_ENVELOPE.left && x < EDIT_ENVELOPE.right
      && y >= EDIT_ENVELOPE.top && y < EDIT_ENVELOPE.bottom;
    if (inside !== insideEnvelope) continue;
    const offset = (y * image.width + x) * 3;
    hash.update(image.rgb.subarray(offset, offset + 3));
  }
  return hash.digest('hex');
}

describe('Chapter03 edited memory-room background asset', () => {
  it('keeps the approved RGB canvas and localized portrait-removal pixels', () => {
    const image = decodeRgbPng(readFileSync('src/features/chapter3/assets/chapter03-memory-room-v2.png'));

    expect([image.width, image.height]).toEqual([1672, 941]);
    expect(hashPixels(image, false)).toBe('4e487fee75ca622f2f95bd25a6c2ee2a51048f1a760936b6b8d27157497845d1');
    expect(hashPixels(image, true)).toBe('24636ca35d50508a159a01d7b8db79b9ec20cf8b489871f5911fbdfef33713a9');
  });

  it('does not modify the interactive family-photo sprite sheet', () => {
    const hash = createHash('sha256')
      .update(readFileSync('src/features/chapter3/assets/interaction-objects.png'))
      .digest('hex');

    expect(hash).toBe('e2eb3b4729bc30a0a55f16cbaa8ee55112943631cbfab2c13a6a4514847eb1b8');
  });
});
