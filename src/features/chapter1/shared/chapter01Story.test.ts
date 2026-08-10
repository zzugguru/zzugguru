import { describe, expect, it } from 'vitest';
import { CHAPTER01_STORY, advanceChapter01Story } from './chapter01Story';

describe('Chapter 01 story', () => {
  it('Story/Chapter01.md의 주요 사건과 마지막 대사를 순서대로 포함한다', () => {
    const storyText = CHAPTER01_STORY.map((beat) => beat.text).join(' ');

    expect(storyText).toContain('신원 미상의 여성 발견');
    expect(storyText).toContain('다섯째 날에는 경비실 앞 출입문');
    expect(storyText).toContain('정확히 7분');
    expect(CHAPTER01_STORY.at(-1)).toMatchObject({ speaker: '영수', text: '여기가…… 어디야.' });
  });

  it('한 장면씩 진행하고 마지막 장면에서 완료 상태를 유지한다', () => {
    expect(advanceChapter01Story(0, 3)).toEqual({ index: 1, complete: false });
    expect(advanceChapter01Story(1, 3)).toEqual({ index: 2, complete: false });
    expect(advanceChapter01Story(2, 3)).toEqual({ index: 2, complete: true });
  });
});
