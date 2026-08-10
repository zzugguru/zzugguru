import { describe, expect, it } from 'vitest';
import {
  CHAPTER01_ESCAPE_YEONGSU,
  getEscapeYeongsuGeometry,
  getEscapeYeongsuVisibleBounds,
  horizontalFacingForDirection,
} from './chapter01EscapeSprite';

describe('chapter01EscapeSprite', () => {
  it('오른쪽 측면 프레임을 2배 정수 배율과 보이는 발 기준선으로 배치한다', () => {
    expect(CHAPTER01_ESCAPE_YEONGSU).toMatchObject({
      sourceX: 128,
      sourceY: 0,
      sourceWidth: 64,
      sourceHeight: 80,
      scale: 2,
    });
    expect(getEscapeYeongsuGeometry(402)).toEqual({
      sourceX: 128,
      sourceY: 0,
      sourceWidth: 64,
      sourceHeight: 80,
      destinationX: -64,
      destinationY: 250,
      destinationWidth: 128,
      destinationHeight: 160,
    });
    expect(getEscapeYeongsuVisibleBounds(480, 402)).toEqual({
      left: 452,
      top: 266,
      right: 508,
      bottom: 402,
    });
  });

  it('양쪽 이동 극값에서 실제 실루엣이 캔버스 안에 남고 정지 시 마지막 방향을 유지한다', () => {
    expect(getEscapeYeongsuVisibleBounds(70, 402).left).toBeGreaterThanOrEqual(0);
    expect(getEscapeYeongsuVisibleBounds(890, 402).right).toBeLessThanOrEqual(960);
    expect(horizontalFacingForDirection(-1, 1)).toBe(-1);
    expect(horizontalFacingForDirection(1, -1)).toBe(1);
    expect(horizontalFacingForDirection(0, -1)).toBe(-1);
  });
});
