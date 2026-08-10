import { MapScene } from './MapScene';
import { SECURITY_OFFICE } from './mapVisuals';

/** 프리퀄 도입부 — 경비실. CCTV 시스템에 앉으면 콘솔 화면(CctvConsoleScene)으로 넘어간다. */
export function createCctvRoomScene(): MapScene {
  return new MapScene(
    [
      {
        id: 'cctv-system',
        position: { x: 480, y: 270 },
        interactionRadius: 56,
        required: true,
        label: 'CCTV 확인하기',
      },
      {
        id: 'family-photo-frame',
        position: { x: 270, y: 350 },
        interactionRadius: 40,
        required: false,
        label: '액자 보기',
        message: '책상 위 액자 속, 아내와 아이들이 웃고 있다.',
      },
    ],
    { x: 480, y: 400 },
    SECURITY_OFFICE,
  );
}
