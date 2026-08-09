import type { FlowState, Point } from './mapLogic';
import { MEMORY_ROOM_MAP, type MemoryObjectId } from './mapAssetManifest';

export type MemoryObject = {
  id: string; name: string; x: number; y: number; markerX: number; markerY: number; speaker: string; memory: string; gapSpeaker: string; gap: string;
};
export type CollectionState = { collected: readonly string[]; message: string; completed: boolean };

type MemoryObjectStory = Omit<MemoryObject, 'x' | 'y' | 'markerX' | 'markerY'> & { id: MemoryObjectId };
const MEMORY_OBJECT_STORIES: readonly MemoryObjectStory[] = [
  { id: 'photo', name: '가족사진', speaker: '아내', memory: '“당신 혼자 얼마나 외로웠어.”', gapSpeaker: '영수', gap: '사진 밖에서 가족이 보낸 시간은 아무도 말하지 못했다.' },
  { id: 'market', name: '시장의 장바구니', speaker: '아내', memory: '“시장 소리와 비 오는 날 냄새, 기억나요.”', gapSpeaker: '아내', gap: '“신혼여행 때 묵었던 방 번호는…” 아내는 미소 지은 채 멈췄다.' },
  { id: 'tool', name: '우주선 수리 도구', speaker: '큰아들', memory: '“아버지, 이 우주선은 함께 고쳐보고 싶어요.”', gapSpeaker: '큰아들', gap: '“괜찮아요, 아버지. 괜찮아요, 아버지. 괜찮아요, 아버지.”' },
  { id: 'lens', name: '별 관측 렌즈', speaker: '작은딸', memory: '“아빠, 이런 별은 처음 봐!”', gapSpeaker: '작은딸', gap: '“아빠가 나를 안 보면 나는 어디에 있어?”' },
  { id: 'bowl', name: '마지막 식사의 그릇', speaker: '작은딸', memory: '“아빠, 이것도 먹어.” 딸이 반찬을 올려주었다.', gapSpeaker: '아내', gap: '“우리가 진짜 가족이잖아요.” 그 말은 살아 있던 아내답지 않았다.' },
];

export const MEMORY_OBJECTS: readonly MemoryObject[] = MEMORY_OBJECT_STORIES.map((item) => {
  const coordinates = MEMORY_ROOM_MAP.memoryObjects![item.id];
  return { ...item, x: coordinates.interaction.x, y: coordinates.interaction.y, markerX: coordinates.marker.x, markerY: coordinates.marker.y };
});

export function createCollection(): CollectionState {
  return { collected: [], message: '가족과의 추억이 남은 물건들을 정리하자.', completed: false };
}

export function nearbyMemoryObject(position: Point, state: CollectionState): MemoryObject | null {
  return MEMORY_OBJECTS.find((item) => !state.collected.includes(item.id)
    && Math.hypot(position.x + 13 - item.x, position.y + 13 - item.y) <= 72) ?? null;
}

export function collectNearby(state: CollectionState, position: Point): CollectionState {
  if (state.completed) return state;
  const item = nearbyMemoryObject(position, state);
  if (!item) return state;
  const collected = [...state.collected, item.id];
  const completed = collected.length === MEMORY_OBJECTS.length;
  const dialogue = `${item.speaker}: ${item.memory} ${item.gapSpeaker}: ${item.gap}`;
  return {
    collected,
    completed,
    message: completed
      ? `${dialogue} 모든 물건을 정리했다. 가족은 영수가 기억하는 모습과 시간 안에서만 존재하고 있었다.`
      : dialogue,
  };
}

export function collectionAvailable(flow: FlowState): boolean {
  return flow.scene === 'map' && flow.deviceComplete;
}
