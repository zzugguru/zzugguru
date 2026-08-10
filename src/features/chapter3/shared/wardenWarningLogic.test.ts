import { describe, expect, it } from 'vitest';
import { advanceWarning, createWarning, WARNING_LINES } from './wardenWarningLogic';

describe('device warning cutscene', () => {
  it('starts unseen at the first line', () => {
    const state = createWarning();
    expect(state.seen).toBe(false);
    expect(state.step).toBe(0);
  });

  it('advances through every line before becoming seen', () => {
    let state = createWarning();
    for (let i = 1; i < WARNING_LINES.length; i += 1) {
      state = advanceWarning(state);
      expect(state.seen).toBe(false);
      expect(state.step).toBe(i);
    }
    state = advanceWarning(state);
    expect(state.seen).toBe(true);
    expect(state.step).toBe(WARNING_LINES.length - 1);
  });

  it('ignores further advances once seen', () => {
    let state = createWarning();
    for (let i = 0; i < WARNING_LINES.length; i += 1) state = advanceWarning(state);
    const seen = state;
    expect(advanceWarning(seen)).toBe(seen);
  });
});
