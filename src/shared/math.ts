/** 숫자를 최솟값과 최댓값 사이로 제한합니다. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
