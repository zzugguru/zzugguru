import { describe, expect, it, vi } from 'vitest';
import { CHART, DURATION_MS } from '../shared/content';
import type { RhythmAction } from '../shared/gameLogic';
import type { GameMusicControl } from './GameMusic';
import { RhythmHorrorGame } from './RhythmHorrorGame';

interface GameControls {
  hearts: number;
  progress: number;
  resolved: Set<number>;
  resultSurvived: boolean;
  screen: string;
  threat: number;
  score: number;
  start(): Promise<void>;
  input(action: RhythmAction): void;
  togglePause(): Promise<void>;
  update(): void;
}

function setup() {
  let time = 0;
  const canvas = { getContext: vi.fn(() => ({})) } as unknown as HTMLCanvasElement;
  const music: GameMusicControl = {
    restart: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    resume: vi.fn(() => Promise.resolve()),
    timeMs: vi.fn(() => time),
  };
  const game = new RhythmHorrorGame(canvas, music) as unknown as GameControls;
  return { game, music, setTime: (value: number) => { time = value; } };
}

describe('RhythmHorrorGame', () => {
  it('새 근무를 시작할 때 음악과 게임 상태를 처음부터 다시 시작한다', async () => {
    const { game, music } = setup();
    await game.start();
    game.hearts = 1;
    await game.start();
    expect(game.hearts).toBe(3);
    expect(music.restart).toHaveBeenCalledTimes(2);
  });

  it('빛에서는 숨기고 어둠에서는 이동하면 점수와 진행을 얻는다', async () => {
    const { game, setTime } = setup();
    await game.start();
    setTime(CHART[0].timeMs);
    game.input('hide');
    setTime(CHART[2].timeMs);
    game.input('move');
    expect(game.score).toBeGreaterThan(0);
    expect(game.progress).toBe(1);
  });

  it('박자에 맞아도 반대 행동을 하면 추격 위험이 증가한다', async () => {
    const { game, setTime } = setup();
    await game.start();
    const before = game.threat;
    setTime(CHART[0].timeMs);
    game.input('move');
    expect(game.threat).toBeGreaterThan(before);
    expect(game.progress).toBe(0);
  });

  it('일시정지와 재개에서 음악을 함께 제어한다', async () => {
    const { game, music } = setup();
    await game.start();
    await game.togglePause();
    await game.togglePause();
    expect(music.pause).toHaveBeenCalledOnce();
    expect(music.resume).toHaveBeenCalledOnce();
  });

  it('곡의 게임 구간이 끝나면 음악을 멈추고 결과로 전환한다', async () => {
    const { game, music, setTime } = setup();
    await game.start();
    game.progress = 38;
    game.resolved = new Set(CHART.map((note) => note.id));
    setTime(DURATION_MS + 1);
    game.update();
    expect(game.screen).toBe('result');
    expect(game.resultSurvived).toBe(true);
    expect(music.pause).toHaveBeenCalledOnce();
  });
});
