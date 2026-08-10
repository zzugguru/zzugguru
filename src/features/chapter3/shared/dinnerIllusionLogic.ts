export type DinnerState = { step: number; seen: boolean };
export type DinnerLine = { speaker: string; text: string };

export const DINNER_LINES: readonly DinnerLine[] = [
  { speaker: '', text: '영수는 다시 자신의 집, 식탁 앞에 앉아 있었다.' },
  { speaker: '아내', text: '“여보, 앉아요. 이제 어디에도 가지 말아요.”' },
  { speaker: '', text: '평생 다시 보고 싶어 했던 광경이었다.' },
  { speaker: '영수', text: '“그냥 여기서 살면 안 될까?”' },
  { speaker: '아내', text: '“그럼요.”' },
  { speaker: '영수', text: '“밖에 있는 사람들은?”' },
  { speaker: '아내', text: '“잊어버려요.”' },
  { speaker: '영수', text: '“내 외계 가족은?”' },
  { speaker: '아내', text: '“우리가 진짜 가족이잖아요.”' },
  { speaker: '', text: '살아 있던 아내라면 그렇게 말하지 않았을 것이다.' },
  { speaker: '', text: '눈앞의 존재는 그를 이 기억 속에 가두려 하고 있었다.' },
  { speaker: '영수', text: '“당신은 내가 행복하길 바라?”' },
  { speaker: '아내', text: '“물론이죠.”' },
  { speaker: '영수', text: '“그럼 왜 나를 여기 가두려고 해?”' },
  { speaker: '', text: '아내는 대답하지 못했다. 음식이 검은 입자로 변했다.' },
  { speaker: '큰아들', text: '“아버지, 가지 마세요.”' },
  { speaker: '작은딸', text: '“아빠, 또 우리를 버릴 거야?”' },
  { speaker: '영수', text: '“너희가 죽었다는 걸 인정하지 못해 붙잡고 있었어.”' },
  { speaker: '', text: '집의 천장이 갈라지며 우주선 내부가 드러났다.' },
  { speaker: '큰아들', text: '“우리는 뭐였어요?”' },
  { speaker: '영수', text: '“내가 너희를 얼마나 사랑했는지 보여주는 기억이었어.”' },
];

/** 이 인덱스부터 danger 색조 오버레이가 나타난다 — "아내는 대답하지 못했다" 줄(균열 시작). */
export const DINNER_CRACK_STEP = 14;

export function createDinner(): DinnerState {
  return { step: 0, seen: false };
}

export function advanceDinner(state: DinnerState): DinnerState {
  if (state.seen) return state;
  const nextStep = state.step + 1;
  return nextStep < DINNER_LINES.length
    ? { step: nextStep, seen: false }
    : { step: state.step, seen: true };
}
