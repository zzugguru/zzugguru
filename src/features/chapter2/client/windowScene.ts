import { MapScene } from './MapScene';

/** 챕터2의 마지막 공간 — 우주선 창가. 창문 하나만 있는 최소 맵. */
export function createWindowScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'window',
        position: { x: 480, y: 160 },
        interactionRadius: 56,
        required: true,
        label: '창밖 바라보기',
      },
    ],
    { x: 480, y: 380 },
  );
}
