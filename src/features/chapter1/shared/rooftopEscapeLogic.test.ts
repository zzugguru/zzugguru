import { describe, expect, it } from 'vitest';
import {
  ESCAPE_FLOORS,
  createRooftopEscapeState,
  exitXForFloor,
  stepRooftopEscape,
} from './rooftopEscapeLogic';

describe('rooftop escape logic', () => {
  it('리듬 입력 없이 좌우 방향만으로 영수를 이동시킨다', () => {
    const state = { ...createRooftopEscapeState(), floorGraceSeconds: 0 };
    const moved = stepRooftopEscape(state, 1, 0.05);

    expect(moved.playerX).toBeGreaterThan(state.playerX);
    expect(moved.monsterX).toBeGreaterThan(state.monsterX);
    expect(moved.result).toBe('playing');
  });

  it('계단에 도달할 때마다 다음 층 반대편에서 추격을 이어간다', () => {
    const state = { ...createRooftopEscapeState(), playerX: exitXForFloor(0) };
    const nextFloor = stepRooftopEscape(state, 0, 0);

    expect(nextFloor.floorIndex).toBe(1);
    expect(nextFloor.playerX).toBeGreaterThan(exitXForFloor(1));
    expect(nextFloor.monsterX).toBeGreaterThan(nextFloor.playerX);
  });

  it('괴물과 가까워지면 붙잡힌다', () => {
    const state = {
      ...createRooftopEscapeState(),
      playerX: 300,
      monsterX: 330,
      floorGraceSeconds: 0,
    };

    expect(stepRooftopEscape(state, 0, 0.01).result).toBe('caught');
  });

  it('시작 직후에는 방향을 판단할 반응 시간을 준다', () => {
    let state = createRooftopEscapeState();
    for (let frame = 0; frame < 20; frame += 1) {
      state = stepRooftopEscape(state, 0, 0.05);
    }

    expect(state.result).toBe('playing');
  });

  it('층 전환 직후 이전 방향을 1초간 유지해도 반대 방향으로 바꿀 수 있다', () => {
    let state = stepRooftopEscape(
      { ...createRooftopEscapeState(), playerX: exitXForFloor(0) },
      0,
      0,
    );

    for (let frame = 0; frame < 20; frame += 1) {
      state = stepRooftopEscape(state, 1, 0.05);
    }

    expect(state.floorIndex).toBe(1);
    expect(state.result).toBe('playing');
    expect(state.monsterX).toBe(1040);
  });

  it('마지막 층 계단에 도달하면 옥상 탈출에 성공한다', () => {
    const lastFloorIndex = ESCAPE_FLOORS.length - 1;
    const state = {
      ...createRooftopEscapeState(),
      floorIndex: lastFloorIndex,
      playerX: exitXForFloor(lastFloorIndex),
      monsterX: 900,
    };

    expect(stepRooftopEscape(state, 0, 0).result).toBe('escaped');
  });

  it('각 층 계단 방향으로 계속 이동하면 리듬 판정 없이 옥상까지 완주한다', () => {
    let state = createRooftopEscapeState();

    for (let frame = 0; frame < 600 && state.result === 'playing'; frame += 1) {
      const direction = exitXForFloor(state.floorIndex) > state.playerX ? 1 : -1;
      state = stepRooftopEscape(state, direction, 0.05);
    }

    expect(state.result).toBe('escaped');
  });
});
