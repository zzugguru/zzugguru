import { MapScene } from './MapScene';
import { EARTH_OBSERVATION_ROOM } from './mapVisuals';

/** 챕터2의 마지막 공간 — 우주선 창가. 창문 하나만 있는 최소 맵. */
export function createWindowScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'window',
        position: { x: 480, y: 190 },
        interactionRadius: 56,
        required: true,
        label: '창밖 바라보기',
        visualLabel: '전망창 제어장치',
        visual: { asset: 'window-console', position: { x: 480, y: 190 }, width: 54, height: 58 },
      },
    ],
    { x: 480, y: 380 },
    EARTH_OBSERVATION_ROOM,
  );
}
