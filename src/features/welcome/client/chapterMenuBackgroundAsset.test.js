import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const assetUrl = new URL('../assets/chapter-menu-apartment-spaceship.png', import.meta.url);

describe('chapter menu background asset', () => {
  it('keeps the approved 1920 x 1080 RGB PNG', () => {
    const png = readFileSync(assetUrl);

    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1920);
    expect(png.readUInt32BE(20)).toBe(1080);
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(2);
    expect(createHash('sha256').update(png).digest('hex')).toBe(
      'de93c17e392173626dd850864521c0ad99c0cb77ab3950696099eb64c54ba7d4',
    );
  });
});
