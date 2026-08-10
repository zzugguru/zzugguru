# CCTV 콘솔 씬 · 귀신 영상 연결 작업 기록

이 문서는 `src/features/chapter2/assets/scene_cctv/`에 추가된 사진을 `CctvConsoleScene`(CCTV 채널 서핑 미니게임)에 연결한 작업 내역을 기록한다. 작업 시점: 2026-08-10.

## 배경 — 씬의 원래 구조

Chapter2 시퀀스는 `Chapter2Game.ts` 기준 다음 순서로 진행된다:

```
createCctvRoomScene()   // 경비실 맵 — CCTV 시스템에 다가가 상호작용
→ CctvConsoleScene       // CCTV 채널 서핑 미니게임 (이번 작업 대상)
→ createEncounterScene() // 등 뒤에 나타난 존재
→ DialogueScene(...)     // "모든 CCTV 화면이 하얗게 변한다" 등
```

`CctvConsoleScene`은 3개 채널(지하주차장 · 1층 로비 · 경비실 앞)을 좌/우로 넘기며, 매 라운드마다 정해진 "정답 채널"에서 Z(확인)를 누르면 독백이 뜨고 다음 라운드로 넘어가는 3라운드 구조다. 작업 전에는 화면 영역이 `#111827` 단색 사각형이었고, 정답 채널을 맞혔는지 여부는 순전히 텍스트 독백으로만 전달됐다 — 즉 "CCTV를 보다가 귀신과 조우한다"는 컨셉을 시각적으로 보여주는 요소가 없었다.

## 사용자가 추가한 원본 자산

`src/features/chapter2/assets/scene_cctv/`에 채널당 정상/귀신 한 쌍씩 총 6장이 추가되어 있었다:

| 파일 | 원본 크기 | 원본 해상도 |
|---|---|---|
| `under_parking_normal.png` / `under_parking_ghost.png` | 11.7MB / 11.2MB | 2816×1536 |
| `front_robby_normal.png` / `front_robby_ghost.png` | 5.1MB / 6.0MB | 1408×768 |
| `front_security_normal.png` / `front_security_ghost.png` | 6.7MB / 10.7MB | 2814~2816×1536(ghost) / 1408×768(normal) |

각 이미지에는 이미 CCTV 화면 연출(흑백 그레인, "REC" 표시, 채널명·타임스탬프 오버레이, "B2 지하주차장 / CH 0" 같은 라벨)이 그려져 있었고, `_ghost` 버전에는 반투명하게 빛나는 인체 형상이 서 있는 것이 확인됐다. 이를 통해 의도를 다음과 같이 해석했다: **플레이어가 채널을 넘기다가 정답 채널에서 화면 속에 귀신이 나타난 것을 스스로 발견하고 확인(Z)하는 연출**을 완성하는 것.

## 구현 내용

### 1. 이미지 최적화

원본 총합 ~52MB는 이 프로젝트의 기존 배경 이미지 관례(960×540, 개당 ~700KB대, 예: `security-office.png`)에 비해 지나치게 컸다. `sips -Z 800`으로 6장 모두 최대 800px로 다운스케일했다 — 화면에 실제로 그려지는 영역이 600×340이라 800px 소스면 충분하다. 결과:

| 파일 | 리사이즈 후 | 해상도 |
|---|---|---|
| `under_parking_normal.png` / `_ghost.png` | 570KB / 579KB | 800×436 |
| `front_robby_normal.png` / `_ghost.png` | 635KB / 655KB | 800×436 |
| `front_security_normal.png` / `_ghost.png` | 645KB / 703KB | 800×436 |

총 ~3.8MB로 축소(원본 대비 약 13배 절감). 픽셀 내용은 원본과 동일(다운스케일만, 크롭·재구성 없음)하며, 원본 고해상도 데이터는 git 이력에 남는다.

### 2. `cctvConsoleScene.ts` 변경

