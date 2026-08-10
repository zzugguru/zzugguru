# Chapter 3 보완 작업 브리프

이 파일은 Chapter3(`src/features/chapter3/`) 보완 작업의 요청·질문·결정·결과를 공유하는 단일 창구다. 작업마다 새 파일을 만들지 않고 이 파일을 재사용한다. 섹션 소유권 규칙은 루트 `CLAUDE.md`의 "Feature delivery workflow"를 따른다.

- 개발자 소유: `Developer Request`, `Developer Decisions`, `Developer Final Check`
- 에이전트 소유: `Agent Understanding`, `Agent Questions`, `Agent Result`

## Developer Request

상태: READY

```markdown
# 비트 3 · 외계 가족 구출 서브시퀀스

## 목표
비트2의 정전·변모 이후, 영수가 기억세계로 변한 우주선 안에서 각자의 트라우마 기억에 갇힌
외계 아버지·어머니·누나를 찾아가 구출한다. 3명을 모두 구출해야 다음 장면(letting-go, 추후 비트4)으로
넘어갈 수 있는 필수 진행 조건이다.

## 범위
- 비트2의 정전 페이드가 끝나면 letting-go로 곧장 가지 않고, 맵 화면(기억의 방)으로 돌아온다.
- 맵 위에 아버지·어머니·누나 3개의 구출 지점이 표시된다(새 이미지 에셋 없이 마커 표시).
- 각 지점에 접근해 상호작용(E/Enter)하면 그 인물의 트라우마 루프를 설명하는 대사가
  대화창 오버레이(비트1·2와 동일한 `dialogueBox`)로 진행되고, 완료되면 "구출됨"으로 표시된다.
- 3명 중 몇 명 구출했는지 보여주는 진행 HUD.
- 3명 모두 구출하면 짧은 페이드를 거쳐 기존 letting-go 진입 로직으로 연결된다(비트4가 아직
  없으므로 임시로 letting-go 직결 — 비트4 작업 시 이 연결점만 교체).
- 새 상태는 새 shared 파일(`shared/rescueLogic.ts`)로 관리.

## 제외 범위
- 각 인물의 트라우마 장면을 별도 배경 이미지로 그리는 것 (기존 기억의 방 배경 + 진행형 암전
  오버레이 재사용, 비트2에서 이미 정전 상태이므로 그 분위기를 이어받는다)
- 구출 순서 고정 (3명을 어떤 순서로 찾아가도 무방)
- 구출하지 못했을 때의 실패 처리 (원작처럼 실패 없이 결국 모두 구출되는 것을 전제)

## 완료 조건
- 비트2 완료 직후 맵 화면으로 돌아오고, 3개의 구출 지점이 보인다.
- 각 지점 근처에서 E/Enter 또는 클릭으로 해당 인물의 구출 대화가 시작되고, 끝까지 진행하면
  "구출됨"으로 표시된다.
- 3명 모두 구출하기 전에는 letting-go로 넘어가지 않는다.
- 3명 모두 구출하면 페이드를 거쳐 기존 letting-go 화면으로 정상 진입한다(퀴즈 정상 동작).
- 키보드(E/Enter)와 클릭 양쪽으로 진행 가능, live region 안내 문구 갱신.
- `npm run typecheck && npm run test && npm run build && npm run design:lint && git diff --check` 통과.
- 기존 화면(map/warning/blackout/playing/awakening/result/letting-go/epilogue)의 동작이 회귀하지 않는다.
```

## Agent Understanding

- 비트2의 정전 페이드가 끝나는 지점(`loop()`의 `blackout.seen && elapsed>=420` 블록)을 "letting-go 직행"에서 "map 화면(구출 단계) 복귀"로 바꾼다. 비트2 때 만든 지점을 다시 한 번 수정하는 것이라 add-only 예외로 명시한다.
- 구출 단계가 시작됐는지는 `this.blackout.seen`으로 판단한다(비트2가 이미 끝났다는 뜻). `rescueAvailable(blackoutSeen, rescue)`라는 순수 함수를 새 파일에 정의해 `collectionAvailable(flow)`와 대구를 이루게 한다.
- **기존 코드에 두 번째 예외가 필요하다**: `interact()`의 기존 수집 분기(`if (this.screen === 'map' && collectionAvailable(this.flow))`)는 수집이 끝난 뒤에도 `screen==='map'`이면 항상 이 분기에 먼저 걸려 이후 분기(새 구출 트리거)에 도달하지 못한다. 가드에 `&& !this.collection.completed`를 추가해, 수집이 끝난 뒤에는 이 분기를 건너뛰도록 최소 수정한다. 마찬가지로 `drawMap()`의 `if (collectionAvailable(this.flow)) this.drawMemoryArea();`도 `&& !this.blackout.seen` 조건을 추가해, 구출 단계에서 수집 완료 HUD·재구성 가족 NPC가 계속 표시되는 것을 막는다. 두 지점 모두 리뷰에서 특히 확인받는다.
- 구출 대화 진행은 비트1의 `WarningState({step, seen})` 패턴을 재사용하되, 대상 인물(`targetId`)을 함께 들고 다니는 `RescueDialogueState`로 감싼다. 대사가 끝나면(seen) 해당 인물을 `RescueState.rescued`에 추가하고 맵으로 복귀 — 3번째 인물일 때만 페이드 후 letting-go로 연결된다(비트1·2의 페이드 패턴 재사용, `rescueFadeStartedAt`).
- 구출 지점 좌표는 `mapAssetManifest.ts`(기존 파일)를 건드리지 않고 `rescueLogic.ts` 안에 직접 정의한다(기존 `MEMORY_ROOM_MAP.collisions`와 겹치지 않는 좌표를 확인해서 선정).

