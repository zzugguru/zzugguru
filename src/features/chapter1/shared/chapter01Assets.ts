export interface AlphaBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Chapter01SpriteMetadata {
  sourceWidth: number;
  sourceHeight: number;
  alphaBounds: AlphaBounds;
  renderHeight: number;
}

export interface SpriteDrawGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface RasterDrawGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export const CHAPTER01_CANVAS = { width: 960, height: 540 } as const;

export const CHAPTER01_IDENTITY_SOURCE = {
  path: 'src/assets/yeongsu-guard.png',
  width: 1024,
  height: 1024,
  format: 'JPEG',
  colorMode: 'RGB',
} as const;

export const CHAPTER01_BACKGROUNDS = {
  guardRoom: {
    path: 'src/features/chapter1/assets/chapter01-guard-room.png',
    width: 1672,
    height: 941,
    format: 'PNG',
    colorMode: 'RGB',
  },
  cctvWall: {
    path: 'src/features/chapter1/assets/chapter01-cctv-wall.png',
    width: 1672,
    height: 941,
    format: 'PNG',
    colorMode: 'RGB',
  },
  apartmentStairwell: {
    path: 'src/features/chapter1/assets/chapter01-apartment-stairwell.png',
    width: 1672,
    height: 941,
    format: 'PNG',
    colorMode: 'RGB',
  },
  rooftop: {
    path: 'src/features/chapter1/assets/chapter01-rooftop.png',
    width: 1672,
    height: 941,
    format: 'PNG',
    colorMode: 'RGB',
  },
} as const;

export const CHAPTER01_SPRITES = {
  yeongsu: {
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: { left: 357, top: 91, right: 952, bottom: 1177 },
    renderHeight: 116,
  },
  monster: {
    sourceWidth: 1254,
    sourceHeight: 1254,
    alphaBounds: { left: 204, top: 110, right: 940, bottom: 1106 },
    renderHeight: 178,
  },
} as const satisfies Record<string, Chapter01SpriteMetadata>;

export function getSpriteDrawGeometry(
  metadata: Chapter01SpriteMetadata,
  anchorX: number,
  floorY: number,
  renderHeight = metadata.renderHeight,
): SpriteDrawGeometry {
  const scale = renderHeight / metadata.sourceHeight;
  const visibleCenterX = (metadata.alphaBounds.left + metadata.alphaBounds.right) / 2;

  return {
    x: anchorX - visibleCenterX * scale,
    y: floorY - metadata.alphaBounds.bottom * scale,
    width: metadata.sourceWidth * scale,
    height: renderHeight,
    scale,
  };
}

export function getContainedRasterGeometry(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  horizontalAlignment = 0.5,
  verticalAlignment = 0.5,
): RasterDrawGeometry {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (targetWidth - width) * horizontalAlignment,
    y: (targetHeight - height) * verticalAlignment,
    width,
    height,
    scale,
  };
}
