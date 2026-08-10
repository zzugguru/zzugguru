import { describe, expect, it, vi } from 'vitest';
import { createMemoryGame } from '../shared/gameLogic';
import {
  BIO_VESSEL_HEIGHT,
  BIO_VESSEL_WIDTH,
  bioVesselAssetPath,
  bioVesselDestination,
  bioVesselInfoPanel,
  drawBioVesselPanel,
  drawBioVesselSprite,
  puzzleVesselState,
  vesselStateLabel,
} from './bioVesselSprite';

describe('Chapter03 biocapsule sprite', () => {
  it('centers the native-size vessel inside the unchanged click rectangle', () => {
    expect(bioVesselDestination({ x: 54, y: 265, width: 264, height: 190 })).toEqual({
      x: 116, y: 268, width: 160, height: 184,
    });
  });

  it('selects active, unstable and connected states without changing puzzle rules', () => {
    const initial = createMemoryGame();
    expect(puzzleVesselState(initial, 'wife')).toBe('active');
    expect(puzzleVesselState(initial, 'son')).toBe('idle');
    expect(puzzleVesselState({ ...initial, stability: 2, feedback: '기억이 일치하지 않습니다.' }, 'son')).toBe('unstable');
    expect(puzzleVesselState({ ...initial, completed: { ...initial.completed, son: 1 } }, 'son')).toBe('connected');
  });

  it('provides text for every visual state so feedback is not color-only', () => {
    expect(['idle', 'active', 'unstable', 'connected', 'open'].map((state) => vesselStateLabel(state as never)))
      .toEqual(['생체 신호 대기 중', '기억 신호 수신 중', '연결 불안정', '기억 연결 완료', '용기 개방 · 생체 신호 확인']);
  });

  it('draws a valid asset at native size without smoothing', () => {
    const drawImage = vi.fn();
    const context = {
      save: vi.fn(), restore: vi.fn(), drawImage, strokeRect: vi.fn(), fillRect: vi.fn(),
      imageSmoothingEnabled: true, globalAlpha: 1, strokeStyle: '', fillStyle: '', lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;
    const image = { complete: true, naturalWidth: 160, naturalHeight: 184 } as HTMLImageElement;
    const rect = { x: 54, y: 265, width: 264, height: 190 };

    expect(drawBioVesselSprite(context, image, rect, 'active', 0)).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(image, 116, 268, BIO_VESSEL_WIDTH, BIO_VESSEL_HEIGHT);
  });

  it.each([
    { complete: false, naturalWidth: 160, naturalHeight: 184 },
    { complete: true, naturalWidth: 159, naturalHeight: 184 },
    { complete: true, naturalWidth: 160, naturalHeight: 183 },
  ])('uses fallback for unavailable or malformed assets: %o', (image) => {
    const context = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    expect(drawBioVesselSprite(context, image as HTMLImageElement, { x: 0, y: 0, width: 264, height: 190 }, 'idle', 0)).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
  });

  it('resolves all three asset imports', () => {
    expect(['wife', 'son', 'daughter'].map((id) => bioVesselAssetPath(id as 'wife' | 'son' | 'daughter')))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('bio-vessel-wife.png'),
        expect.stringContaining('bio-vessel-son.png'),
        expect.stringContaining('bio-vessel-daughter.png'),
      ]));
  });

  it('keeps the fallback panel, name and progress when the sprite cannot load', () => {
    const context = {
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(), drawImage: vi.fn(),
      fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left', font: '',
    } as unknown as CanvasRenderingContext2D;
    const rect = { x: 54, y: 265, width: 264, height: 190 };
    const drewImage = drawBioVesselPanel(
      context,
      { complete: false, naturalWidth: 0, naturalHeight: 0 } as HTMLImageElement,
      rect,
      'active',
      0,
      { name: '아내', progress: '0/3 기억 연결' },
    );

    expect(drewImage).toBe(false);
    expect(context.fillRect).toHaveBeenCalledWith(rect.x, rect.y, rect.width, rect.height);
    expect(context.strokeRect).toHaveBeenCalledWith(rect.x, rect.y, rect.width, rect.height);
    expect(context.fillText).toHaveBeenCalledWith('아내', 106, 319);
    expect(context.fillText).toHaveBeenCalledWith('0/3 기억 연결', 106, 383, 78);
    expect(context.drawImage).not.toHaveBeenCalled();
  });

  it('places the information card outside the approved opaque vessel bounds', () => {
    const rect = { x: 54, y: 265, width: 264, height: 190 };
    const destination = bioVesselDestination(rect);
    const info = bioVesselInfoPanel(rect);
    const widestAlphaLeft = destination.x + 41;
    expect(info.x + info.width).toBeLessThan(widestAlphaLeft);
  });
});
