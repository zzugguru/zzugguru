import { describe, expect, it } from 'vitest';
import {
  CHAPTER01_BACKGROUNDS,
  CHAPTER01_CANVAS,
  CHAPTER01_IDENTITY_SOURCE,
  CHAPTER01_SPRITES,
  CHAPTER01_TOPVIEW_BACKGROUNDS,
  CHAPTER01_TOPVIEW_SPRITE,
  getContainedRasterGeometry,
  getCoverRasterGeometry,
  getSpriteDrawGeometry,
} from './chapter01Assets';

describe('Chapter 01 asset layout metadata', () => {
  it('keeps the canonical Yeongsu identity source and four scene backgrounds explicit', () => {
    expect(CHAPTER01_IDENTITY_SOURCE).toEqual({
      path: 'src/assets/yeongsu-guard.png',
      width: 1024,
      height: 1024,
      format: 'JPEG',
      colorMode: 'RGB',
    });
    expect(Object.keys(CHAPTER01_BACKGROUNDS)).toEqual([
      'guardRoom',
      'cctvWall',
      'apartmentStairwell',
      'rooftop',
    ]);

    for (const background of Object.values(CHAPTER01_BACKGROUNDS)) {
      expect([background.width, background.height, background.format, background.colorMode]).toEqual([
        1672,
        941,
        'PNG',
        'RGB',
      ]);
      const sourceAspect = background.width / background.height;
      const canvasAspect = CHAPTER01_CANVAS.width / CHAPTER01_CANVAS.height;
      expect(Math.abs(sourceAspect - canvasAspect)).toBeLessThan(0.001);
    }
  });

  it('anchors visible feet to the floor and the visible silhouette to the requested x position', () => {
    for (const metadata of Object.values(CHAPTER01_SPRITES)) {
      const geometry = getSpriteDrawGeometry(metadata, 480, 402);
      const visibleBottom = geometry.y + metadata.alphaBounds.bottom * geometry.scale;
      const visibleCenter = geometry.x
        + ((metadata.alphaBounds.left + metadata.alphaBounds.right) / 2) * geometry.scale;

      expect(visibleBottom).toBeCloseTo(402, 6);
      expect(visibleCenter).toBeCloseTo(480, 6);
    }
  });

  it('keeps both visible silhouettes inside the play area at movement extrema', () => {
    for (const [name, metadata] of Object.entries(CHAPTER01_SPRITES)) {
      for (const anchorX of [70, 890]) {
        const geometry = getSpriteDrawGeometry(metadata, anchorX, 406);
        const visibleLeft = geometry.x + metadata.alphaBounds.left * geometry.scale;
        const visibleRight = geometry.x + metadata.alphaBounds.right * geometry.scale;
        const visibleTop = geometry.y + metadata.alphaBounds.top * geometry.scale;
        const visibleBottom = geometry.y + metadata.alphaBounds.bottom * geometry.scale;

        expect(visibleLeft, `${name} left edge at ${anchorX}`).toBeGreaterThanOrEqual(0);
        expect(visibleRight, `${name} right edge at ${anchorX}`).toBeLessThanOrEqual(CHAPTER01_CANVAS.width);
        expect(visibleTop, `${name} top edge at ${anchorX}`).toBeGreaterThanOrEqual(72);
        expect(visibleBottom, `${name} baseline at ${anchorX}`).toBeCloseTo(406, 6);
      }
    }
  });

  it('contains the square Yeongsu identity source on the left without changing its aspect ratio', () => {
    const geometry = getContainedRasterGeometry(
      CHAPTER01_IDENTITY_SOURCE.width,
      CHAPTER01_IDENTITY_SOURCE.height,
      CHAPTER01_CANVAS.width,
      CHAPTER01_CANVAS.height,
      0,
    );

    expect(geometry).toEqual({ x: 0, y: 0, width: 540, height: 540, scale: 540 / 1024 });
    expect(geometry.width / geometry.height).toBe(CHAPTER01_IDENTITY_SOURCE.width / CHAPTER01_IDENTITY_SOURCE.height);
    expect(geometry.x + geometry.width).toBeLessThanOrEqual(CHAPTER01_CANVAS.width);
    expect(geometry.y + geometry.height).toBeLessThanOrEqual(CHAPTER01_CANVAS.height);
  });

  it('covers the 16:9 title canvas with the square identity artwork without stretching it', () => {
    const geometry = getCoverRasterGeometry(1024, 1024, 960, 540, 0.5, 0.25);

    expect(geometry).toEqual({ x: 0, y: -105, width: 960, height: 960, scale: 0.9375 });
    expect(geometry.width).toBeGreaterThanOrEqual(CHAPTER01_CANVAS.width);
    expect(geometry.height).toBeGreaterThanOrEqual(CHAPTER01_CANVAS.height);
    expect(geometry.width / geometry.height).toBe(1);
  });

  it('keeps native 960x540 top-view maps and a four-cell 256x80 guard sheet', () => {
    for (const background of Object.values(CHAPTER01_TOPVIEW_BACKGROUNDS)) {
      expect([background.width, background.height, background.format, background.colorMode]).toEqual([
        960,
        540,
        'PNG',
        'RGB',
      ]);
    }
    expect([
      CHAPTER01_TOPVIEW_SPRITE.path,
      CHAPTER01_TOPVIEW_SPRITE.width,
      CHAPTER01_TOPVIEW_SPRITE.height,
      CHAPTER01_TOPVIEW_SPRITE.frameWidth,
      CHAPTER01_TOPVIEW_SPRITE.frameHeight,
      CHAPTER01_TOPVIEW_SPRITE.colorMode,
    ]).toEqual(['src/assets/chapter01-yeongsu-guard-sprites.png', 256, 80, 64, 80, 'RGBA']);
  });
});
