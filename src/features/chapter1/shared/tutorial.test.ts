import { describe, expect, it } from 'vitest';
import { tutorialTipFor } from './tutorial';

describe('tutorialTipFor', () => {
  it('explains that light only requires releasing movement', () => {
    const tip = tutorialTipFor({ phase: 'light', playerX: 70, monsterMode: 'idle', finalChase: false });
    expect(tip.title).toContain('멈춤');
    expect(tip.detail).toContain('S는 누를 필요가 없습니다');
  });

  it('teaches crouched movement before a noisy obstacle', () => {
    const tip = tutorialTipFor({ phase: 'dark', playerX: 400, monsterMode: 'patrol', finalChase: false });
    expect(tip.title).toContain('S + A/D');
    expect(tip.detail).toContain('소음 없이');
  });

  it('teaches hiding while inside cover', () => {
    const tip = tutorialTipFor({ phase: 'dark', playerX: 520, monsterMode: 'patrol', finalChase: false });
    expect(tip.title).toContain('S');
    expect(tip.detail).toContain('추격을 끊을');
  });

  it('prioritizes the chase escape instruction when cover is available', () => {
    const tip = tutorialTipFor({ phase: 'dark', playerX: 520, monsterMode: 'chase', finalChase: false });
    expect(tip.title).toBe('엄폐물 안 · S');
    expect(tip.danger).toBe(true);
  });

  it('distinguishes stopping in light from running in darkness during a chase', () => {
    const light = tutorialTipFor({ phase: 'light', playerX: 700, monsterMode: 'chase', finalChase: false });
    const dark = tutorialTipFor({ phase: 'dark', playerX: 700, monsterMode: 'chase', finalChase: false });
    expect(light.title).toContain('이동키 놓기');
    expect(dark.title).toContain('Shift + A/D');
  });

  it('keeps the stop instruction above obstacle and cover tips during light', () => {
    const obstacle = tutorialTipFor({ phase: 'light', playerX: 400, monsterMode: 'patrol', finalChase: false });
    const cover = tutorialTipFor({ phase: 'light', playerX: 520, monsterMode: 'patrol', finalChase: false });
    expect(obstacle.title).toContain('멈춤');
    expect(cover.title).toContain('멈춤');
  });

  it('does not claim cover can break the final chase', () => {
    const tip = tutorialTipFor({ phase: 'dark', playerX: 520, monsterMode: 'chase', finalChase: true });
    expect(tip.title).toContain('Shift + A/D');
    expect(tip.detail).not.toContain('추격을 끊');
  });
});
