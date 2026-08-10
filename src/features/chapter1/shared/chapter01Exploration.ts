export type Chapter01Direction = 'up' | 'down' | 'left' | 'right';
export type Chapter01Facing = 'down' | 'left' | 'right' | 'up';
export type Chapter01ExplorationScene = 'guard-room' | 'basement' | 'whiteout';

export interface Chapter01Point {
  x: number;
  y: number;
}

export interface Chapter01Obstacle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Chapter01ExplorationDefinition {
  id: 'guard-desk' | 'basement-stairs' | 'whiteout-anchor';
  beatIndex: number;
  scene: Chapter01ExplorationScene;
  start: Chapter01Point;
  target: Chapter01Point;
  targetRadius: number;
  bounds: { left: number; top: number; right: number; bottom: number };
  obstacles: readonly Chapter01Obstacle[];
  objective: string;
  interactLabel: string;
}

export const CHAPTER01_STORY_PLAYFIELDS = {
  'guard-room': { left: 136, top: 104, right: 900, bottom: 364 },
  basement: { left: 48, top: 64, right: 912, bottom: 364 },
  whiteout: { left: 24, top: 32, right: 936, bottom: 364 },
} as const satisfies Readonly<Record<Chapter01ExplorationScene, { left: number; top: number; right: number; bottom: number }>>;

export const CHAPTER01_PLAYER_VISIBLE_EXTENTS = {
  left: 18,
  top: 68,
  right: 18,
  bottom: 0,
} as const;

export const CHAPTER01_PLAYER_COLLISION = {
  halfWidth: 13,
  height: 26,
} as const;

export const CHAPTER01_EXPLORATIONS = [
  {
    id: 'guard-desk',
    beatIndex: 1,
    scene: 'guard-room',
    start: { x: 820, y: 270 },
    target: { x: 480, y: 316 },
    targetRadius: 46,
    bounds: { left: 96, top: 148, right: 864, bottom: 340 },
    obstacles: [
      { left: 86, top: 96, right: 304, bottom: 250 },
      { left: 318, top: 120, right: 610, bottom: 286 },
      { left: 624, top: 84, right: 800, bottom: 252 },
      { left: 82, top: 294, right: 240, bottom: 364 },
      { left: 680, top: 286, right: 806, bottom: 364 },
      { left: 844, top: 210, right: 900, bottom: 364 },
    ],
    objective: '경비실 책상으로 이동하세요.',
    interactLabel: '경비일지를 펼친다',
  },
  {
    id: 'basement-stairs',
    beatIndex: 10,
    scene: 'basement',
    start: { x: 160, y: 320 },
    target: { x: 786, y: 304 },
    targetRadius: 48,
    bounds: { left: 92, top: 164, right: 868, bottom: 340 },
    obstacles: [
      { left: 48, top: 64, right: 912, bottom: 182 },
      { left: 48, top: 166, right: 142, bottom: 288 },
      { left: 812, top: 64, right: 912, bottom: 278 },
    ],
    objective: '오른쪽 계단 입구를 확인하세요.',
    interactLabel: '계단의 인기척을 확인한다',
  },
  {
    id: 'whiteout-anchor',
    beatIndex: 39,
    scene: 'whiteout',
    start: { x: 480, y: 326 },
    target: { x: 480, y: 142 },
    targetRadius: 44,
    bounds: { left: 176, top: 116, right: 784, bottom: 340 },
    obstacles: [],
    objective: '흰 빛 속의 어두운 잔상을 향해 움직이세요.',
    interactLabel: '잔상을 붙잡고 버틴다',
  },
] as const satisfies readonly Chapter01ExplorationDefinition[];

export function explorationForBeat(beatIndex: number): Chapter01ExplorationDefinition | undefined {
  return CHAPTER01_EXPLORATIONS.find((exploration) => exploration.beatIndex === beatIndex);
}

export function facingForDirection(
  direction: Chapter01Direction | null,
  current: Chapter01Facing,
): Chapter01Facing {
  return direction ?? current;
}

export function moveExplorationPlayer(
  position: Chapter01Point,
  direction: Chapter01Direction | null,
  deltaSeconds: number,
  definition: Chapter01ExplorationDefinition,
): Chapter01Point {
  if (!direction) return position;
  const distance = 220 * Math.max(0, Math.min(0.05, deltaSeconds));
  const dx = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
  const dy = direction === 'up' ? -distance : direction === 'down' ? distance : 0;

  return moveExplorationPlayerBy(position, dx, dy, definition);
}

