import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./MemoryReconstructionGame.ts', import.meta.url), 'utf8');

describe('Chapter 3 narrative integration contract', () => {
  it('connects the new beats between collection and the existing letting-go flow', () => {
    expect(source).toContain("this.screen = 'warning'");
    expect(source).toMatch(/next\.completed[\s\S]*?this\.screen = 'blackout'/);
    expect(source).toMatch(/this\.blackout\.seen[\s\S]*?this\.screen = 'map'/);
    expect(source).toMatch(/this\.rescueOutro === 'fade'[\s\S]*?this\.screen = 'dinner'/);
    expect(source).toMatch(/this\.dinner\.seen[\s\S]*?this\.screen = 'letting-go'/);
    expect(source).toMatch(/chooseLettingGo[\s\S]*?startEpilogue/);
  });

  it('routes keyboard, pointer, next-button, focus and live-region controls through new beats', () => {
    for (const screen of ['warning', 'blackout', 'rescue', 'dinner']) {
      expect(source).toContain(`this.screen === '${screen}'`);
    }
    expect(source).toContain("event.code === 'Enter' || event.code === 'KeyE'");
    expect(source).toContain('this.controls.epilogueNext.focus()');
    expect(source).toContain('this.controls.liveRegion.textContent = message');
  });

  it('retains the existing asset loading and rendering paths', () => {
    expect(source).toContain("../assets/chapter03-memory-room-v2.png");
    expect(source).toContain("../assets/yeongsu-quarters.png");
    expect(source).toContain("../assets/chapter03-archive.png");
    expect(source).toContain("../assets/interaction-objects.png");
    expect(source).toContain('drawFamilyNpcSprite(ctx, this.familyImages[npc.id], anchor)');
    expect(source).toContain("drawInteractionObject(ctx, this.objectImage, 'reconstruction-device'");
    expect(source).toContain('if (collectionAvailable(this.flow)) this.drawMemoryArea();');
    expect(source).toContain('const epilogueBackground = selectEpilogueBackground');
  });
});
