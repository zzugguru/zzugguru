import { describe, expect, it } from 'vitest';
import {
  BEAT_MS,
  EXIT_X,
  NOISE_OBSTACLES,
  STAGE_DURATION_MS,
  beatAt,
  buildBeatChart,
  createStageState,
  isHiddenBeat,
  phaseForBeat,
  stepStage,
  type PlayerInput,
} from './gameLogic';

const still: PlayerInput = { left: false, right: false, crouch: false, run: false, interact: false };
const right: PlayerInput = { ...still, right: true };

describe('4번째 박자 횡스크롤 스텔스 규칙', () => {
  it('120 BPM에서 1·2는 빛, 3·4는 어둠으로 반복된다', () => {
    expect(BEAT_MS).toBe(500);
    expect([1, 2, 3, 4].map(phaseForBeat)).toEqual(['light', 'light', 'dark', 'dark']);
    expect(buildBeatChart().slice(0, 4).map((note) => note.phase)).toEqual(['light', 'light', 'dark', 'dark']);
  });

  it('빛에서는 이동하지 않으면 안전하고 움직이기 시작하면 체력과 긴장을 잃는다', () => {
    const state = createStageState();
    const safe = stepStage(state, still, 2_000, 100);
    const exposed = stepStage(state, right, 2_000, 100);
    expect(safe.hearts).toBe(3);
    expect(exposed.hearts).toBe(2);
    expect(exposed.monsterMode).toBe('investigate');
    expect(exposed.playerX).toBe(state.playerX);
  });

  it('어둠에서는 좌우 이동이 실제 월드 위치를 바꾼다', () => {
    const state = createStageState();
    const time = 3_000;
    expect(beatAt(time).phase).toBe('dark');
    const moved = stepStage(state, right, time, 500);
    expect(moved.playerX).toBeGreaterThan(state.playerX);
    expect(moved.hearts).toBe(3);
  });

  it('철제 장애물을 서서 통과하면 소음이 나고, 몸을 낮추면 조용히 지난다', () => {
    const obstacle = NOISE_OBSTACLES[0];
    const base = { ...createStageState(), playerX: obstacle - 8 };
    const loud = stepStage(base, right, 3_000, 200);
    const quiet = stepStage(base, { ...right, crouch: true }, 3_000, 300);
    expect(loud.lastNoiseX).not.toBeNull();
    expect(loud.monsterMode).toBe('investigate');
    expect(quiet.lastNoiseX).toBeNull();
  });

  it('중반 이후 표시 박자를 삭제하지만 실제 시간 간격은 유지한다', () => {
    const chart = buildBeatChart();
    expect(isHiddenBeat(59)).toBe(false);
    expect(isHiddenBeat(61)).toBe(true);
    expect(chart[62].timeMs - chart[61].timeMs).toBe(BEAT_MS);
    expect(isHiddenBeat(97)).toBe(true);
  });

  it('비상문 앞에서 상호작용해야 탈출하고 60초가 지나면 실패한다', () => {
    const atExit = { ...createStageState(), playerX: EXIT_X };
    expect(stepStage(atExit, { ...still, interact: true }, 54_999, 16).result).toBe('playing');
    expect(stepStage(atExit, { ...still, interact: true }, 55_000, 16).result).toBe('escaped');
    expect(stepStage(createStageState(), still, STAGE_DURATION_MS, 16).result).toBe('dead');
  });

  it('조사 중이어도 빛에서는 괴물이 정지한다', () => {
    const investigating = {
      ...createStageState(),
      monsterX: 300,
      monsterMode: 'investigate' as const,
      monsterTargetX: 500,
      lastNoiseX: 500,
      noiseUntilMs: 5_000,
    };
    const next = stepStage(investigating, still, 2_000, 100);
    expect(next.monsterMode).toBe('investigate');
    expect(next.monsterX).toBe(300);
  });

  it('세 번째 빛 구간 실수는 즉시 사망으로 처리한다', () => {
    const critical = { ...createStageState(), hearts: 1 };
    const next = stepStage(critical, right, 2_000, 16);
    expect(next.hearts).toBe(0);
    expect(next.result).toBe('dead');
  });

  it('엄폐물에서 몸을 낮추면 최종 구간 전 추격을 끊는다', () => {
    const hiding = {
      ...createStageState(),
      playerX: 520,
      monsterX: 410,
      monsterMode: 'chase' as const,
    };
    const next = stepStage(hiding, { ...still, crouch: true }, 3_000, 16);
    expect(next.monsterMode).toBe('patrol');
  });

  it('규칙을 지킨 입력으로 시작점부터 최종 추격과 비상문까지 완주할 수 있다', () => {
    let state = createStageState();
    let finalChaseFrames = 0;
    let escapedAt = 0;
    for (let time = 0; time < STAGE_DURATION_MS && state.result === 'playing'; time += 16) {
      const dark = beatAt(time).phase === 'dark';
      const crouch = NOISE_OBSTACLES.some((obstacle) => Math.abs(state.playerX - obstacle) < 34);
      state = stepStage(state, {
        ...still,
        right: dark || time >= 50_000,
        crouch,
        run: time >= 50_000,
        interact: time >= 55_000 && state.playerX >= EXIT_X - 24,
      }, time, 16);
      if (time >= 50_000 && state.monsterMode === 'chase') finalChaseFrames += 1;
      if (state.result === 'escaped') escapedAt = time;
    }
    expect(state.result).toBe('escaped');
    expect(state.hearts).toBeGreaterThan(0);
    expect(state.checkpointX).toBeGreaterThan(70);
    expect(finalChaseFrames).toBeGreaterThanOrEqual(250);
    expect(escapedAt).toBeGreaterThanOrEqual(55_000);
  });
});