- `CctvChannel` 인터페이스에 `normalUrl` / `ghostUrl` 필드를 추가하고, `CHANNELS` 배열의 각 채널(지하주차장·1층 로비·경비실 앞)을 대응하는 파일 쌍에 연결했다.
- 자산 URL은 기존 `mapVisuals.ts`의 `assetUrl` 헬퍼와 동일한 패턴(`new URL(..., import.meta.url).href`)으로 `sceneCctvUrl()` 헬퍼를 새로 만들어 처리했다.
- 이미지 로딩은 새 로직을 만들지 않고 기존 `mapVisuals.ts`의 `createLoadedImage()`를 그대로 재사용했다(모듈 스코프에서 6장을 한 번만 로드하는 `CHANNEL_IMAGES` 배열 구성).
- `render()`에 `drawChannelFootage()`를 추가해, 화면 영역(600×340)에 항상 현재 선택된 채널의 영상을 그리도록 했다:
  - 현재 채널이 **이번 라운드의 정답 채널이 아니면** → `_normal` 영상.
  - 현재 채널이 **이번 라운드의 정답 채널이면** → `_ghost` 영상(플레이어가 확인 버튼을 누르기 전에도 이미 화면에 귀신이 보인다 — 이것이 "발견"의 순간이 된다).
  - 이미지가 아직 로드되지 않았을 때는 기존의 단색 사각형으로 자연스럽게 폴백한다.
- 기존 텍스트 UI(채널 번호/이름, 조작 안내, 정답 시 독백 오버레이)는 그대로 유지했다 — 이미지 라벨은 화면 안(월드) 정보, 텍스트 UI는 게임 메타 정보로 역할이 겹치지 않는다.

## 검증

- `npm run typecheck` — 통과
- `npm run test` — 전체 296/296 통과(`CctvConsoleScene` 관련 6건 포함). 이전까지 여러 라운드에 걸쳐 반복 보고됐던 `mapLogic.test.ts`의 무관한 기존 실패도 이번 실행에서는 재현되지 않음(별도 조치 없음, 이 작업과 무관).
- `npm run build` — 통과. 번들에 포함된 6개 CCTV 이미지 크기는 570~703KB 수준으로 다른 배경 이미지들과 비슷한 대역.
- `npm run design:lint` — 기존 경고 2건(무관) 외 이상 없음. 새 DESIGN.md 토큰 추가 없음(이미지 자체에 스타일이 포함되어 있어 별도 컴포넌트 정의 불필요).
- `git diff --check` — 통과.
- 브라우저: 자동화 탭이 `document.hidden=true`로 스로틀링되어 실제 게임의 `requestAnimationFrame` 루프가 진행되지 않아 라이브 플레이 확인은 이번에도 어려웠다(이 세션 내내 반복된 환경 제약, 이 작업 고유의 문제는 아님). 대신 실제 dev 서버가 서빙하는 6개 이미지 URL이 모두 200 OK로 정상 응답하는 것과, 동일한 크기(600×340)로 `drawImage`했을 때 normal/ghost가 의도대로 렌더링되는 것을 별도 캔버스로 직접 확인했다. 게임 내 실제 플레이 확인은 로컬 `npm run dev`에서 사용자가 진행.

## 변경 파일

- 수정: `src/features/chapter2/client/cctvConsoleScene.ts`
- 리사이즈(내용 동일, 해상도만 축소): `src/features/chapter2/assets/scene_cctv/*.png` 6개
- 신규: 이 문서(`cctv_scene.md`)

## 남은 개선 여지

- 이미지 자체가 200×340 대비 살짝 다른 종횡비(800×436 ≈ 1.83 vs 화면 600×340 ≈ 1.76)라 `drawImage`로 화면 전체를 채울 때 약 4% 정도의 미세한 가로 방향 stretch가 생긴다. 육안으로는 거의 티가 나지 않지만, 더 정교하게 다듬고 싶다면 cover-fit(크롭) 방식으로 바꿀 수 있다.
- 정답 채널의 귀신 영상이 채널 전환 즉시 보이기 때문에, 난이도 측면에서 "우연히 스쳐 지나가며 발견"하는 긴장감이 약해질 수 있다. 필요하면 짧은 지연 후에 귀신이 나타나도록 하거나, 확인 전까지는 정상 영상을 보여주다가 일정 시간 응시해야 귀신이 드러나는 방식으로 발전시킬 수 있다(이번 작업 범위 밖).