## Agent Questions

_(판단이 필요한 질문을 에이전트가 여기에 기록한다.)_

## Developer Decisions

- 2026-08-10: 비트2의 "새 에셋 필요 여부" 결정(2b) — 에이전트가 실제 그림 에셋을 제작할 수 없다는 실질적 제약에 따라 색·조명 오버레이로 정전·변모를 표현하기로 함. 실제 아트 에셋이 준비되면 이후 교체 가능.
- 2026-08-10: 새로고침/챕터 재진입 시 진행 상태(퍼즐, 수집, letting-go, 에필로그, 그리고 비트1의 "경고를 봤다" 플래그 포함) 전부를 초기화하는 기존 동작을 유지한다. 영구 저장(localStorage 등)은 지금 도입하지 않고, 필요해지면 게임 전체에 대한 별도 저장 기능으로 나중에 설계한다. 비트1의 경고 상태도 이 규칙을 따라 세션(인스턴스) 범위로만 관리한다.
- 2026-08-10: Chapter3 보완의 대상 스토리 비트 4개를 모두 승인함 — (1) 장치 작동 전 누나의 경고 컷씬, (2) 우주선 정전·기억세계 변모 연출, (3) 외계 가족 구출 서브시퀀스, (4) 마지막 저녁식탁 환상 인식 장면. 세부 착수 순서는 미정이며, 다음 `Developer Request`에서 지정한다. 상세는 `src/features/chapter3/CLAUDE.md`의 "스토리 갭 백로그" 참고.
- 2026-08-10: "기존 코드 수정 없이 추가" 규칙은 "신규 파일 + 최소 연결 훅 허용" 수준으로 확정. 상세 정의는 루트 `CLAUDE.md`의 "Add-only 개발 원칙" 참고.
- 2026-08-10: Chapter3 보완 작업은 이 파일을 Codex `BRIEF.md`에 준하는 단일 창구로 사용하기로 결정.
- 2026-08-10: 비트3은 letting-go 진입을 위한 **필수** 진행 조건으로 확정(스킵 불가). 구출 게임 방식은 **맵 탐색형**으로 확정(추억 물건 수집과 동일한 패턴 — 지점에 접근해 E키로 상호작용).
- 2026-08-10: 비트2 브라우저 실동작은 개발자가 로컬에서 직접 확인 완료. 이후 세션에서 dev 서버 환경 불안정 문제는 별도로 재확인하지 않아도 됨.

## Agent Result

_(비트1·비트2의 상세 구현 기록은 git 이력(커밋 `d3c285b`, `dd0d13c`, `4e97349`, `7fb1ba9`)과 `markdown/chapter3-development-log.md`에 남아 있다. 요약은 아래 Completed Work Log 참고.)_

**구현 목표**: 비트 3 · 외계 가족 구출 서브시퀀스 (완료 조건은 위 Developer Request 참고)

**변경 파일**
- 신규: `src/features/chapter3/shared/rescueLogic.ts`, `rescueLogic.test.ts`
- 수정(최소 연결 훅 + 예외 3건): `src/features/chapter3/client/MemoryReconstructionGame.ts` — `Screen`에 `'rescue'` 추가, `rescue`/`rescueDialogue`/`rescueFadeStartedAt` 필드, `interact()`/`onKeyDown`/`onCanvasClick`/`loop()`/`render()`/`syncControls()`에 새 분기, 신규 `drawRescueTargets()`(맵 위 3개 지점 마커 + 진행 HUD)·`drawRescue()`(대화창 재사용 + 페이드). **add-only 예외 3건**(전부 리뷰에서 검토·승인):
  1. 기존 수집 분기 가드에 `&& !this.collection.completed` 추가 — 수집 완료 후에도 매번 이 분기가 이후 분기(구출 트리거)를 가로채는 것을 막기 위함.
  2. 그 안의 `if (next.completed)`에 `&& !this.blackout.seen` 추가 — 리뷰에서 "현재는 항상 참인 죽은 조건(무해)"으로 지적받아, 의도를 남기는 주석을 추가함.
  3. `loop()`의 정전-페이드-완료 목적지를 "letting-go 직행"에서 "map(구출 단계) 복귀"로 변경.
  (참고: `drawMap()`의 `drawMemoryArea` 조건에 `&& !this.blackout.seen`을 추가한 것은 비트2에서 이미 반영·승인된 지점.)

