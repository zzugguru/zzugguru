import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Chapter 01 responsive canvas', () => {
  it('lets the browser smoothly downscale canvas text instead of pixelating the whole frame', () => {
    const styles = readFileSync(resolve('src/style.css'), 'utf8');

    expect(styles).toMatch(/canvas\s*\{[^}]*image-rendering:\s*auto;/s);
    expect(styles).not.toMatch(/canvas\s*\{[^}]*image-rendering:\s*pixelated;/s);
  });
});
