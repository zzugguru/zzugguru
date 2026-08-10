import type { LettingGoState } from './lettingGoLogic';
import type { Point } from './mapLogic';

export type EpiloguePhase = 'locked' | 'silence' | 'corridor' | 'archive' | 'archive-complete' | 'montage' | 'homeworld' | 'journal' | 'credits' | 'postcredits' | 'complete';
export type EpilogueState = { phase: EpiloguePhase; placed: readonly string[]; step: number; message: string };
export type ArchiveRecord = { id: string; name: string; x: number; y: number; monologue: string };

export const ARCHIVE_RECORDS: readonly ArchiveRecord[] = [
  { id: 'photo', name: '가족사진', x: 170, y: 150, monologue: '영수: “우리가 함께 웃었다는 기록.”' },
  { id: 'voice', name: '아내의 목소리', x: 350, y: 370, monologue: '영수: “당신 목소리를 사람으로 만들지는 않을게.”' },
  { id: 'tool', name: '큰아들의 수리 도구', x: 530, y: 150, monologue: '영수: “함께하지 못한 미래도 사랑의 흔적이었다.”' },
  { id: 'star', name: '작은딸과 본 별의 좌표', x: 710, y: 370, monologue: '영수: “네가 보았으면 좋아했을 별.”' },
  { id: 'table', name: '마지막 식탁의 기록', x: 850, y: 150, monologue: '영수: “작별도 우리가 함께한 시간이다.”' },
];

export const MONTAGE = [
  '기록실 · 영수는 가족사진에 새로 발견한 행성을 이야기했다.',
  '복도 · 누나와 다툰 영수가 먼저 미안하다고 말했다.',
  '식당 · 외계 어머니의 짠 지구 음식을 먹고 함께 웃었다.',
  '정비실 · 큰아들이 좋아했을 기계를 영수가 직접 고쳤다.',
  '관측실 · 작은딸에게 보여주고 싶었던 별을 기록했다.',
] as const;

export const JOURNAL_LINES = [
  '오늘의 특이 사항.',
  '잃어버린 가족을 찾았고,',
  '떠나간 가족에게 작별했다.',
  '나는 아직 살아 있다.',
  '그러므로 내일도 살아갈 것이다.',
] as const;
export const ARCHIVE_DOOR = { x: 850, y: 240 } as const;
export const QUARTERS_SPAWN: Point = { x: 480, y: 300 };
export const EPILOGUE_MOVE_BOUNDS = {
  corridor: { minX: 155, maxX: 786, minY: 132, maxY: 463 },
  archive: { minX: 53, maxX: 881, minY: 132, maxY: 463 },
} as const;

export function createEpilogue(): EpilogueState {
  return { phase: 'locked', placed: [], step: 0, message: '' };
}

export function startEpilogue(state: EpilogueState, lettingGo: LettingGoState): EpilogueState {
  return state.phase === 'locked' && lettingGo.completed
    ? { ...state, phase: 'silence', message: '가족이 사라진 뒤, 영수의 작은 방에는 우주선의 소리만 남았다.' }
    : state;
}

export function advanceEpilogue(state: EpilogueState): EpilogueState {
  if (state.phase === 'silence') return { ...state, phase: 'corridor', message: '누나: “후회해?” 영수: “다시 만난 건 후회하지 않아. 보낸 것도.”' };
  if (state.phase === 'archive-complete') return { ...state, phase: 'montage', step: 0, message: MONTAGE[0] };
  if (state.phase === 'montage') return state.step + 1 < MONTAGE.length
    ? { ...state, step: state.step + 1, message: MONTAGE[state.step + 1] }
    : { ...state, phase: 'homeworld', step: 0, message: '외계 어머니: “돌아온 기분이 어떠니?”' };
  if (state.phase === 'homeworld') return { ...state, phase: 'journal', step: 0, message: JOURNAL_LINES[0] };
  if (state.phase === 'journal') return state.step + 1 < JOURNAL_LINES.length
    ? { ...state, step: state.step + 1, message: JOURNAL_LINES[state.step + 1] }
    : { ...state, phase: 'credits', step: 0, message: 'CHAPTER 03 · 마지막 저녁' };
  if (state.phase === 'credits') return { ...state, phase: 'postcredits', step: 0, message: '영수: “오늘은 달이 두 개나 떴어.”' };
  if (state.phase === 'postcredits') {
    const lines = ['영수: “오늘은 달이 두 개나 떴어.”', '누나: “영수, 저녁 먹어.”', '영수: “지금 가.”'];
    return state.step + 1 < lines.length ? { ...state, step: state.step + 1, message: lines[state.step + 1] } : { ...state, phase: 'complete' };
  }
  return state;
}

export function nearArchiveDoor(position: Point): boolean {
  return Math.hypot(position.x + 13 - ARCHIVE_DOOR.x, position.y + 13 - ARCHIVE_DOOR.y) <= 76;
}

export function enterArchive(state: EpilogueState, position: Point): EpilogueState {
  return state.phase === 'corridor' && nearArchiveDoor(position)
    ? { ...state, phase: 'archive', message: '빈 가족 기록 공간이 영수를 기다리고 있다.' }
    : state;
}

export function moveEpiloguePlayer(
  position: Point,
  dx: number,
  dy: number,
  phase: 'corridor' | 'archive' = 'archive',
): Point {
  const bounds = EPILOGUE_MOVE_BOUNDS[phase];
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x + dx)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y + dy)),
  };
}

export function nearbyArchiveRecord(position: Point, state: EpilogueState): ArchiveRecord | null {
  if (state.phase !== 'archive') return null;
  return ARCHIVE_RECORDS.find((record) => !state.placed.includes(record.id)
    && Math.hypot(position.x + 13 - record.x, position.y + 13 - record.y) <= 72) ?? null;
}

export function placeArchiveRecord(state: EpilogueState, position: Point): EpilogueState {
  const record = nearbyArchiveRecord(position, state);
  if (!record) return state;
  const placed = [...state.placed, record.id];
  return placed.length === ARCHIVE_RECORDS.length
    ? { ...state, placed, phase: 'archive-complete', message: `${record.monologue} 영수: “여기 있으면 됐다.”` }
    : { ...state, placed, message: record.monologue };
}
