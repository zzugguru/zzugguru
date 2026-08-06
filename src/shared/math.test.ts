import { describe, expect, it } from 'vitest';
import { clamp } from './math';

describe('clamp', () => {
  it('범위를 벗어난 값을 경계 안으로 제한한다', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
