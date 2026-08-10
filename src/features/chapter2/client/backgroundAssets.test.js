import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ASSETS = [
  'security-office.png',
  'alien-childhood-room.png',
  'hologram-archive.png',
  'earth-observation-room.png',
];

describe('Chapter 2 generated map backgrounds', () => {
  it.each(ASSETS)('%s is a production PNG at the exact game resolution', (name) => {
    const file = readFileSync(resolve('src/features/chapter2/assets', name));
    expect([...file.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(file.readUInt32BE(16)).toBe(960);
    expect(file.readUInt32BE(20)).toBe(540);
    expect(file.length).toBeGreaterThan(100_000);
  });
});
