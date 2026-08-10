# Chapter 3 게임 아키텍처 분석

`src/features/chapter3/`가 실제로 어떤 구조로 동작하는지, 그리고 이 챕터가 저장소 공통 설정/코드와 어떻게 얽혀 있는지를 파일 단위로 분석한다. 콘텐츠(스토리 진행도) 관점의 분석은 [`chapter3-story-content-plan.md`](./chapter3-story-content-plan.md)를 참고하고, 이 문서는 순수하게 **코드 구조** 관점만 다룬다.

- 분석 범위: `src/features/chapter3/` 전체 + 이 챕터가 실제로 import하거나 참조하는 저장소 공통 파일 (`src/main.ts`, `src/platform/`, `src/shared/`, `src/assets/`)
- 작성 시점: 2026-08-10

## 1. 디렉토리 구조

```text
src/
├── main.ts                          # 앱 진입점 — 챕터 선택 메뉴, DOM 조립, 챕터별 게임 인스턴스 생성
├── style.css                        # 전역 스타일 (DESIGN.md 토큰 적용)
├── platform/
│   └── client/
│       └── Game.ts                  # 범용 requestAnimationFrame 루프 래퍼 (Chapter3는 미사용)
├── shared/
│   └── math.ts                      # clamp() 등 범용 수학 유틸 (Chapter3는 미사용)
├── assets/                          # 2개 이상 챕터가 공유하는 에셋
│   └── yeongsu-alien-suit-sprites.png   # Chapter1 + Chapter3가 함께 쓰는 플레이어 스프라이트 시트
└── features/
    └── chapter3/
        ├── assets/                  # Chapter3 전용 이미지
        │   ├── chapter03-spaceship-lab.png
        │   └── chapter03-memory-room-v2.png
        ├── client/                  # 렌더링·입력·화면 상태를 다루는 계층
        │   ├── MemoryReconstructionGame.ts   # 챕터 전체를 소유하는 컨트롤러 (허브)
        │   ├── playerSprite.ts               # 플레이어 스프라이트 렌더링 헬퍼
        │   ├── memoryRoomBackground.ts        # 배경 이미지 렌더링 헬퍼
        │   └── *.test.ts / playerSpriteAsset.test.js
        └── shared/                  # DOM·Canvas에 의존하지 않는 순수 로직 계층
            ├── mapLogic.ts          # 이동/충돌/장치 상호작용 판정 + 씬 전환(FlowState)
            ├── mapAssetManifest.ts  # 맵 좌표 데이터의 단일 원본 + 무결성 검증
            ├── gameLogic.ts         # 기억 연결 퍼즐 상태 기계
            ├── collectionLogic.ts   # 추억 물건 수집 상태 기계
            ├── lettingGoLogic.ts    # letting-go 선택 퀴즈 상태 기계
            ├── epilogueLogic.ts     # 에필로그 단계(phase) 상태 기계
            └── *.test.ts
```

## 2. 아키텍처 레이어 개관

이 프로젝트는 프레임워크 없이 순수 TypeScript + Canvas 2D로 동작한다. 레이어는 아래처럼 나뉜다.

| 레이어 | 위치 | 역할 | Chapter3와의 관계 |
|---|---|---|---|
| 진입점 | `src/main.ts` | 챕터 선택 메뉴 렌더링, DOM 요소 조립, 클릭 시 해당 챕터의 게임 클래스를 `new`로 생성하고 `mount()` 호출 | Chapter3를 직접 인스턴스화하는 유일한 지점 |
| 플랫폼 공용 인프라 | `src/platform/client/Game.ts` | 범용 RAF 루프 래퍼 클래스 | **미사용** — Chapter3는 자체 루프를 구현 (아래 3.1 참고) |
| 공유 유틸 | `src/shared/math.ts` | `clamp()` 등 범용 함수 | **미사용** — Chapter3는 이동 범위 제한을 `Math.max/min`으로 직접 구현 |
| 공통 에셋 | `src/assets/` | 2개 이상 챕터가 쓰는 이미지·음원 | `yeongsu-alien-suit-sprites.png` 1개를 Chapter1과 공유 |
| 기능(Chapter3) | `src/features/chapter3/` | 챕터 전체 구현 | 이 문서의 핵심 분석 대상 |

