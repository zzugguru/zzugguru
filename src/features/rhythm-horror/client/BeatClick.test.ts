import { describe, expect, it, vi } from 'vitest';
import { CHART } from '../shared/content';
import { BeatClick, beatIndexAt } from './BeatClick';

function setup() {
  const oscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const context = {
    currentTime: 1,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  } as unknown as AudioContext;
  return { click: new BeatClick(() => context), context, oscillator };
}

describe('BeatClick', () => {
  it('2초 리드인 뒤의 음악 절대 위치를 채보 인덱스로 바꾼다', () => {
    expect(beatIndexAt(1_999)).toBe(-1);
    expect(beatIndexAt(2_000)).toBe(0);
    expect(beatIndexAt(3_500)).toBe(3);
  });

  it('표시되는 박자에는 한 번만 클릭하고 삭제 박자는 무음으로 둔다', async () => {
    const { click, context, oscillator } = setup();
    await click.start();
    click.sync(CHART[0].timeMs, CHART[0]);
    click.sync(CHART[0].timeMs + 20, CHART[0]);
    const hidden = CHART.find((note) => note.hidden);
    click.sync(hidden?.timeMs ?? 0, hidden);

    expect(context.createOscillator).toHaveBeenCalledOnce();
    expect(oscillator.start).toHaveBeenCalledOnce();
  });
});
