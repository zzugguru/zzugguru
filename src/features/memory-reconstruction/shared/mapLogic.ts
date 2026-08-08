export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export const MAP_BOUNDS: Rect = { x: 48, y: 72, width: 864, height: 420 };
export const PLAYER_SIZE = 26;
export const DEVICE: Rect = { x: 704, y: 190, width: 92, height: 116 };
export const OBSTACLES: readonly Rect[] = [
  { x: 180, y: 132, width: 170, height: 58 },
  { x: 180, y: 365, width: 170, height: 58 },
  { x: 430, y: 106, width: 80, height: 132 },
  { x: 430, y: 326, width: 80, height: 132 },
  DEVICE,
];

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function movePlayer(position: Point, dx: number, dy: number): Point {
  const tryAxis = (candidate: Point): Point => {
    const body = { ...candidate, width: PLAYER_SIZE, height: PLAYER_SIZE };
    const inside = body.x >= MAP_BOUNDS.x && body.y >= MAP_BOUNDS.y
      && body.x + body.width <= MAP_BOUNDS.x + MAP_BOUNDS.width
      && body.y + body.height <= MAP_BOUNDS.y + MAP_BOUNDS.height;
    return inside && !OBSTACLES.some((obstacle) => overlaps(body, obstacle)) ? candidate : position;
  };
  const afterX = tryAxis({ x: position.x + dx, y: position.y });
  if (afterX !== position) {
    const body = { x: afterX.x, y: afterX.y + dy, width: PLAYER_SIZE, height: PLAYER_SIZE };
    const inside = body.y >= MAP_BOUNDS.y && body.y + body.height <= MAP_BOUNDS.y + MAP_BOUNDS.height;
    return inside && !OBSTACLES.some((obstacle) => overlaps(body, obstacle)) ? { x: afterX.x, y: afterX.y + dy } : afterX;
  }
  return tryAxis({ x: position.x, y: position.y + dy });
}

export function canInteract(position: Point): boolean {
  const playerCenter = { x: position.x + PLAYER_SIZE / 2, y: position.y + PLAYER_SIZE / 2 };
  const deviceCenter = { x: DEVICE.x + DEVICE.width / 2, y: DEVICE.y + DEVICE.height / 2 };
  return Math.hypot(playerCenter.x - deviceCenter.x, playerCenter.y - deviceCenter.y) <= 118;
}

export function canActivateDevice(position: Point, deviceComplete: boolean): boolean {
  return !deviceComplete && canInteract(position);
}

export type FlowState = {
  scene: 'map' | 'puzzle' | 'result';
  deviceComplete: boolean;
  outcome: 'success' | 'failure' | null;
};
export type FlowEvent =
  | { type: 'interact'; allowed: boolean }
  | { type: 'puzzle-success' }
  | { type: 'puzzle-failure' }
  | { type: 'retry' }
  | { type: 'return-to-map' };

export function createFlow(): FlowState {
  return { scene: 'map', deviceComplete: false, outcome: null };
}

export function transitionFlow(state: FlowState, event: FlowEvent): FlowState {
  if (event.type === 'interact') {
    return state.scene === 'map' && event.allowed && !state.deviceComplete
      ? { ...state, scene: 'puzzle', outcome: null }
      : state;
  }
  if (event.type === 'puzzle-success' && state.scene === 'puzzle') return { ...state, scene: 'result', outcome: 'success' };
  if (event.type === 'puzzle-failure' && state.scene === 'puzzle') return { ...state, scene: 'result', outcome: 'failure' };
  if (event.type === 'retry' && state.scene === 'result' && state.outcome === 'failure') return { ...state, scene: 'puzzle', outcome: null };
  if (event.type === 'return-to-map' && state.scene === 'result') {
    return { scene: 'map', deviceComplete: state.deviceComplete || state.outcome === 'success', outcome: null };
  }
  return state;
}

export function clearDirections<T>(directions: Set<T>): void {
  directions.clear();
}
