import { describe, expect, it } from 'vitest';
import { nextBeatTimeMs } from './SynthClock';

describe('nextBeatTimeMs', () => {
  it('전반부는 절대 750ms 박자 경계를 유지한다', () => {
    expect(nextBeatTimeMs(0)).toBe(2500);
    expect(nextBeatTimeMs(2500)).toBe(3250);
    expect(nextBeatTimeMs(12_345)).toBe(13_000);
  });

  it('58초부터 600ms 박자 경계로 전환한다', () => {
    expect(nextBeatTimeMs(57_999)).toBe(58_000);
    expect(nextBeatTimeMs(58_000)).toBe(58_600);
    expect(nextBeatTimeMs(59_201)).toBe(59_800);
  });

  it('재개 시점과 무관하게 다음 절대 경계를 반환한다', () => {
    expect(nextBeatTimeMs(10_100)).toBe(10_750);
    expect(nextBeatTimeMs(10_400)).toBe(10_750);
  });
});
