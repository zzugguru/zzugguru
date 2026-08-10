import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  CHAPTER01_BACKGROUNDS,
  CHAPTER01_IDENTITY_SOURCE,
  CHAPTER01_SPRITES,
  CHAPTER01_STORY_BACKGROUNDS,
  CHAPTER01_TOPVIEW_BACKGROUNDS,
  CHAPTER01_TOPVIEW_SPRITE,
} from './chapter01Assets';

const PNG_SIGNATURE_BYTES = 8;

function readPngChunks(file) {
  let offset = PNG_SIGNATURE_BYTES;
  let header = null;
  const imageData = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const data = file.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      imageData.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!header) throw new Error('PNG is missing its IHDR chunk.');
  return { header, imageData };
}

function readJpegMetadata(file) {
  expect([...file.subarray(0, 2)]).toEqual([0xff, 0xd8]);
  let offset = 2;

  while (offset < file.length) {
    if (file[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = file[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = file.readUInt16BE(offset);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        bitDepth: file[offset + 2],
        height: file.readUInt16BE(offset + 3),
        width: file.readUInt16BE(offset + 5),
        components: file[offset + 7],
      };
    }
    offset += length;
  }

  throw new Error('JPEG is missing a supported frame header.');
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(file) {
  const { header, imageData } = readPngChunks(file);
  expect([header.bitDepth, header.colorType, header.compression, header.filter, header.interlace]).toEqual([8, 6, 0, 0, 0]);

  const bytesPerPixel = 4;
  const stride = header.width * bytesPerPixel;
  const filtered = inflateSync(Buffer.concat(imageData));
  const rgba = new Uint8Array(header.width * header.height * bytesPerPixel);

  for (let y = 0; y < header.height; y += 1) {
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

  return { ...header, rgba };
}

function alphaBounds(image) {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.rgba[(y * image.width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return { left, top, right: right + 1, bottom: bottom + 1 };
}

describe('Chapter 01 raster assets', () => {
  it('keeps the canonical identity image and generated backgrounds at the approved RGB dimensions', () => {
    const identity = readJpegMetadata(readFileSync(resolve(CHAPTER01_IDENTITY_SOURCE.path)));
    expect([identity.width, identity.height, identity.bitDepth, identity.components]).toEqual([1024, 1024, 8, 3]);

    for (const asset of Object.values(CHAPTER01_BACKGROUNDS)) {
      const { header } = readPngChunks(readFileSync(resolve(asset.path)));
      expect([header.width, header.height]).toEqual([asset.width, asset.height]);
      expect([header.bitDepth, header.colorType, header.compression, header.filter, header.interlace]).toEqual([8, 2, 0, 0, 0]);
    }

    for (const asset of Object.values(CHAPTER01_TOPVIEW_BACKGROUNDS)) {
      const { header } = readPngChunks(readFileSync(resolve(asset.path)));
      expect([header.width, header.height]).toEqual([asset.width, asset.height]);
      expect([header.bitDepth, header.colorType, header.compression, header.filter, header.interlace]).toEqual([8, 2, 0, 0, 0]);
    }

    for (const asset of Object.values(CHAPTER01_STORY_BACKGROUNDS)) {
      const { header } = readPngChunks(readFileSync(resolve(asset.path)));
      expect([header.width, header.height]).toEqual([960, 540]);
      expect([header.bitDepth, header.colorType, header.compression, header.filter, header.interlace]).toEqual([8, 2, 0, 0, 0]);
    }
  });

  it('keeps the approved transparent padding and silhouette bounds for both chase sprites', () => {
    const spriteAssets = [
      ['src/assets/yeongsu-guard-sprite.png', CHAPTER01_SPRITES.yeongsu],
      ['src/features/chapter1/assets/cctv-monster-sprite.png', CHAPTER01_SPRITES.monster],
    ];

    for (const [path, metadata] of spriteAssets) {
      const image = decodeRgbaPng(readFileSync(resolve(path)));
      expect([image.width, image.height]).toEqual([metadata.sourceWidth, metadata.sourceHeight]);
      expect(alphaBounds(image)).toEqual(metadata.alphaBounds);
    }
  });

  it('keeps Yeongsu character art in the common asset directory', () => {
    const commonAssets = [
      CHAPTER01_IDENTITY_SOURCE.path,
      CHAPTER01_TOPVIEW_SPRITE.path,
      'src/assets/yeongsu-guard-sprite.png',
    ];
    const formerFeatureAssets = [
      'src/features/chapter1/assets/yeongsu-guard.png',
      'src/features/chapter1/assets/chapter01-yeongsu-guard-sprites.png',
      'src/features/chapter1/assets/yeongsu-guard-sprite.png',
    ];

    for (const path of commonAssets) expect(existsSync(resolve(path)), path).toBe(true);
    for (const path of formerFeatureAssets) expect(existsSync(resolve(path)), path).toBe(false);
  });

  it('keeps all four Chapter 1 top-view guard frames on the approved alpha baseline', () => {
    const image = decodeRgbaPng(readFileSync(resolve(CHAPTER01_TOPVIEW_SPRITE.path)));
    expect([image.width, image.height]).toEqual([256, 80]);

    const bounds = CHAPTER01_TOPVIEW_SPRITE.alphaBounds.map((_, frameIndex) => {
      const frame = {
        width: 64,
        height: 80,
        rgba: new Uint8Array(64 * 80 * 4),
      };
      for (let y = 0; y < 80; y += 1) {
        for (let x = 0; x < 64; x += 1) {
          const sourceOffset = (y * image.width + frameIndex * 64 + x) * 4;
          const targetOffset = (y * 64 + x) * 4;
          frame.rgba.set(image.rgba.subarray(sourceOffset, sourceOffset + 4), targetOffset);
        }
      }
      return alphaBounds(frame);
    });
    expect(bounds).toEqual(CHAPTER01_TOPVIEW_SPRITE.alphaBounds);
  });
});
