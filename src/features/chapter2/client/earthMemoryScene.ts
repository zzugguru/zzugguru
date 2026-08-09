import { MapScene } from './MapScene';

const MEMORY_IDS = ['memory-school', 'memory-market', 'memory-table'];

/**
 * 지구 회상 — 외계 가족이 지켜본 영수의 지구 생활 관찰 기록.
 * 기억 조각 3개는 전부 선택(sub)이라 몇 개를 보든 자유지만, 최소 1개는 봐야 "돌아가기"가 열린다.
 */
export function createEarthMemoryScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'memory-school',
        position: { x: 240, y: 150 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        message: '작은 손을 잡고 걷던 등굣길, 매일 아침 되풀이되던 풍경.',
      },
      {
        id: 'memory-market',
        position: { x: 480, y: 150 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        message: '장바구니를 나눠 들고 걷던 좁은 시장 골목.',
      },
      {
        id: 'memory-table',
        position: { x: 720, y: 150 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        message: '저녁마다 둘러앉던 좁은 식탁, 그칠 줄 모르던 웃음소리.',
      },
      {
        id: 'exit',
        position: { x: 480, y: 420 },
        interactionRadius: 48,
        required: true,
        unlockedBy: MEMORY_IDS,
        label: '기록 그만 보기',
      },
    ],
    { x: 480, y: 300 },
  );
}
