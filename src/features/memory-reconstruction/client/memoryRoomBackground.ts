export function drawMemoryRoomBackground(
  context: CanvasRenderingContext2D,
  image: Pick<HTMLImageElement, 'complete' | 'naturalWidth'>,
  width = 960,
  height = 540,
): boolean {
  if (!image.complete || image.naturalWidth === 0) return false;
  context.imageSmoothingEnabled = false;
  context.drawImage(image as CanvasImageSource, 0, 0, width, height);
  return true;
}
