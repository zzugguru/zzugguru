import type { Chapter01Facing, Chapter01Point } from '../shared/chapter01Exploration';

export const CHAPTER01_SPRITE_FRAME_WIDTH = 64;
export const CHAPTER01_SPRITE_FRAME_HEIGHT = 80;
export const CHAPTER01_SPRITE_VISIBLE_BOTTOM = 76;

const FRAME_INDEX: Readonly<Record<Chapter01Facing, number>> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

export function drawChapter01TopViewSprite(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth' | 'naturalHeight'> | null,
  position: Chapter01Point,
  facing: Chapter01Facing,
): boolean {
  if (
    !image?.complete
    || image.naturalWidth !== CHAPTER01_SPRITE_FRAME_WIDTH * 4
    || image.naturalHeight !== CHAPTER01_SPRITE_FRAME_HEIGHT
  ) return false;

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image as CanvasImageSource,
    FRAME_INDEX[facing] * CHAPTER01_SPRITE_FRAME_WIDTH,
    0,
    CHAPTER01_SPRITE_FRAME_WIDTH,
    CHAPTER01_SPRITE_FRAME_HEIGHT,
    Math.round(position.x - CHAPTER01_SPRITE_FRAME_WIDTH / 2),
    Math.round(position.y - CHAPTER01_SPRITE_VISIBLE_BOTTOM),
    CHAPTER01_SPRITE_FRAME_WIDTH,
    CHAPTER01_SPRITE_FRAME_HEIGHT,
  );
  return true;
}
