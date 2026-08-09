import { describe, expect, it, vi } from 'vitest';
import type { PlayerInput, StageState } from '../shared/gameLogic';
import type { BeatClickControl } from './BeatClick';
import type { GameMusicControl } from './GameMusic';
import { RhythmHorrorGame } from './RhythmHorrorGame';

interface GameControls {
  screen: string;
  state: StageState;
  checkpointForRetry: number;
  inputState: PlayerInput;
  onPointerDown(event: PointerEvent): void;
  onPointerUp(event: PointerEvent): void;
  start(checkpoint?: number): Promise<void>;
  togglePause(): Promise<void>;
  update(): void;
}

function setup() {
  let time = 0;
  const canvas = {
    width: 960,
    height: 540,
    getContext: vi.fn(() => ({})),
    focus: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 960, height: 540 })),
    setPointerCapture: vi.fn(),
  } as unknown as HTMLCanvasElement;
  const music: GameMusicControl = {
    restart: vi.fn(() => Promise.resolve()), pause: vi.fn(), resume: vi.fn(() => Promise.resolve()), timeMs: vi.fn(() => time),
  };
  const beatClick: BeatClickControl = {
    start: vi.fn(() => Promise.resolve()), pause: vi.fn(), resume: vi.fn(() => Promise.resolve()), sync: vi.fn(),
  };
  const game = new RhythmHorrorGame(canvas, music, beatClick) as unknown as GameControls;
  return { game, music, beatClick, setTime: (value: number) => { time = value; } };
}

describe('RhythmHorrorGame', () => {
  it('탈출을 시작할 때 상태와 사운드를 함께 초기화한다', async () => {
    const { game, music, beatClick } = setup();
    await game.start();
    expect(game.screen).toBe('playing');
    expect(game.state.hearts).toBe(3);
    expect(music.restart).toHaveBeenCalledOnce();
    expect(beatClick.start).toHaveBeenCalledOnce();
  });

  it('일시정지와 재개가 음악과 메트로놈을 함께 제어한다', async () => {
    const { game, music, beatClick } = setup();
    await game.start();
    await game.togglePause();
    await game.togglePause();
    expect(music.pause).toHaveBeenCalledOnce();
    expect(music.resume).toHaveBeenCalledOnce();
    expect(beatClick.pause).toHaveBeenCalledOnce();
    expect(beatClick.resume).toHaveBeenCalledOnce();
  });

  it('사망하면 마지막 체크포인트를 재시작 위치로 보존한다', async () => {
    const { game, setTime } = setup();
    await game.start();
    game.state = { ...game.state, checkpointX: 670 };
    setTime(60_000);
    game.update();
    expect(game.screen).toBe('result');
    expect(game.checkpointForRetry).toBe(670);
  });

  it('멀티 포인터로 이동과 달리기를 동시에 누르고 각각 해제할 수 있다', async () => {
    const { game } = setup();
    await game.start();
    game.onPointerDown({ pointerId: 1, clientX: 150, clientY: 500 } as PointerEvent);
    game.onPointerDown({ pointerId: 2, clientX: 500, clientY: 500 } as PointerEvent);
    expect(game.inputState.right).toBe(true);
    expect(game.inputState.run).toBe(true);
    game.onPointerUp({ pointerId: 1 } as PointerEvent);
    expect(game.inputState.right).toBe(false);
    expect(game.inputState.run).toBe(true);
  });
});
