import { describe, expect, it } from 'vitest';
import { createCollection } from './collectionLogic';
import { canStartLettingGo, chooseLettingGo, createLettingGo, LETTING_GO_MEMORIES } from './lettingGoLogic';

describe('memory letting-go puzzle', () => {
  it('starts only after all five objects are collected', () => {
    expect(canStartLettingGo(createCollection())).toBe(false);
    expect(canStartLettingGo({ ...createCollection(), completed: true })).toBe(true);
  });

  it('keeps wrong choices retryable without progress or game over', () => {
    const initial = createLettingGo();
    const wrong = chooseLettingGo(initial, 'hold');
    expect(wrong.index).toBe(0);
    expect(wrong.resolved).toEqual([]);
    expect(wrong.completed).toBe(false);
    expect(wrong.feedback).toContain('가두지는 말아요');
  });

  it('resolves each memory once and completes only after all correct choices', () => {
    let state = createLettingGo();
    for (const memory of LETTING_GO_MEMORIES) state = chooseLettingGo(state, memory.correct);
    expect(state.completed).toBe(true);
    expect(state.resolved).toEqual(['photo', 'market', 'tool', 'lens', 'bowl']);
    expect(state.feedback).toContain('삭제되지 않고 기록 보관소에 남는다');
    expect(chooseLettingGo(state, 'record')).toBe(state);
  });

  it('never treats holding on as a correct choice', () => {
    expect(LETTING_GO_MEMORIES.map(({ id, correct }) => ({ id, correct }))).toEqual([
      { id: 'photo', correct: 'record' },
      { id: 'market', correct: 'record' },
      { id: 'tool', correct: 'release' },
      { id: 'lens', correct: 'record' },
      { id: 'bowl', correct: 'record' },
    ]);
  });

  it('keeps every wrong option on the same retryable memory', () => {
    for (const memory of LETTING_GO_MEMORIES) {
      const state = { ...createLettingGo(), index: LETTING_GO_MEMORIES.indexOf(memory) };
      for (const choice of ['hold', 'record', 'release'] as const) {
        if (choice === memory.correct) continue;
        const result = chooseLettingGo(state, choice);
        expect(result.index).toBe(state.index);
        expect(result.resolved).toEqual([]);
        expect(result.feedback).toContain(':');
        expect(result.feedback).toContain('영수:');
      }
    }
  });
});