`platform/`과 최상위 `shared/`는 여러 기능이 실제로 쓸 때 의미가 생기는 계층인데, 현재 Chapter3(그리고 grep 결과 다른 챕터도)는 둘 다 참조하지 않는다. 즉 이 두 파일은 "공유 인프라로 준비는 되어 있지만 아직 실제로 공유되지는 않는" 상태다. `AGENTS.md`/`CLAUDE.md`의 "실제 반복이 확인된 뒤 공통화한다" 원칙과 일치하는 상태이므로, 새 기능을 만들 때 이 파일들을 억지로 사용할 필요는 없다.

## 3. Chapter3 내부 아키텍처 상세

### 3.1 `client/MemoryReconstructionGame.ts` — 컨트롤러(허브)

챕터 전체를 소유하는 단일 클래스. 480줄짜리 이 파일이 사실상 Chapter3의 "메인 상태 기계 조합체"다.

- **소유하는 상태**: `screen`(현재 화면), `state`(퍼즐), `flow`(맵↔퍼즐↔결과 전환), `collection`(수집), `lettingGo`(letting-go), `epilogue`(에필로그), `player`(좌표), `playerFacing`, `pressed`(입력 키 집합) 등 6개 shared 모듈의 상태를 전부 필드로 들고 있다.
- **입력 처리**: `onKeyDown`/`onKeyUp`, 캔버스 클릭, 방향 버튼 pointerdown/up 이벤트를 등록하고, 현재 `screen` 값에 따라 어떤 입력이 유효한지 분기한다.
- **게임 루프**: `requestAnimationFrame`을 직접 호출하는 `loop()` 메서드를 갖고 있다 — `src/platform/client/Game.ts`를 쓰지 않고 자체 구현이다. 매 프레임 `updateMap()`(이동 처리)과 `render()`(화면별 draw 함수 분기)를 호출한다.
- **렌더링 분기**: `render()`가 `screen` 값에 따라 `drawMap`/`drawPuzzle`/`drawAwakening`/`drawLettingGo`/`drawEpilogue`/`drawResult` 중 하나를 호출한다. 각 draw 함수는 Canvas 2D API를 직접 사용하는 절차적 렌더링 코드다.
- **DOM 동기화**: `syncControls()`가 현재 상태에 맞춰 HTML 버튼의 `hidden`/`disabled`와 ARIA `live region` 안내 문구를 갱신한다. 게임 상태(TS 객체)와 실제 DOM이 이 함수를 통해서만 동기화된다.
- **shared 모듈과의 관계**: 6개 shared 모듈의 순수 함수(`connectMemory`, `movePlayer`, `collectNearby`, `chooseLettingGo`, `advanceEpilogue` 등)를 호출해 새 상태를 받고, 그 결과에 따라 `screen`을 전환한다. 즉 **"상태 전이 로직은 shared에 있고, 언제 그 함수를 호출할지·그 결과로 화면을 어떻게 바꿀지는 이 컨트롤러가 결정한다"**는 역할 분리다.

### 3.2 `shared/*.ts` — 순수 로직 계층 (상태 기계 6종)

DOM이나 Canvas에 의존하지 않는 순수 함수/타입만 담는다. 모두 `create*()`(초기 상태 생성)와 `transition/advance/connect/choose*()`(불변 업데이트 함수) 패턴을 따르고, 각각 짝을 이루는 `*.test.ts`가 있다.

