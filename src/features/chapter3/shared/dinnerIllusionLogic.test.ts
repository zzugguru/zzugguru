import { describe, expect, it } from 'vitest';
import { advanceDinner, createDinner, DINNER_CRACK_STEP, DINNER_LINES } from './dinnerIllusionLogic';

describe('final dinner illusion cutscene', () => {
  it('starts unseen at the first line', () => {
    const state = createDinner();
    expect(state.seen).toBe(false);
    expect(state.step).toBe(0);
  });

  it('advances through every line before becoming seen', () => {
    let state = createDinner();
    for (let i = 1; i < DINNER_LINES.length; i += 1) {
      state = advanceDinner(state);
      expect(state.seen).toBe(false);
      expect(state.step).toBe(i);
    }
    state = advanceDinner(state);
    expect(state.seen).toBe(true);
    expect(state.step).toBe(DINNER_LINES.length - 1);
  });

  it('ignores further advances once seen', () => {
    let state = createDinner();
    for (let i = 0; i < DINNER_LINES.length; i += 1) state = advanceDinner(state);
    const seen = state;
    expect(advanceDinner(seen)).toBe(seen);
  });

  it('crack step falls within the line range', () => {
    expect(DINNER_CRACK_STEP).toBeGreaterThan(0);
    expect(DINNER_CRACK_STEP).toBeLessThan(DINNER_LINES.length);
  });
});
