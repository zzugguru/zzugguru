import { MapScene } from './MapScene';
import { SECURITY_OFFICE } from './mapVisuals';

/**
 * 챕터2의 마지막 장면 — 텅 빈 경비실. 더 이상 영수가 아니라, 그 방을 둘러보는 익명의 시선(플레이어)만 남는다.
 * 오브젝트는 경비일지 하나뿐이다. 확인하면 조용히 완료되어 `DutyLogReadingScene`(일지를 한 줄씩 읽는 장면)으로 넘어간다.
 */
export function createDutyLogScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'duty-log',
        position: { x: 480, y: 270 },
        interactionRadius: 48,
        required: true,
        label: '경비일지 확인하기',
      },
    ],
    { x: 480, y: 400 },
    SECURITY_OFFICE,
  );
}
