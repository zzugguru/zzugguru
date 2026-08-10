import { MapScene } from './MapScene';
import { HOLOGRAM_ARCHIVE } from './mapVisuals';

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
        position: { x: 240, y: 275 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        visualLabel: '등굣길 기록',
        message: '작은 손을 잡고 걷던 등굣길, 매일 아침 되풀이되던 풍경.',
        visual: { asset: 'memory-school', position: { x: 240, y: 190 }, width: 58, height: 72 },
      },
      {
        id: 'memory-market',
        position: { x: 480, y: 275 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        visualLabel: '시장 기록',
        message: '장바구니를 나눠 들고 걷던 좁은 시장 골목.',
        visual: { asset: 'memory-market', position: { x: 480, y: 190 }, width: 58, height: 72 },
      },
      {
        id: 'memory-table',
        position: { x: 720, y: 275 },
        interactionRadius: 48,
        required: false,
        label: '기록 보기',
        visualLabel: '저녁 식탁 기록',
        message: '저녁마다 둘러앉던 좁은 식탁, 그칠 줄 모르던 웃음소리.',
        visual: { asset: 'memory-table', position: { x: 720, y: 190 }, width: 58, height: 72 },
      },
      {
        id: 'exit',
        position: { x: 480, y: 420 },
        interactionRadius: 48,
        required: true,
        unlockedBy: MEMORY_IDS,
        label: '기록 그만 보기',
        visualLabel: '기록실 출구',
        visual: { asset: 'archive-exit', position: { x: 480, y: 430 }, width: 68, height: 52 },
      },
    ],
    { x: 480, y: 340 },
    HOLOGRAM_ARCHIVE,
  );
}
