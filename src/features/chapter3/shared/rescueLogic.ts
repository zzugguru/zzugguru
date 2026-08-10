import type { Point } from './mapLogic';

export type RescueTargetId = 'father' | 'mother' | 'sister';
export type RescueLine = { speaker: string; text: string };
export type RescueTarget = {
  id: RescueTargetId;
  name: string;
  x: number;
  y: number;
  lines: readonly RescueLine[];
};

export const RESCUE_TARGETS: readonly RescueTarget[] = [
  {
    id: 'father',
    name: '외계 아버지',
    x: 520,
    y: 260,
    lines: [
      { speaker: '', text: '아버지는 사고 당시 어린 이온을 잃어버린 순간을 반복해서 보고 있다.' },
      { speaker: '영수', text: '아버지, 그건 이제 지나간 일이에요.' },
      { speaker: '외계 아버지', text: '...이온아, 거기 있었구나.' },
    ],
  },
  {
    id: 'mother',
    name: '외계 어머니',
    x: 830,
    y: 290,
    lines: [
      { speaker: '', text: '어머니는 탈출 장치를 향해 손을 뻗으며 계속 울고 있다.' },
      { speaker: '영수', text: '어머니, 이제 손을 잡아도 돼요.' },
      { speaker: '외계 어머니', text: '...정말 네가 맞니?' },
    ],
  },
  {
    id: 'sister',
    name: '외계 누나',
    x: 260,
    y: 300,
    lines: [
      { speaker: '', text: '누나는 어린 동생을 찾아 끝없는 복도를 달리고 있다.' },
      { speaker: '영수', text: '누나, 그만 뛰어도 돼. 나 여기 있어.' },
      { speaker: '누나', text: '...영수야, 정말 너야?' },
    ],
  },
];

/** 세 사람 모두 구출한 직후, 마지막 페이드 전에 보여주는 여운 대사. */
export const RESCUE_COMPLETE_LINE: RescueLine = {
  speaker: '',
  text: '가족이 다시 모였다. 우주선이 서서히 제자리를 찾아가고 있다.',
};

export type RescueState = { rescued: readonly RescueTargetId[]; completed: boolean };
export type RescueDialogueState = { targetId: RescueTargetId; step: number; seen: boolean };

export function createRescue(): RescueState {
  return { rescued: [], completed: false };
}

/** collectionAvailable(flow)와 대구를 이루는, 구출 단계가 활성화되는 조건. */
export function rescueAvailable(blackoutSeen: boolean, rescue: RescueState): boolean {
  return blackoutSeen && !rescue.completed;
}

export function nearbyRescueTarget(position: Point, rescue: RescueState): RescueTarget | null {
  return RESCUE_TARGETS.find((target) => !rescue.rescued.includes(target.id)
    && Math.hypot(position.x + 13 - target.x, position.y + 13 - target.y) <= 72) ?? null;
}

export function startRescueDialogue(target: RescueTarget): RescueDialogueState {
  return { targetId: target.id, step: 0, seen: false };
}

export function advanceRescueDialogue(state: RescueDialogueState, target: RescueTarget): RescueDialogueState {
  if (state.seen) return state;
  const nextStep = state.step + 1;
  return nextStep < target.lines.length
    ? { ...state, step: nextStep }
    : { ...state, seen: true };
}

export function completeRescue(rescue: RescueState, targetId: RescueTargetId): RescueState {
  if (rescue.rescued.includes(targetId)) return rescue;
  const rescued = [...rescue.rescued, targetId];
  return { rescued, completed: rescued.length === RESCUE_TARGETS.length };
}
