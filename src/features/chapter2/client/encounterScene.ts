import { MapScene } from './MapScene';
import { SECURITY_OFFICE } from './mapVisuals';

/** 여섯째 날 밤 — CCTV가 아니라 경비실 안, 바로 등 뒤에 나타난다. 다가갈 필요도 없을 만큼 이미 가깝다. */
export function createEncounterScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'presence',
        position: { x: 480, y: 260 },
        interactionRadius: 80,
        required: true,
        label: '뒤돌아보기',
        visualLabel: '낯선 존재',
        visual: { asset: 'presence', position: { x: 480, y: 260 }, width: 46, height: 72 },
      },
    ],
    { x: 480, y: 320 },
    SECURITY_OFFICE,
  );
}
