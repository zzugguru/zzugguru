import { MapScene } from './MapScene';

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
      },
    ],
    { x: 480, y: 300 },
  );
}