export function moveExplorationPlayerToward(
  position: Chapter01Point,
  target: Chapter01Point,
  deltaSeconds: number,
  definition: Chapter01ExplorationDefinition,
): { position: Chapter01Point; facing: Chapter01Facing; reached: boolean } {
  const safeTarget = clampExplorationPoint(target, definition);
  const dx = safeTarget.x - position.x;
  const dy = safeTarget.y - position.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 3) return { position, facing: 'down', reached: true };

  const step = Math.min(distance, 220 * Math.max(0, Math.min(0.05, deltaSeconds)));
  const next = moveExplorationPlayerBy(
    position,
    (dx / distance) * step,
    (dy / distance) * step,
    definition,
  );
  const facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  return { position: next, facing, reached: Math.hypot(safeTarget.x - next.x, safeTarget.y - next.y) <= 3 };
}

export function getSafeExplorationAnchorBounds(definition: Chapter01ExplorationDefinition) {
  const playfield = CHAPTER01_STORY_PLAYFIELDS[definition.scene];
  return {
    left: Math.max(definition.bounds.left, playfield.left + CHAPTER01_PLAYER_VISIBLE_EXTENTS.left),
    top: Math.max(definition.bounds.top, playfield.top + CHAPTER01_PLAYER_VISIBLE_EXTENTS.top),
    right: Math.min(definition.bounds.right, playfield.right - CHAPTER01_PLAYER_VISIBLE_EXTENTS.right),
    bottom: Math.min(definition.bounds.bottom, playfield.bottom - CHAPTER01_PLAYER_VISIBLE_EXTENTS.bottom),
  };
}

export function clampExplorationPoint(
  point: Chapter01Point,
  definition: Chapter01ExplorationDefinition,
): Chapter01Point {
  const bounds = getSafeExplorationAnchorBounds(definition);
  return {
    x: clamp(point.x, bounds.left, bounds.right),
    y: clamp(point.y, bounds.top, bounds.bottom),
  };
}

export function getExplorationPlayerVisibleBounds(position: Chapter01Point) {
  return {
    left: position.x - CHAPTER01_PLAYER_VISIBLE_EXTENTS.left,
    top: position.y - CHAPTER01_PLAYER_VISIBLE_EXTENTS.top,
    right: position.x + CHAPTER01_PLAYER_VISIBLE_EXTENTS.right,
    bottom: position.y + CHAPTER01_PLAYER_VISIBLE_EXTENTS.bottom,
  };
}

export function getExplorationPlayerCollisionBounds(position: Chapter01Point) {
  return {
    left: position.x - CHAPTER01_PLAYER_COLLISION.halfWidth,
    top: position.y - CHAPTER01_PLAYER_COLLISION.height,
    right: position.x + CHAPTER01_PLAYER_COLLISION.halfWidth,
    bottom: position.y,
  };
}

export function isExplorationPositionAllowed(
  position: Chapter01Point,
  definition: Chapter01ExplorationDefinition,
): boolean {
  const safe = getSafeExplorationAnchorBounds(definition);
  if (
    position.x < safe.left
    || position.x > safe.right
    || position.y < safe.top
    || position.y > safe.bottom
  ) return false;

  const body = getExplorationPlayerCollisionBounds(position);
  return !definition.obstacles.some((obstacle) => (
    body.left < obstacle.right
    && body.right > obstacle.left
    && body.top < obstacle.bottom
    && body.bottom > obstacle.top
  ));
}

export function isExplorationTargetReached(
  position: Chapter01Point,
  definition: Chapter01ExplorationDefinition,
): boolean {
  return Math.hypot(position.x - definition.target.x, position.y - definition.target.y)
    <= definition.targetRadius;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function moveExplorationPlayerBy(
  position: Chapter01Point,
  dx: number,
  dy: number,
  definition: Chapter01ExplorationDefinition,
): Chapter01Point {
  const xCandidate = clampExplorationPoint({ x: position.x + dx, y: position.y }, definition);
  const afterX = isExplorationPositionAllowed(xCandidate, definition) ? xCandidate : position;
  const yCandidate = clampExplorationPoint({ x: afterX.x, y: afterX.y + dy }, definition);
  return isExplorationPositionAllowed(yCandidate, definition) ? yCandidate : afterX;
}
