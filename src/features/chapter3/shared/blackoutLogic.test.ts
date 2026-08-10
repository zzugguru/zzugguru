import { describe, expect, it } from 'vitest';
import { advanceBlackout, BLACKOUT_LINES, createBlackout } from './blackoutLogic';

describe('spaceship blackout and memory-world transformation cutscene', () => {
  it('starts unseen at the first line', () => {
    const state = createBlackout();
    expect(state.seen).toBe(false);
    expect(state.step).toBe(0);
  });

  it('advances through every line before becoming seen', () => {
    let state = createBlackout();
    for (let i = 1; i < BLACKOUT_LINES.length; i += 1) {
      state = advanceBlackout(state);
      expect(state.seen).toBe(false);
      expect(state.step).toBe(i);
    }
    state = advanceBlackout(state);
    expect(state.seen).toBe(true);
    expect(state.step).toBe(BLACKOUT_LINES.length - 1);
  });

  it('ignores further advances once seen', () => {
    let state = createBlackout();
    for (let i = 0; i < BLACKOUT_LINES.length; i += 1) state = advanceBlackout(state);
    const seen = state;
    expect(advanceBlackout(seen)).toBe(seen);
  });

  it('carries the confrontation speakers in order (아내 → 누나 → 영수) then narration', () => {
    expect(BLACKOUT_LINES.map((line) => line.speaker)).toEqual(['아내', '누나', '영수', '', '']);
  });
});