| 파일 | 담당 상태 | 핵심 함수 | 비고 |
|---|---|---|---|
| `mapLogic.ts` | `FlowState`(맵↔퍼즐↔결과 씬 전환), 플레이어 이동/충돌 | `movePlayer`, `canInteract`, `canActivateDevice`, `transitionFlow` | 다른 shared 모듈에 의존하지 않는 가장 하위 레이어. `mapAssetManifest`의 `SPACESHIP_MAP`을 가져와 `MAP_BOUNDS`/`DEVICE`/`OBSTACLES` 상수를 만들지만, 이 상수들은 실제 게임 코드가 아니라 **테스트 파일에서만** 쓰인다(레거시에 가까움). |
| `mapAssetManifest.ts` | 맵 좌표 데이터 원본 | `requirePlayableMap`, `validateMapAssetManifest` | 코드라기보다 "데이터 + 검증 함수"에 가깝다. `SPACESHIP_MAP`/`MEMORY_ROOM_MAP` 객체가 맵 경계, 충돌 박스, 스폰 지점, 장치 위치, 추억 물건·가족 마커 좌표의 단일 원본이다. `requirePlayableMap`은 앱 시작 시(`MemoryReconstructionGame` 생성자) 호출되어, 좌표가 깨져 있으면 즉시 예외를 던진다. |
| `gameLogic.ts` | `MemoryGameState`(퍼즐) | `connectMemory`, `awakeningStage`, `familyAtPoint` | 다른 shared 모듈을 전혀 import하지 않는 유일한 모듈 — 가장 독립적이고 건드리기 안전한 파일. |
| `collectionLogic.ts` | `CollectionState`(수집) | `collectNearby`, `nearbyMemoryObject`, `collectionAvailable` | `mapAssetManifest`의 `MEMORY_ROOM_MAP.memoryObjects` 좌표를 가져와 `MEMORY_OBJECTS` 배열을 만든다. `mapLogic`의 `FlowState` 타입도 참조(수집 가능 여부 판정용). |
| `lettingGoLogic.ts` | `LettingGoState` | `chooseLettingGo`, `canStartLettingGo` | `collectionLogic`의 `CollectionState` 타입을 참조(수집 완료 여부 판정용). |
| `epilogueLogic.ts` | `EpilogueState`(phase 상태 기계) | `advanceEpilogue`, `enterArchive`, `placeArchiveRecord`, `moveEpiloguePlayer` | `lettingGoLogic`의 `LettingGoState`(시작 조건)와 `mapLogic`의 `Point` 타입을 참조. 8단계 `EpiloguePhase`(`locked→silence→corridor→archive→archive-complete→montage→homeworld→journal→credits→postcredits→complete`)를 순서대로 전이시키는 선형 상태 기계다. |

### 3.3 `client/playerSprite.ts`, `client/memoryRoomBackground.ts` — 렌더링 헬퍼

둘 다 "이미지가 로드되지 않았으면 `false`를 반환해 호출자가 벡터 도형으로 대체 렌더링할 수 있게 한다"는 동일한 방어 패턴을 쓴다 (`MemoryReconstructionGame.drawPlayer`, `drawMap`에서 이 반환값으로 fallback 분기).

- `playerSprite.ts`: 스프라이트 시트에서 방향(`down/left/right/up`)에 맞는 프레임 하나를 잘라 그린다. `mapLogic.ts`의 `PLAYER_SIZE`, `Point`에 의존.
- `memoryRoomBackground.ts`: 배경 이미지를 캔버스 전체에 그리는 아주 얇은 헬퍼. `selectChapter03Background`가 `deviceComplete` 여부로 우주선/기억의 방 배경 중 하나를 고른다.

### 3.4 `assets/*.png` — 챕터 전용 정적 에셋

`MemoryReconstructionGame.ts` 생성자에서 `new URL('../assets/...png', import.meta.url).href` 형태로 로드한다(Vite의 정적 에셋 처리 방식). 플레이어 스프라이트만 예외적으로 `src/assets/`(공통 에셋)에서 가져온다.

## 4. 의존 관계도

```text
main.ts
  └─ new MemoryReconstructionGame(canvas, controls).mount()
       │
       ├─ shared/gameLogic.ts            (독립 — 의존 없음)
       │
       ├─ shared/mapLogic.ts ──────────► shared/mapAssetManifest.ts
       │
       ├─ shared/mapAssetManifest.ts     (독립 — 데이터 원본)
       │
       ├─ shared/collectionLogic.ts ───► shared/mapLogic.ts (type only)
       │                            └──► shared/mapAssetManifest.ts (좌표 데이터)
       │
       ├─ shared/lettingGoLogic.ts ────► shared/collectionLogic.ts (type only)
       │
       ├─ shared/epilogueLogic.ts ─────► shared/lettingGoLogic.ts (type only)
       │                            └──► shared/mapLogic.ts (Point type only)
       │
       ├─ client/memoryRoomBackground.ts (독립)
       │
       └─ client/playerSprite.ts ──────► shared/mapLogic.ts (PLAYER_SIZE, Point)

런타임에만 로드되는 에셋 (import 그래프 밖):
  features/chapter3/assets/chapter03-spaceship-lab.png
  features/chapter3/assets/chapter03-memory-room-v2.png
  src/assets/yeongsu-alien-suit-sprites.png  ← chapter1도 함께 사용

Chapter3가 참조하지 않는 저장소 공용 코드:
  src/platform/client/Game.ts   (RAF 루프 — Chapter3는 자체 구현)
  src/shared/math.ts            (clamp — Chapter3는 자체 Math.max/min 사용)
```

의존 방향은 전부 `client/MemoryReconstructionGame.ts` → `shared/*` → (필요 시) `mapAssetManifest.ts`로 한 방향이다. shared 모듈 사이의 상호 참조는 대부분 **타입만** 가져오는 것이라(`import type`), 런타임 결합도는 낮다. 순환 참조는 없다.

