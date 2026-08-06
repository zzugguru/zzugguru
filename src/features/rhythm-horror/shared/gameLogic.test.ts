import { describe, expect, it } from 'vitest';
import { GOOD_WINDOW_MS, PERFECT_WINDOW_MS, judgeLane, overdueNotes, scoreFor, type Note } from './gameLogic';

const notes: Note[] = [
  { id: 1, timeMs: 1000, lane: 0 },
  { id: 2, timeMs: 1400, lane: 1 },
];

describe('rhythm game judgement', () => {
  it('판정 구간 안의 가장 가까운 노트를 판정한다', () => {
    expect(judgeLane(notes, new Set(), 0, 1000).judgement).toBe('perfect');
    expect(judgeLane(notes, new Set(), 1, 1400 + PERFECT_WINDOW_MS + 1).judgement).toBe('good');
  });

  it('잘못된 레인과 판정 구간 밖 입력은 miss다', () => {
    expect(judgeLane(notes, new Set(), 3, 1000).note).toBeNull();
    expect(judgeLane(notes, new Set(), 0, 1000 + GOOD_WINDOW_MS + 1).judgement).toBe('miss');
  });

  it('이미 처리한 노트를 다시 판정하지 않는다', () => {
    expect(judgeLane(notes, new Set([1]), 0, 1000).note).toBeNull();
  });

  it('판정 시간이 지난 미처리 노트만 반환한다', () => {
    expect(overdueNotes(notes, new Set([1]), 2000).map((note) => note.id)).toEqual([2]);
  });

  it('콤보 보너스에 상한을 적용한다', () => {
    expect(scoreFor('perfect', 2)).toBe(1020);
    expect(scoreFor('perfect', 999)).toBe(1500);
    expect(scoreFor('miss', 20)).toBe(0);
  });
});
