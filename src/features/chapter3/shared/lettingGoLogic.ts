import type { CollectionState } from './collectionLogic';

export type LettingGoChoice = 'hold' | 'record' | 'release';
export type LettingGoMemory = {
  id: string; object: string; family: string; prompt: string; correct: LettingGoChoice; success: string; retry: Record<LettingGoChoice, string>;
};
export type LettingGoState = { index: number; resolved: readonly string[]; feedback: string; completed: boolean; lastChoiceCorrect: boolean | null };

export const LETTING_GO_MEMORIES: readonly LettingGoMemory[] = [
  { id: 'photo', object: '가족사진', family: '아내', prompt: '함께 웃던 얼굴을 어떻게 간직할까?', correct: 'record', success: '아내: “사랑했던 우리를 기억해줘요.” 영수: “사진은 감옥이 아니라 우리가 사랑했다는 기록으로 남길게.”', retry: { hold: '아내: “사진 속에 우리를 가두지는 말아요.” 영수: “붙잡는 건 사랑을 멈춘 시간에 가두는 일이구나.”', record: '', release: '아내: “잊어야만 보내줄 수 있는 건 아니에요.” 영수: “그래, 기억까지 버릴 필요는 없어.”' } },
  { id: 'market', object: '시장의 장바구니', family: '아내', prompt: '함께 걷던 시장의 기억을 어떻게 할까?', correct: 'record', success: '아내: “비 오는 시장길을 기억해줘요.” 영수: “당신을 붙잡지 않고 그날의 소리와 냄새를 기록할게.”', retry: { hold: '아내: “그날에만 머물면 당신의 오늘이 사라져요.” 영수: “과거를 현재로 만들려 해서는 안 돼.”', record: '', release: '아내: “우리의 시간이 없었던 일은 아니잖아요.” 영수: “함께한 시간은 지우지 않겠어.”' } },
  { id: 'tool', object: '우주선 수리 도구', family: '큰아들', prompt: '함께 우주선을 고치고 싶었던 미래는?', correct: 'release', success: '큰아들: “이루지 못한 일 때문에 멈추지 마세요.” 영수: “함께하지 못한 미래는 놓고 너를 사랑한 마음을 남길게.”', retry: { hold: '큰아들: “이루지 못한 미래로 저를 붙잡지 마세요.” 영수: “내 바람을 너의 삶처럼 만들고 있었구나.”', record: '큰아들: “그 일은 실제로 함께한 기억이 아니에요.” 영수: “내가 바라던 미래를 기억인 것처럼 보존할 수는 없어.”', release: '' } },
  { id: 'lens', object: '별 관측 렌즈', family: '작은딸', prompt: '딸이 시야 밖에서도 존재하려면?', correct: 'record', success: '작은딸: “별을 본 기쁨은 남겨줘.” 영수: “너를 계속 바라봐야만 존재하게 하지 않고 그 기쁨을 기록할게.”', retry: { hold: '작은딸: “아빠가 보지 않아도 내가 있었으면 좋겠어.” 영수: “내 시야 안에 너를 가두고 있었구나.”', record: '', release: '작은딸: “우리 같이 본 별도 버릴 거야?” 영수: “아니, 너와 본 별까지 버리는 건 아니야.”' } },
  { id: 'bowl', object: '마지막 식사의 그릇', family: '아내', prompt: '마지막 식탁을 어떻게 맞이할까?', correct: 'record', success: '아내: “마지막 인사도 우리 기억으로 남겨요.” 영수: “이 식탁에 갇히지 않고 작별을 기록할게.”', retry: { hold: '아내: “이 식탁이 당신을 영원히 가두게 하지 말아요.” 영수: “행복한 순간에 머무는 것과 살아가는 건 다르구나.”', record: '', release: '아내: “작별도 우리가 함께한 시간이잖아요.” 영수: “그래, 작별도 기억의 일부로 남길게.”' } },
];

export function createLettingGo(): LettingGoState {
  return { index: 0, resolved: [], feedback: '기억을 지우지 않되 가족을 붙잡지 않는 선택을 하자.', completed: false, lastChoiceCorrect: null };
}

export function canStartLettingGo(collection: CollectionState): boolean {
  return collection.completed;
}

export function chooseLettingGo(state: LettingGoState, choice: LettingGoChoice): LettingGoState {
  if (state.completed) return state;
  const memory = LETTING_GO_MEMORIES[state.index];
  if (!memory || choice !== memory.correct) return { ...state, feedback: memory?.retry[choice] ?? state.feedback, lastChoiceCorrect: false };
  const resolved = [...state.resolved, memory.id];
  const completed = resolved.length === LETTING_GO_MEMORIES.length;
  return {
    index: completed ? state.index : state.index + 1,
    resolved,
    completed,
    lastChoiceCorrect: true,
    feedback: completed ? `${memory.success} 모든 기억은 삭제되지 않고 기록 보관소에 남는다.` : memory.success,
  };
}
