export const ESCAPE_FLOORS = ['B1', '1F', '2F', '3F'] as const;

export type EscapeResult = 'playing' | 'caught' | 'escaped';

export interface RooftopEscapeState {
  floorIndex: number;
  playerX: number;
  monsterX: number;
  floorGraceSeconds: number;
  result: EscapeResult;
}

const PLAYER_SPEED = 230;
const MONSTER_SPEED = 125;
const MONSTER_FLOOR_BONUS = 12;
const CATCH_DISTANCE = 38;
const EXIT_DISTANCE = 24;
const MIN_X = 70;
const MAX_X = 890;
const FLOOR_GRACE_SECONDS = 1;

const EXIT_POSITIONS = [850, 110, 850, 110] as const;
const PLAYER_SPAWNS = [110, 850, 110, 850] as const;
const MONSTER_SPAWNS = [-80, 1040, -80, 1040] as const;

export function createRooftopEscapeState(): RooftopEscapeState {
  return {
    floorIndex: 0,
    playerX: PLAYER_SPAWNS[0],
    monsterX: MONSTER_SPAWNS[0],
    floorGraceSeconds: FLOOR_GRACE_SECONDS,
    result: 'playing',
  };
}

export function exitXForFloor(floorIndex: number): number {
  return EXIT_POSITIONS[Math.max(0, Math.min(EXIT_POSITIONS.length - 1, floorIndex))];
}

export function stepRooftopEscape(
  state: RooftopEscapeState,
  direction: -1 | 0 | 1,
  deltaSeconds: number,
): RooftopEscapeState {
  if (state.result !== 'playing') return state;

  const delta = Math.max(0, Math.min(0.05, deltaSeconds));
  const playerX = clamp(state.playerX + direction * PLAYER_SPEED * delta, MIN_X, MAX_X);
  const monsterDirection = Math.sign(playerX - state.monsterX);
  const monsterSpeed = MONSTER_SPEED + state.floorIndex * MONSTER_FLOOR_BONUS;
  const floorGraceSeconds = Math.max(0, state.floorGraceSeconds - delta);
  const monsterX = state.floorGraceSeconds > 0
    ? state.monsterX
    : state.monsterX + monsterDirection * monsterSpeed * delta;

  if (Math.abs(playerX - monsterX) <= CATCH_DISTANCE) {
    return { ...state, playerX, monsterX, floorGraceSeconds, result: 'caught' };
  }

  if (Math.abs(playerX - exitXForFloor(state.floorIndex)) <= EXIT_DISTANCE) {
    const nextFloorIndex = state.floorIndex + 1;
    if (nextFloorIndex >= ESCAPE_FLOORS.length) {
      return { ...state, playerX, monsterX, floorGraceSeconds, result: 'escaped' };
    }

    return {
      floorIndex: nextFloorIndex,
      playerX: PLAYER_SPAWNS[nextFloorIndex],
      monsterX: MONSTER_SPAWNS[nextFloorIndex],
      floorGraceSeconds: FLOOR_GRACE_SECONDS,
      result: 'playing',
    };
  }

  return { ...state, playerX, monsterX, floorGraceSeconds };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
