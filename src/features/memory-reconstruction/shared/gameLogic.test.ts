import { describe, expect, it } from 'vitest';
import { awakeningStage, connectMemory, createMemoryGame, familyAtPoint, MEMORY_CLUES } from './gameLogic';

describe('memory reconstruction game', () => {
  it('completes all Chapter03 memories through correct connections', () => {
    let state = createMemoryGame();
    for (const clue of MEMORY_CLUES) state = connectMemory(state, clue.family);
    expect(state.status).toBe('success');
    expect(state.completed).toEqual({ wife: 3, son: 1, daughter: 1 });
    expect(state.stability).toBe(3);
  });

  it('keeps the five source memories distinct and assigned to the right family', () => {
    expect(MEMORY_CLUES.map(({ id, family, label }) => ({ id, family, label }))).toEqual([
      { id: 'wife-face', family: 'wife', label: '아내의 얼굴' },
      { id: 'son-habit', family: 'son', label: '긴장하면 엄지손톱을 만지던 버릇' },
      { id: 'daughter-hand', family: 'daughter', label: '길을 건널 때 내밀던 작은 손바닥' },
      { id: 'wife-smile', family: 'wife', label: '웃을 때 눈가에 생기던 주름' },
      { id: 'wife-voice', family: 'wife', label: '“여보?” 하고 부르던 목소리' },
    ]);
  });

  it('rejects a wrong family without consuming the clue', () => {
    const state = connectMemory(createMemoryGame(), 'son');
    expect(state.clueIndex).toBe(0);
    expect(state.completed).toEqual({ wife: 0, son: 0, daughter: 0 });
    expect(state.stability).toBe(2);
  });

  it('fails at the stability boundary and ignores later input', () => {
    let state = createMemoryGame();
    state = connectMemory(state, 'son');
    state = connectMemory(state, 'son');
    state = connectMemory(state, 'son');
    expect(state.status).toBe('failure');
    expect(state.stability).toBe(0);
    expect(connectMemory(state, 'wife')).toBe(state);
  });

  it('accepts only points inside a vessel, excluding gaps and outer space', () => {
    expect(familyAtPoint(54, 265)).toBe('wife');
    expect(familyAtPoint(348, 300)).toBe('son');
    expect(familyAtPoint(906, 455)).toBe('daughter');
    expect(familyAtPoint(330, 300)).toBeNull();
    expect(familyAtPoint(930, 300)).toBeNull();
  });

  it('opens wife, son, and daughter vessels in order', () => {
    expect([0, 900, 1_800, 2_700].map(awakeningStage)).toEqual([0, 1, 2, 3]);
  });
});
