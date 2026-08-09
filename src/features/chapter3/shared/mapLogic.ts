export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

import { SPACESHIP_MAP, type PlayableMapAssetEntry } from './mapAssetManifest';

export const MAP_BOUNDS: Rect = SPACESHIP_MAP.bounds;
export const PLAYER_SIZE = 26;
export const PLAYER_SPRITE_TOP_OVERHANG = 10;
export const DEVICE: Rect = SPACESHIP_MAP.device!.bounds;
export const OBSTACLES: readonly Rect[] = SPACESHIP_MAP.collisions;

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function movePlayer(position: Point, dx: number, dy: number, map: PlayableMapAssetEntry = SPACESHIP_MAP): Point {
  const tryAxis = (candidate: Point): Point => {
    const body = { ...candidate, width: PLAYER_SIZE, height: PLAYER_SIZE };
    const inside = body.x >= map.bounds.x && body.y - PLAYER_SPRITE_TOP_OVERHANG >= map.bounds.y
      && body.x + body.width <= map.bounds.x + map.bounds.width
      && body.y + body.height <= map.bounds.y + map.bounds.height;
    return inside && !map.collisions.some((obstacle) => overlaps(body, obstacle)) ? candidate : position;
  };
  const afterX = tryAxis({ x: position.x + dx, y: position.y });
  if (afterX !== position) {
    const body = { x: afterX.x, y: afterX.y + dy, width: PLAYER_SIZE, height: PLAYER_SIZE };
    const inside = body.y - PLAYER_SPRITE_TOP_OVERHANG >= map.bounds.y && body.y + body.height <= map.bounds.y + map.bounds.height;
    return inside && !map.collisions.some((obstacle) => overlaps(body, obstacle)) ? { x: afterX.x, y: afterX.y + dy } : afterX;
  }
  return tryAxis({ x: position.x, y: position.y + dy });
}

export function canInteract(position: Point, map: PlayableMapAssetEntry = SPACESHIP_MAP): boolean {
  if (!map.device) return false;
  const playerCenter = { x: position.x + PLAYER_SIZE / 2, y: position.y + PLAYER_SIZE / 2 };
  const device = map.device.bounds;
  const nearestX = Math.max(device.x, Math.min(playerCenter.x, device.x + device.width));
  const nearestY = Math.max(device.y, Math.min(playerCenter.y, device.y + device.height));
  return Math.hypot(playerCenter.x - nearestX, playerCenter.y - nearestY) <= map.device.interactionMargin;
}

export function canActivateDevice(position: Point, deviceComplete: boolean, map: PlayableMapAssetEntry = SPACESHIP_MAP): boolean {
  return !deviceComplete && canInteract(position, map);
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
