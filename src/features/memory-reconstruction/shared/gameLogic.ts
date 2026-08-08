export type FamilyId = 'wife' | 'son' | 'daughter';
export type MemoryClue = { id: string; family: FamilyId; label: string };
export type GameStatus = 'playing' | 'success' | 'failure';
export type MemoryGameState = {
  clueIndex: number;
  stability: number;
  status: GameStatus;
  completed: Record<FamilyId, number>;
  feedback: string;
};

export const MEMORY_CLUES: readonly MemoryClue[] = [
  { id: 'wife-face', family: 'wife', label: '아내의 얼굴' },
  { id: 'son-habit', family: 'son', label: '긴장하면 엄지손톱을 만지던 버릇' },
  { id: 'daughter-hand', family: 'daughter', label: '길을 건널 때 내밀던 작은 손바닥' },
  { id: 'wife-smile', family: 'wife', label: '웃을 때 눈가에 생기던 주름' },
  { id: 'wife-voice', family: 'wife', label: '“여보?” 하고 부르던 목소리' },
];

export const REQUIRED_BY_FAMILY: Record<FamilyId, number> = { wife: 3, son: 1, daughter: 1 };

export const VESSEL_RECTS = [
  { family: 'wife', x: 54, y: 265, width: 264, height: 190 },
  { family: 'son', x: 348, y: 265, width: 264, height: 190 },
  { family: 'daughter', x: 642, y: 265, width: 264, height: 190 },
] as const;

export function familyAtPoint(x: number, y: number): FamilyId | null {
  return VESSEL_RECTS.find((rect) =>
    x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height,
  )?.family ?? null;
}

export function awakeningStage(elapsedMs: number): 0 | 1 | 2 | 3 {
  if (elapsedMs < 900) return 0;
  if (elapsedMs < 1_800) return 1;
  if (elapsedMs < 2_700) return 2;
  return 3;
}

export function createMemoryGame(): MemoryGameState {
  return {
    clueIndex: 0,
    stability: 3,
    status: 'playing',
    completed: { wife: 0, son: 0, daughter: 0 },
    feedback: '기억 조각을 알맞은 생체 용기에 연결하세요.',
  };
}

export function connectMemory(
  state: MemoryGameState,
  family: FamilyId,
  clues: readonly MemoryClue[] = MEMORY_CLUES,
): MemoryGameState {
  if (state.status !== 'playing') return state;
  const clue = clues[state.clueIndex];
  if (!clue) return { ...state, status: 'success' };
  if (clue.family !== family) {
    const stability = Math.max(0, state.stability - 1);
    return {
      ...state,
      stability,
      status: stability === 0 ? 'failure' : 'playing',
      feedback: stability === 0 ? '기억 연결이 붕괴했습니다.' : '기억이 일치하지 않습니다. 장치가 불안정해집니다.',
    };
  }
  const clueIndex = state.clueIndex + 1;
  const completed = { ...state.completed, [family]: state.completed[family] + 1 };
  const status = clueIndex === clues.length ? 'success' : 'playing';
  return {
    ...state,
    clueIndex,
    completed,
    status,
    feedback: status === 'success' ? '세 개의 생체 용기가 열립니다.' : '기억이 연결되었습니다.',
  };
}
