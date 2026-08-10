import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../../../style.css', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('./MemoryReconstructionGame.ts', import.meta.url), 'utf8');

describe('Chapter 3 keyboard-only map controls contract', () => {
  it('does not ship the removed bottom direction or interaction interface', () => {
    for (const source of [mainSource, styleSource, gameSource]) {
      expect(source).not.toContain('map-controls');
      expect(source).not.toContain('interact-button');
      expect(source).not.toContain('data-direction');
    }
  });

  it('keeps keyboard movement and interaction mappings', () => {
    expect(gameSource).toContain("event.code === 'KeyE'");
    expect(gameSource).toContain("code === 'ArrowUp' || code === 'KeyW'");
    expect(gameSource).toContain("code === 'ArrowDown' || code === 'KeyS'");
    expect(gameSource).toContain("code === 'ArrowLeft' || code === 'KeyA'");
    expect(gameSource).toContain("code === 'ArrowRight' || code === 'KeyD'");
  });
});
