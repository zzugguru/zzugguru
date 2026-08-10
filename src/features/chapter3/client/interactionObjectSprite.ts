export const OBJECT_SHEET_CELL_SIZE = 362;
export const OBJECT_SHEET_COLUMNS = 4;
export const OBJECT_SHEET_ROWS = 3;

export type InteractionObjectAsset =
  | 'reconstruction-device'
  | 'photo'
  | 'market'
  | 'tool'
  | 'lens'
  | 'bowl'
  | 'archive-photo'
  | 'archive-voice'
  | 'archive-tool'
  | 'archive-star'
  | 'archive-table'
  | 'archive-door';

const FRAME_INDEX: Readonly<Record<InteractionObjectAsset, number>> = {
  'reconstruction-device': 0,
  photo: 1,
  market: 2,
  tool: 3,
  lens: 4,
  bowl: 5,
  'archive-photo': 6,
  'archive-voice': 7,
  'archive-tool': 8,
  'archive-star': 9,
  'archive-table': 10,
  'archive-door': 11,
};

export function drawInteractionObject(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth' | 'naturalHeight'>,
  asset: InteractionObjectAsset,
  center: { x: number; y: number },
  size: { width: number; height: number },
  completed = false,
): boolean {
  if (
    !image.complete ||
    image.naturalWidth !== OBJECT_SHEET_CELL_SIZE * OBJECT_SHEET_COLUMNS ||
    image.naturalHeight !== OBJECT_SHEET_CELL_SIZE * OBJECT_SHEET_ROWS
  ) return false;

  const index = FRAME_INDEX[asset];
  const previousAlpha = context.globalAlpha;
  context.globalAlpha = completed ? 0.4 : 1;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image as CanvasImageSource,
    index % OBJECT_SHEET_COLUMNS * OBJECT_SHEET_CELL_SIZE,
    Math.floor(index / OBJECT_SHEET_COLUMNS) * OBJECT_SHEET_CELL_SIZE,
    OBJECT_SHEET_CELL_SIZE,
    OBJECT_SHEET_CELL_SIZE,
    Math.round(center.x - size.width / 2),
    Math.round(center.y - size.height / 2),
    size.width,
    size.height,
  );
  context.globalAlpha = previousAlpha;
  return true;
}