## 5. 공유·충돌(Shared/Conflict) 관점 정리

새 스토리 비트를 추가할 때 "무엇을 건드리면 다른 곳이 깨지는가"를 기준으로 정리한다.

### 5.1 실제로 공유되고 있어 조심해야 하는 지점

- **`src/assets/yeongsu-alien-suit-sprites.png`**: Chapter1(`RooftopEscapeGame.ts`, `RhythmHorrorGame.ts`)과 Chapter3가 동시에 참조한다. 이 스프라이트 시트의 프레임 배치(64×80px, `down/left/right/up` 순서)를 바꾸면 두 챕터가 동시에 깨진다. 이 파일은 교체가 아니라 반드시 사전 협의가 필요하다.
- **`mapAssetManifest.ts`**: Chapter3 내부에서는 사실상 "지도 데이터의 단일 원본"이다. `requirePlayableMap()`이 앱 부팅 시점(생성자)에 검증하므로, 좌표 하나라도 범위를 벗어나면 **게임 전체가 아예 뜨지 않는다**. 새 맵/장면을 추가하며 이 파일에 좌표를 잘못 추가하면 기존 화면까지 함께 죽는다 — 가장 민감한 파일.
- **`client/MemoryReconstructionGame.ts`**: 6개 shared 모듈과 2개 client 헬퍼 전부가 모이는 허브. 새 `Screen`이나 씬 전환을 추가하면 필연적으로 이 파일의 `render()`, `syncControls()`, `loop()` 근처를 건드리게 된다. `CLAUDE.md`의 "최소 연결 훅"(새 `Screen` 값 1개 + 분기 1개) 원칙이 정확히 이 지점을 겨냥한 것이다 — 이 파일을 크게 리팩터링하면 6개 모듈 전체의 통합 지점이 흔들린다.

### 5.2 "공유 의도"로 준비돼 있지만 현재는 미사용인 지점

- `src/platform/client/Game.ts`, `src/shared/math.ts`는 이름상 여러 챕터가 쓸 것처럼 보이지만, grep 결과 Chapter3를 포함한 어떤 챕터도 참조하지 않는다. 새 기능에서 이 파일들을 "공용이니까 써야 한다"고 오해해 억지로 끌어다 쓸 필요는 없다. 반대로, 여러 챕터에서 동일한 로직이 실제로 반복되는 게 확인되면 그때 이 파일들을 채우는 것이 저장소 원칙(`docs/architecture.md`)과 맞는다.

### 5.3 Chapter3 내부에서 상대적으로 독립적이라 안전한 지점

- `shared/gameLogic.ts`는 다른 shared 모듈을 전혀 참조하지 않는 유일한 파일이라 가장 안전하게 확장할 수 있다.
- `shared/mapLogic.ts`의 `MAP_BOUNDS`/`DEVICE`/`OBSTACLES` export는 테스트 코드 외에는 아무도 참조하지 않으므로, 이 상수들과 관련된 부분은 실질적인 파급 효과가 거의 없다.
- shared 모듈 간 참조는 대부분 `import type`(타입 전용)이라, 한 모듈의 런타임 로직을 바꿔도 다른 모듈이 바로 깨지지는 않는다. 다만 타입 시그니처(필드 이름 등)를 바꾸면 참조하는 쪽의 타입 검사가 깨질 수 있다.

## 6. 새 스토리 비트를 추가할 때의 시사점

- 새 상태 기계는 `shared/`에 새 파일로 만들고, 기존 6개 모듈의 상태 타입(`FlowState`, `EpiloguePhase` 등)은 고쳐 쓰지 않는다 — `CLAUDE.md`의 add-only 원칙과 정확히 맞물린다.
- `mapAssetManifest.ts`에 좌표를 추가해야 한다면(예: 구출 서브시퀀스의 새 상호작용 지점), `requirePlayableMap`의 검증을 반드시 통과해야 앱이 뜬다는 점을 기억한다.
- `MemoryReconstructionGame.ts`를 건드릴 때는 "새 `Screen` 값 + 새 분기"로 범위를 최소화하고, 기존 `render()`/`syncControls()`의 기존 분기 로직 자체는 재작성하지 않는다.
- 플레이어 스프라이트를 새 장면에서도 쓰려면 `playerSprite.ts`를 그대로 재사용할 수 있다(챕터1과 공유하는 자산이므로 시트 자체는 건드리지 않는다).
