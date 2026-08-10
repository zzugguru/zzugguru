import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const PNG_SIGNATURE_BYTES = 8;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 80;

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(file) {
  let offset = PNG_SIGNATURE_BYTES;
  let width = 0;
  let height = 0;
  const imageData = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]);
    } else if (type === 'IDAT') {
      imageData.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const filtered = inflateSync(Buffer.concat(imageData));
  const rgba = new Uint8Array(width * height * bytesPerPixel);

  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    const rowStart = y * stride;
    const sourceStart = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[sourceStart + x];
      const left = x >= bytesPerPixel ? rgba[rowStart + x - bytesPerPixel] : 0;
      const above = y > 0 ? rgba[rowStart + x - stride] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? rgba[rowStart + x - stride - bytesPerPixel] : 0;
      const predictor = filter === 1 ? left
        : filter === 2 ? above
          : filter === 3 ? Math.floor((left + above) / 2)
            : filter === 4 ? paeth(left, above, upperLeft)
              : 0;
      rgba[rowStart + x] = (raw + predictor) & 0xff;
    }
  }

  return { width, height, rgba };
}

function frameAlphaBounds(image, frameIndex) {
  let minX = FRAME_WIDTH;
  let minY = FRAME_HEIGHT;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const imageX = frameIndex * FRAME_WIDTH + x;
      const alpha = image.rgba[(y * image.width + imageX) * 4 + 3];
      if (alpha === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return [minX, minY, maxX + 1, maxY + 1];
}

describe('Chapter 2 shared player sprite asset', () => {
  it('keeps the approved high-resolution frame and alpha geometry', () => {
    const file = readFileSync(resolve('src/assets/yeongsu-alien-suit-sprites.png'));
    const image = decodeRgbaPng(file);

    expect([image.width, image.height]).toEqual([256, 80]);
    expect([0, 1, 2, 3].map((frame) => frameAlphaBounds(image, frame))).toEqual([
      [14, 8, 50, 76],
      [18, 8, 46, 76],
      [18, 8, 46, 76],
      [14, 8, 50, 76],
    ]);
  });
});
