/** 인덱스를 length 범위 안에서 순환시킨다 (0 이상, length 미만으로 래핑). */
export function cycleIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return ((current + delta) % length + length) % length;
}
