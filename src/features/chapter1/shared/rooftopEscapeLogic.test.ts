import { describe, expect, it } from 'vitest';
import {
  ESCAPE_FLOORS,
  createRooftopEscapeState,
  obstaclesForFloor,
  stepRooftopEscape,
  type EscapeAction,
  type RooftopEscapeState,
} from './rooftopEscapeLogic';

const runRight = { direction: 1 as const, action: 'run' as const };
const runLeft = { direction: -1 as const, action: 'run' as const };

describe('rooftopEscapeLogic', () => {
  it('1F 기본 추격에서 영수와 더 빠른 괴물이 출구 방향으로 이동한다', () => {
    const state = { ...createRooftopEscapeState(), floorGraceSeconds: 0 };
    const moved = stepRooftopEscape(state, runRight, 0.05);

    expect(moved.playerX).toBeGreaterThan(state.playerX);
    expect(moved.monsterX).toBeGreaterThan(state.monsterX);
    expect(moved.monsterX - state.monsterX).toBeGreaterThan(7);
  });

  it('2F 장애물은 점프 중에만 통과하고 놓치면 앞에서 비틀거린다', () => {
    const base: RooftopEscapeState = {
      ...createRooftopEscapeState(),
      floorIndex: 1,
      playerX: 530,
      monsterX: 900,
      floorGraceSeconds: 1,
    };

    const missed = stepRooftopEscape(base, runLeft, 0.05);
    const jumped = stepRooftopEscape(base, { direction: -1, action: 'jump' }, 0.05);

    expect(obstaclesForFloor(1)).toEqual([{ x: 500, kind: 'jump' }]);
    expect(missed.playerX).toBe(522);
    expect(missed.stumbleSeconds).toBeGreaterThan(0.6);
    expect(jumped.playerX).toBeLessThan(522);
    expect(jumped.stumbleSeconds).toBe(0);
  });

  it('3F는 점프와 포복을 서로 다른 장애물에서 요구한다', () => {
    const jumpBase: RooftopEscapeState = {
      ...createRooftopEscapeState(),
      floorIndex: 2,
      playerX: 320,
      monsterX: -80,
      floorGraceSeconds: 1,
    };
    const crawlBase = { ...jumpBase, playerX: 620 };

    expect(obstaclesForFloor(2)).toEqual([
      { x: 350, kind: 'jump' },
      { x: 650, kind: 'crawl' },
    ]);
    expect(stepRooftopEscape(jumpBase, runRight, 0.05).playerX).toBe(328);
    expect(stepRooftopEscape(jumpBase, { direction: 1, action: 'jump' }, 0.05).playerX).toBeGreaterThan(328);
    expect(stepRooftopEscape(crawlBase, { direction: 1, action: 'jump' }, 0.05).playerX).toBe(628);
    expect(stepRooftopEscape(crawlBase, { direction: 1, action: 'crawl' }, 0.05).playerX).toBeGreaterThan(628);
  });

  it('각 출구에서 다음 스테이지로 넘어가고 3F를 마치면 탈출한다', () => {
    let state = { ...createRooftopEscapeState(), playerX: 850 };
    state = stepRooftopEscape(state, { direction: 0, action: 'run' }, 0);
    expect([state.floorIndex, state.playerX, state.monsterX]).toEqual([1, 850, 1040]);

    state = { ...state, playerX: 110 };
    state = stepRooftopEscape(state, { direction: 0, action: 'run' }, 0);
    expect([state.floorIndex, state.playerX, state.monsterX]).toEqual([2, 110, -80]);

    state = { ...state, playerX: 850 };
    expect(stepRooftopEscape(state, { direction: 0, action: 'run' }, 0).result).toBe('escaped');
  });

  it('올바른 동작 경로는 빨라진 괴물을 피해 3개 스테이지를 완주할 수 있다', () => {
    let state = createRooftopEscapeState();
    for (let frame = 0; frame < 2_400 && state.result === 'playing'; frame += 1) {
      const exitRight = state.floorIndex % 2 === 0;
      const obstacle = obstaclesForFloor(state.floorIndex).find(({ x }) => Math.abs(state.playerX - x) < 42);
      const action: EscapeAction = obstacle?.kind ?? 'run';
      state = stepRooftopEscape(state, { direction: exitRight ? 1 : -1, action }, 1 / 60);
    }
    expect(state.result).toBe('escaped');
    expect(state.floorIndex).toBe(ESCAPE_FLOORS.length - 1);
  });

  it('비틀거리는 동안 괴물은 계속 접근해 영수를 붙잡는다', () => {
    let state: RooftopEscapeState = {
      ...createRooftopEscapeState(),
      floorIndex: 1,
      playerX: 522,
      monsterX: 590,
      floorGraceSeconds: 0,
      stumbleSeconds: 0.62,
    };
    for (let frame = 0; frame < 60 && state.result === 'playing'; frame += 1) {
      state = stepRooftopEscape(state, runLeft, 1 / 60);
    }
    expect(state.result).toBe('caught');
  });

  it('완료 상태와 비정상적으로 큰 delta를 안전하게 처리한다', () => {
    const state = { ...createRooftopEscapeState(), playerX: 880 };
    const clamped = stepRooftopEscape(state, runRight, 10);
    expect(clamped.playerX).toBeLessThanOrEqual(890);

    const caught = { ...state, result: 'caught' as const };
    expect(stepRooftopEscape(caught, runRight, 1)).toBe(caught);
  });
});