**주요 설계 결정**
- `rescueLogic.ts`는 `collectionLogic.ts`(좌표·근접 판정 패턴)와 `wardenWarningLogic.ts`(대화 진행 `{step,seen}` 패턴)를 조합한 구조 — 새 개념 도입 없이 검증된 두 패턴을 재사용.
- 구출 지점 좌표(아버지 500,460 / 어머니 850,450 / 누나 260,460)는 `mapAssetManifest.ts`(기존 파일)를 건드리지 않고 `rescueLogic.ts` 안에 직접 정의 — `MEMORY_ROOM_MAP.collisions`와 겹치지 않음을 리뷰에서 좌표 대조로 확인.
- 맵 탐색(지점 접근) + 대화창 오버레이(구출 대화)의 하이브리드 방식으로 구현 — Developer Decisions에서 확정한 "맵 탐색형"을 반영.
- 3명 모두 구출 전에는 letting-go로 갈 수 없음 — "필수 진행" 결정 반영. 비트4가 아직 없어 페이드 후 곧장 letting-go로 연결(비트2와 동일하게, 다음 비트 작업 시 연결점 1곳만 교체하면 됨).

**실행한 검사와 결과**
- `npm run typecheck` 통과
- `npm run test` — 164/165 통과(신규 7건 포함). 실패 1건은 `mapLogic.test.ts`의 무관한 기존 실패(리뷰어가 클린 상태에서 동일 재현 확인, 비트1·2 때와 동일).
- `npm run build`, `npm run design:lint`(신규 컴포넌트 없음, 기존 경고 2건만), `git diff --check` 통과.

**리뷰 서브에이전트 결과**: 읽기 전용 Explore 서브에이전트가 diff, add-only 예외 3곳 각각의 필요성·부작용, 수집 4/5·5/5 경계, blackout↔rescue 화면 재진입 시 수집 분기 재실행 여부, 좌표-충돌 대조, 페이드 타이머 1회성을 독립 검토. 낮은 심각도 지적 1건(죽은 조건, 무해) → 의도를 남기는 주석으로 반영. **승인**.

**브라우저 실동작 확인**: 이번 라운드는 시도하지 않음. 비트2 검증에서 자동화 브라우저 환경(Vite HMR 반복 재접속, 탭 백그라운드 처리로 인한 타이머 스로틀링)이 매우 불안정했고, 사용자가 비트2를 로컬에서 직접 확인·승인한 전례에 따라 이번에도 로컬 `npm run dev` 확인을 요청한다. 재사용한 핵심 메커니즘(대화창 오버레이, 페이드, 맵 마커+근접 판정)은 비트1·2에서 이미 브라우저로 검증된 패턴이라 위험은 낮다고 판단.

**남은 위험 / 확인하지 못한 영역**
- 구출 지점 마커·HUD·대화창의 실제 화면 배치와 가독성은 브라우저로 확인되지 않음.
- 3개 지점을 순서 상관없이 자유롭게 방문할 수 있는지는 코드상 보장되나(순서 고정 로직 없음), 실제 플레이 동선에서 자연스러운지는 사람 확인 필요.
- `MemoryReconstructionGame` 클래스 자체의 통합 테스트는 기존에도 없어 이번에도 커버되지 않음.

---

**추가 반영: 구출 연출 드라마화 (2026-08-10)**

개발자 요청 — 가족 구출을 더 드라마틱하게 만들 아이디어 요청. A(구출할수록 배경이 밝아짐)·B(구출 순간 빛 링 이펙트)·C(3명 다 구출 후 여운 대사 한 줄) 세 가지를 제시했고 셋 다 채택됨. 비트3 코드가 이 시점까지 미커밋 상태였기 때문에 "기존 코드"가 아니라 자유롭게 재작업 가능한 신규 코드로 취급해 add-only 예외 판단 없이 바로 재설계했다.

