export type BlackoutState = { step: number; seen: boolean };
export type BlackoutLine = { speaker: string; text: string };

export const BLACKOUT_LINES: readonly BlackoutLine[] = [
  { speaker: '아내', text: '“우리를 다시 죽이려는 거야?”' },
  { speaker: '누나', text: '“너희는 원래부터 살아 있지 않았어.”' },
  { speaker: '영수', text: '“그런 말 하지 마!”' },
  { speaker: '', text: '우주선 전체의 불이 꺼졌다.' },
  { speaker: '', text: '복도와 조종실에 지구의 풍경이 나타나기 시작했다.' },
];

export function createBlackout(): BlackoutState {
  return { step: 0, seen: false };
}

export function advanceBlackout(state: BlackoutState): BlackoutState {
  if (state.seen) return state;
  const nextStep = state.step + 1;
  return nextStep < BLACKOUT_LINES.length
    ? { step: nextStep, seen: false }
    : { step: state.step, seen: true };
}
