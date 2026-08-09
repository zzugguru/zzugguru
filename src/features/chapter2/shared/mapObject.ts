import { isWithinRange } from './proximity';
import type { Vector2 } from './vector';

export interface MapObject {
  id: string;
  position: Vector2;
  interactionRadius: number;
  required: boolean;
}

export function isPlayerNearObject(playerPosition: Vector2, object: MapObject): boolean {
  return isWithinRange(playerPosition, object.position, object.interactionRadius);
}

/** 필수(required) 오브젝트를 전부 상호작용했으면 맵이 완료된 것으로 본다. */
export function isMapComplete(objects: MapObject[], interactedIds: ReadonlySet<string>): boolean {
  return objects.filter((object) => object.required).every((object) => interactedIds.has(object.id));
}