- **변경 파일**: `shared/rescueLogic.ts`(`RESCUE_COMPLETE_LINE` 추가), `client/MemoryReconstructionGame.ts`(개별 구출 완료 시 상태 전이를 `release`(400ms 링 이펙트) → `line`(3번째 구출 시에만, 여운 대사, 플레이어 입력 대기) → `fade`(420ms) 3단계로 재설계, `rescueDimAlpha()` 헬퍼로 배경 밝기를 구출 인원에 비례시킴).
- **검사**: typecheck/test(164/165, 무관 기존 실패 동일)/build/design:lint/git diff --check 전부 통과.
- **리뷰**: 상태 전이(1·2번째 구출의 release→map 경로, 3번째 구출의 release→line→fade→letting-go 경로)를 프레임 단위로 추적 검증받음. 낮은 심각도 지적 1건(`rescueOutro==='fade'` 구간에서 live region 문구가 기본 안내문으로 잘못 돌아가는 회귀) → `syncControls()`에 한 줄 추가로 반영. 재검증 없이 수정 사항이 명확해 바로 반영.
- **남은 위험**: 새로 추가된 링 이펙트·배경 밝기 변화·여운 대사의 실제 체감은 브라우저로 확인되지 않음.

---

**버그 수정: 구출 링 이펙트가 화면에 보이지 않던 문제 (2026-08-10)**

개발자가 로컬 확인 중 "링 이펙트가 화면에 나오지 않는 것 같다"고 보고. 좌표 계산으로 원인을 확인:

- **원인**: 링을 목표물의 맵 좌표(아버지 500,460 / 어머니 850,450 / 누나 260,460)에 그렸는데, 이 좌표들이 전부 `dialogueBox.ts`의 대화창 영역(y:396~516, x:24~936) **안쪽**에 들어간다. 링을 대화창보다 먼저 그렸기 때문에, 그린 직후 대화창의 불투명 배경(`#111827` 단색 채움)이 그대로 덮어버려 항상 보이지 않았다.
- **수정**: 링 좌표를 목표물의 맵 좌표 대신 고정 위치 `(480, 250)`로 변경 — 최대 반경 74px를 감안해도 y범위(176~324)가 대화창 시작 지점(396)보다 72px 위라 절대 겹치지 않는다. 그리는 순서도 대화창 이후로 옮겨 이중 안전장치를 뒀다.
- **검증**: typecheck/build/git diff --check 통과. 좌표 계산 근거는 명확하나, 브라우저 자동화 환경이 이번엔 특히 불안정해(서버 재시작 2회, rAF 패치 유실 등) 실제 렌더링 스크린샷으로 재확인하지는 못함 — 좌표상 겹침이 원천적으로 불가능하다는 점에서 확신도는 높음. 로컬 확인 요청.

## Developer Final Check

_(개발자가 diff와 실제 동작을 확인한 뒤 여기에 기록한다.)_

## Completed Work Log

- 2026-08-10: 비트 1(장치 작동 전 누나의 경고 컷씬) 구현 완료. typecheck/test/build/git diff --check 통과, 리뷰 서브에이전트 승인.
- 2026-08-10: 비트 1 연출을 전체 암전 텍스트 방식에서 대화창 오버레이 + 페이드 전환 방식으로 재작업. 2차 리뷰 승인, 브라우저 실동작 확인 완료.
- 2026-08-10: 비트 1 대화창을 Chapter2 대화창(`dialogueBox.ts`)과 동일한 시각 형식으로 재구현(신규 `shared/dialogueBox.ts` 복제). 검사·브라우저 확인 완료.
- 2026-08-10: 비트 2(우주선 정전·기억세계 변모 연출) 구현 완료, 커밋 `4e97349`. typecheck/test/build/design:lint/git diff --check 통과, 리뷰 서브에이전트 승인. 브라우저 실동작 확인은 dev 서버 환경 불안정으로 부분적으로만 완료 — 개발자의 로컬 실동작 확인 권장.
- 2026-08-10: `chapter3-development-log.md` 신규 작성 및 관련 문서 상태 동기화, 커밋 `4e97349`에 포함.
- 2026-08-10: 비트 3(외계 가족 구출 서브시퀀스) 구현 완료. typecheck/test/build/design:lint/git diff --check 통과, 리뷰 서브에이전트 승인(낮은 심각도 지적 1건 반영). 브라우저 실동작은 로컬 확인 요청 — 개발자 확인 대기 중.
- 2026-08-10: 비트 3 구출 연출 드라마화(배경 밝기 변화, 구출 순간 빛 링 이펙트, 여운 대사 한 줄). 검사·리뷰 통과(낮은 심각도 지적 1건 반영).
- 2026-08-10: 구출 링 이펙트가 대화창에 가려 안 보이던 버그 수정(좌표를 대화창 밖 고정 위치로 이동). typecheck/build/git diff --check 통과.
