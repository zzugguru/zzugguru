import type { Vector2 } from '../shared/vector';

export const OBJECT_SHEET_CELL_SIZE = 362;
export const OBJECT_SHEET_COLUMNS = 4;
export const OBJECT_SHEET_ROWS = 3;

export type InteractionObjectAsset =
  | 'cctv'
  | 'family-photo'
  | 'presence'
  | 'toy'
  | 'memory-school'
  | 'memory-market'
  | 'memory-table'
  | 'archive-exit'
  | 'window-console'
  | 'duty-log';

const FRAME_INDEX: Readonly<Record<InteractionObjectAsset, number>> = {
  cctv: 0,
  'family-photo': 1,
  presence: 2,
  toy: 3,
  'memory-school': 4,
  'memory-market': 5,
  'memory-table': 6,
  'archive-exit': 7,
  'window-console': 8,
  'duty-log': 9,
};

export interface ObjectVisual {
  asset: InteractionObjectAsset;
  position: Vector2;
  width: number;
  height: number;
}

export function drawInteractionObject(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth' | 'naturalHeight'> | null,
  visual: ObjectVisual,
  completed = false,
): boolean {
  if (
    !image?.complete ||
    image.naturalWidth !== OBJECT_SHEET_CELL_SIZE * OBJECT_SHEET_COLUMNS ||
    image.naturalHeight !== OBJECT_SHEET_CELL_SIZE * OBJECT_SHEET_ROWS
  ) return false;

  const index = FRAME_INDEX[visual.asset];
  const previousAlpha = context.globalAlpha;
  context.globalAlpha = completed ? 0.35 : 1;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image as CanvasImageSource,
    index % OBJECT_SHEET_COLUMNS * OBJECT_SHEET_CELL_SIZE,
    Math.floor(index / OBJECT_SHEET_COLUMNS) * OBJECT_SHEET_CELL_SIZE,
    OBJECT_SHEET_CELL_SIZE,
    OBJECT_SHEET_CELL_SIZE,
    Math.round(visual.position.x - visual.width / 2),
    Math.round(visual.position.y - visual.height / 2),
    visual.width,
    visual.height,
  );
  context.globalAlpha = previousAlpha;
  return true;
}
