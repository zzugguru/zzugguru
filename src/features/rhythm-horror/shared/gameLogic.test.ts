import { describe, expect, it } from 'vitest';
import {
  BEAT_MS,
  INPUT_WINDOW_MS,
  buildBeatChart,
  isHiddenBeat,
  judgeAction,
  overdueNotes,
  phaseForBeat,
  scoreFor,
} from './gameLogic';

describe('4박자 스텔스 리듬 규칙', () => {
  const notes = buildBeatChart();

  it('120 BPM의 4박자에서 1·2는 빛, 3·4는 어둠이다', () => {
    expect(BEAT_MS).toBe(500);
    expect([1, 2, 3, 4].map(phaseForBeat)).toEqual(['light', 'light', 'dark', 'dark']);
    expect(notes.slice(0, 4).map((note) => note.expectedAction)).toEqual(['hide', 'hide', 'move', 'move']);
  });

  it('박자 창 안에서 올바른 행동과 반대 행동을 구분한다', () => {
    const first = notes[0];
    expect(judgeAction(notes, new Set(), 'hide', first.timeMs).judgement).toBe('perfect');
    expect(judgeAction(notes, new Set(), 'hide', first.timeMs + 100).judgement).toBe('good');
    expect(judgeAction(notes, new Set(), 'move', first.timeMs).judgement).toBe('wrong');
  });

  it('판정 창 밖 입력과 지나간 미입력을 miss로 처리한다', () => {
    const first = notes[0];
    expect(judgeAction(notes, new Set(), 'hide', first.timeMs - INPUT_WINDOW_MS - 1).note).toBeNull();
    expect(overdueNotes(notes.slice(0, 2), new Set([0]), notes[1].timeMs + INPUT_WINDOW_MS + 1).map((note) => note.id)).toEqual([1]);
  });

  it('중반 이후 표시 삭제가 시작되고 마지막 구간에서 빈도가 높아진다', () => {
    expect(isHiddenBeat(47)).toBe(false);
    expect(isHiddenBeat(53)).toBe(true);
    expect(isHiddenBeat(89)).toBe(true);
    expect(isHiddenBeat(93)).toBe(true);
  });

  it('콤보 점수에 상한을 적용한다', () => {
    expect(scoreFor('perfect', 2)).toBe(924);
    expect(scoreFor('perfect', 999)).toBe(1380);
    expect(scoreFor('wrong', 20)).toBe(0);
  });
});
