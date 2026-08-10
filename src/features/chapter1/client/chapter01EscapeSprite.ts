import { CHAPTER01_TOPVIEW_SPRITE } from '../shared/chapter01Assets';

export type HorizontalFacing = -1 | 1;

export const CHAPTER01_ESCAPE_YEONGSU = {
  sourceX: CHAPTER01_TOPVIEW_SPRITE.frameWidth * 2,
  sourceY: 0,
  sourceWidth: CHAPTER01_TOPVIEW_SPRITE.frameWidth,
  sourceHeight: CHAPTER01_TOPVIEW_SPRITE.frameHeight,
  alphaBounds: CHAPTER01_TOPVIEW_SPRITE.alphaBounds[2],
  scale: 2,
} as const;

export interface EscapeSpriteGeometry {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destinationX: number;
  destinationY: number;
  destinationWidth: number;
  destinationHeight: number;
}

export function getEscapeYeongsuGeometry(floorY: number): EscapeSpriteGeometry {
  const sprite = CHAPTER01_ESCAPE_YEONGSU;
  const destinationWidth = sprite.sourceWidth * sprite.scale;
  const destinationHeight = sprite.sourceHeight * sprite.scale;

  return {
    sourceX: sprite.sourceX,
    sourceY: sprite.sourceY,
    sourceWidth: sprite.sourceWidth,
    sourceHeight: sprite.sourceHeight,
    destinationX: -destinationWidth / 2,
    destinationY: floorY - sprite.alphaBounds.bottom * sprite.scale,
    destinationWidth,
    destinationHeight,
  };
}

export function getEscapeYeongsuVisibleBounds(anchorX: number, floorY: number) {
  const sprite = CHAPTER01_ESCAPE_YEONGSU;
  const frameCenterX = sprite.sourceWidth / 2;
  return {
    left: anchorX + (sprite.alphaBounds.left - frameCenterX) * sprite.scale,
    top: floorY - (sprite.alphaBounds.bottom - sprite.alphaBounds.top) * sprite.scale,
    right: anchorX + (sprite.alphaBounds.right - frameCenterX) * sprite.scale,
    bottom: floorY,
  };
}

export function horizontalFacingForDirection(
  direction: -1 | 0 | 1,
  previousFacing: HorizontalFacing,
): HorizontalFacing {
  return direction === 0 ? previousFacing : direction;
}
