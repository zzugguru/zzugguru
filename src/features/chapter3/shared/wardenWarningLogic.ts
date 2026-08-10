export type WarningState = { step: number; seen: boolean };
export type WarningLine = { speaker: string; text: string };

export const WARNING_LINES: readonly WarningLine[] = [
  { speaker: '누나', text: '“그 장치는 죽은 존재를 되살리지 못해.”' },
  { speaker: '영수', text: '“몸도 만들고 기억도 넣을 수 있잖아.”' },
  { speaker: '누나', text: '“그 기억은 네 안에 남은 기록일 뿐이야.”' },
];

export function createWarning(): WarningState {
  return { step: 0, seen: false };
}

export function advanceWarning(state: WarningState): WarningState {
  if (state.seen) return state;
  const nextStep = state.step + 1;
  return nextStep < WARNING_LINES.length
    ? { step: nextStep, seen: false }
    : { step: state.step, seen: true };
}
