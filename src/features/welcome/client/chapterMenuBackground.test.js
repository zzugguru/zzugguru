import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(new URL('../../../style.css', import.meta.url), 'utf8');
const entrypoint = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');

describe('chapter menu background integration', () => {
  it('uses the story background with a token-aligned fallback', () => {
    expect(stylesheet).toContain(
      "url('./features/welcome/assets/chapter-menu-apartment-spaceship.png')",
    );
    expect(stylesheet).toContain('linear-gradient(135deg, #111827, #312e81)');
    expect(stylesheet).toMatch(/\.chapter-menu\s*\{[\s\S]*?background-size: cover;/);
  });

  it('protects menu readability and mobile cover cropping', () => {
    expect(stylesheet).toMatch(/\.chapter-menu::before\s*\{[\s\S]*?rgb\(17 24 39 \/ 82%\)/);
    expect(stylesheet).toMatch(
      /@media \(max-width: 640px\)[\s\S]*?\.chapter-menu\s*\{[\s\S]*?background-position: 54% center;/,
    );
  });

  it('preserves all chapter choices and the menu-to-stage transition contract', () => {
    expect([...entrypoint.matchAll(/data-game="([^"]+)"/g)].map((match) => match[1])).toEqual([
      'chapter1',
      'chapter2',
      'memory',
    ]);
    expect(entrypoint).toContain("querySelectorAll<HTMLButtonElement>('[data-game]')");
    expect(entrypoint).toMatch(/menu\.hidden = true; stage\.hidden = false;/);
    expect(stylesheet).toMatch(/\[hidden\]\s*\{[\s\S]*?display: none !important;/);
  });

  it('retains a visible keyboard focus treatment for menu buttons', () => {
    expect(stylesheet).toMatch(
      /\.chapter-menu button:focus-visible,[\s\S]*?outline: 3px solid #f9fafb;[\s\S]*?outline-offset: 2px;/,
    );
  });

  it('renders structured chapter cards and an announced progress summary', () => {
    expect(entrypoint).toContain('class="chapter-menu__intro"');
    expect(entrypoint).toContain('class="chapter-progress" aria-live="polite"');
    expect(entrypoint.match(/class="chapter-card"/g)).toHaveLength(3);
    expect(entrypoint.match(/data-chapter-status/g)).toHaveLength(3);
    expect(entrypoint.match(/data-chapter-action/g)).toHaveLength(3);
    expect(entrypoint).toContain('data-progress-count');
  });

  it('uses a three-card desktop journey and a single-column mobile reading order', () => {
    expect(stylesheet).toMatch(
      /\.chapter-list\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 640px\)[\s\S]*?\.chapter-list\s*\{[\s\S]*?grid-template-columns: 1fr;/,
    );
    expect(stylesheet).toMatch(/\.chapter-menu \.chapter-card\[data-current="true"\]/);
  });
});
