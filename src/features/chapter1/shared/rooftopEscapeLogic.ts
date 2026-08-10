export const ESCAPE_FLOORS = ['1F', '2F', '3F'] as const;

export type EscapeResult = 'playing' | 'caught' | 'escaped';
export type EscapeAction = 'run' | 'jump' | 'crawl';
export type EscapeObstacleKind = 'jump' | 'crawl';

export interface EscapeInput {
  direction: -1 | 0 | 1;
  action: EscapeAction;
}

export interface EscapeObstacle {
  x: number;
  kind: EscapeObstacleKind;
}

export interface RooftopEscapeState {
  floorIndex: number;
  playerX: number;
  monsterX: number;
  floorGraceSeconds: number;
  stumbleSeconds: number;
  result: EscapeResult;
}

const PLAYER_SPEED = 245;
const MONSTER_SPEED = 158;
const MONSTER_FLOOR_BONUS = 18;
const CATCH_DISTANCE = 38;
const EXIT_DISTANCE = 24;
const OBSTACLE_DISTANCE = 22;
const STUMBLE_SECONDS = 0.62;
const MIN_X = 70;
const MAX_X = 890;
const FLOOR_GRACE_SECONDS = 0.8;

const EXIT_POSITIONS = [850, 110, 850] as const;
const PLAYER_SPAWNS = [110, 850, 110] as const;
const MONSTER_SPAWNS = [-80, 1040, -80] as const;

const FLOOR_OBSTACLES: readonly (readonly EscapeObstacle[])[] = [
  [],
  [{ x: 500, kind: 'jump' }],
  [{ x: 350, kind: 'jump' }, { x: 650, kind: 'crawl' }],
];

export function createRooftopEscapeState(): RooftopEscapeState {
  return {
    floorIndex: 0,
    playerX: PLAYER_SPAWNS[0],
    monsterX: MONSTER_SPAWNS[0],
    floorGraceSeconds: FLOOR_GRACE_SECONDS,
    stumbleSeconds: 0,
    result: 'playing',
  };
}

export function exitXForFloor(floorIndex: number): number {
  return EXIT_POSITIONS[clampFloorIndex(floorIndex)];
}

export function obstaclesForFloor(floorIndex: number): readonly EscapeObstacle[] {
  return FLOOR_OBSTACLES[clampFloorIndex(floorIndex)];
}

export function stepRooftopEscape(
  state: RooftopEscapeState,
  input: EscapeInput,
  deltaSeconds: number,
): RooftopEscapeState {
  if (state.result !== 'playing') return state;

  const delta = Math.max(0, Math.min(0.05, deltaSeconds));
  const stumbleSeconds = Math.max(0, state.stumbleSeconds - delta);
  const intendedX = stumbleSeconds > 0
    ? state.playerX
    : clamp(state.playerX + input.direction * PLAYER_SPEED * delta, MIN_X, MAX_X);
  const blockedObstacle = crossedWrongObstacle(state, intendedX, input.action);
  const playerX = blockedObstacle
    ? stopBeforeObstacle(state.playerX, intendedX, blockedObstacle.x)
    : intendedX;
  const nextStumbleSeconds = blockedObstacle ? STUMBLE_SECONDS : stumbleSeconds;
  const monsterDirection = Math.sign(playerX - state.monsterX);
  const monsterSpeed = MONSTER_SPEED + state.floorIndex * MONSTER_FLOOR_BONUS;
  const floorGraceSeconds = Math.max(0, state.floorGraceSeconds - delta);
  const monsterX = state.floorGraceSeconds > 0
    ? state.monsterX
    : state.monsterX + monsterDirection * monsterSpeed * delta;

  if (Math.abs(playerX - monsterX) <= CATCH_DISTANCE) {
    return { ...state, playerX, monsterX, floorGraceSeconds, stumbleSeconds: nextStumbleSeconds, result: 'caught' };
  }

  if (Math.abs(playerX - exitXForFloor(state.floorIndex)) <= EXIT_DISTANCE) {
    const nextFloorIndex = state.floorIndex + 1;
    if (nextFloorIndex >= ESCAPE_FLOORS.length) {
      return { ...state, playerX, monsterX, floorGraceSeconds, stumbleSeconds: 0, result: 'escaped' };
    }

    return {
      floorIndex: nextFloorIndex,
      playerX: PLAYER_SPAWNS[nextFloorIndex],
      monsterX: MONSTER_SPAWNS[nextFloorIndex],
      floorGraceSeconds: FLOOR_GRACE_SECONDS,
      stumbleSeconds: 0,
      result: 'playing',
    };
  }

  return { ...state, playerX, monsterX, floorGraceSeconds, stumbleSeconds: nextStumbleSeconds };
}

function crossedWrongObstacle(
  state: RooftopEscapeState,
  intendedX: number,
  action: EscapeAction,
): EscapeObstacle | undefined {
  if (intendedX === state.playerX) return undefined;
  const low = Math.min(state.playerX, intendedX) - OBSTACLE_DISTANCE;
  const high = Math.max(state.playerX, intendedX) + OBSTACLE_DISTANCE;
  return obstaclesForFloor(state.floorIndex).find((obstacle) => (
    obstacle.x >= low
    && obstacle.x <= high
    && action !== obstacle.kind
  ));
}

function stopBeforeObstacle(currentX: number, intendedX: number, obstacleX: number): number {
  return intendedX > currentX
    ? Math.min(intendedX, obstacleX - OBSTACLE_DISTANCE)
    : Math.max(intendedX, obstacleX + OBSTACLE_DISTANCE);
}

function clampFloorIndex(floorIndex: number): number {
  return Math.max(0, Math.min(EXIT_POSITIONS.length - 1, floorIndex));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
