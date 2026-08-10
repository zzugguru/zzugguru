import type { Rect } from '../shared/mapMovement';
import { scaleRectFromCenter } from '../../../shared/geometry';

export interface MapVisual {
  backgroundUrl: string;
  floor: Rect;
  collisions: readonly Rect[];
}

const assetUrl = (name: string): string => new URL(`../assets/${name}`, import.meta.url).href;

export const SECURITY_OFFICE: MapVisual = {
  backgroundUrl: assetUrl('security-office.png'),
  floor: { x: 112, y: 256, width: 736, height: 244 },
  collisions: [
    { x: 248, y: 78, width: 456, height: 178 },
    { x: 88, y: 310, width: 168, height: 118 },
    { x: 688, y: 340, width: 172, height: 130 },
  ].map((rect) => scaleRectFromCenter(rect)),
};

export const ALIEN_CHILDHOOD_ROOM: MapVisual = {
  backgroundUrl: assetUrl('alien-childhood-room.png'),
  floor: { x: 96, y: 160, width: 768, height: 316 },
  collisions: [
    { x: 88, y: 145, width: 156, height: 176 },
    { x: 714, y: 326, width: 130, height: 98 },
  ].map((rect) => scaleRectFromCenter(rect)),
};

export const HOLOGRAM_ARCHIVE: MapVisual = {
  backgroundUrl: assetUrl('hologram-archive.png'),
  floor: { x: 64, y: 256, width: 832, height: 234 },
  collisions: [
    { x: 170, y: 100, width: 162, height: 156 },
    { x: 399, y: 100, width: 162, height: 156 },
    { x: 628, y: 100, width: 162, height: 156 },
  ].map((rect) => scaleRectFromCenter(rect)),
};

export const EARTH_OBSERVATION_ROOM: MapVisual = {
  backgroundUrl: assetUrl('earth-observation-room.png'),
  floor: { x: 124, y: 146, width: 712, height: 334 },
  collisions: [
    { x: 714, y: 205, width: 86, height: 150 },
    { x: 132, y: 130, width: 86, height: 116 },
  ].map((rect) => scaleRectFromCenter(rect)),
};

export function createLoadedImage(url: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = url;
  return image;
}
