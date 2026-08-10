export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const OBJECT_COLLISION_SCALE = 0.9;

export function scaleRectFromCenter<T extends RectLike>(rect: T, scale = OBJECT_COLLISION_SCALE): T {
  const width = rect.width * scale;
  const height = rect.height * scale;
  return {
    ...rect,
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}
