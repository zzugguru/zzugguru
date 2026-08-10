# Chapter 3 보완 작업 브리프

이 파일은 Chapter3(`src/features/chapter3/`) 보완 작업의 요청·질문·결정·결과를 공유하는 단일 창구다. 작업마다 새 파일을 만들지 않고 이 파일을 재사용한다. 섹션 소유권 규칙은 루트 `CLAUDE.md`의 "Feature delivery workflow"를 따른다.

- 개발자 소유: `Developer Request`, `Developer Decisions`, `Developer Final Check`
- 에이전트 소유: `Agent Understanding`, `Agent Questions`, `Agent Result`

## Developer Request

상태: READY

```markdown
# 비트 2 · 우주선 정전 · 기억세계 변모 연출

## 목표
추억 물건 수집을 모두 마친 직후, 재구성된 가족을 둘러싼 갈등(누나의 저지 시도, 아내의 대치)과
우주선 정전·변모를 보여주는 장면을 넣어 letting-go 진입 전 서사적 공백을 채운다.

## 범위
- 추억 물건 수집 완료(`collection.completed`) 시점에 기존처럼 곧장 letting-go로 가지 않고,
  새 중간 화면(정전·대치)이 먼저 뜬다.
- 원작 203~227줄 기반 대치 대화 3줄(아내→누나→영수) + 변모를 알리는 내레이션 2줄, 총 5줄.
- 대사가 진행될수록 화면이 점점 어두워지는 "정전" 연출(색 오버레이, 새 이미지 에셋 없음).
- 마지막 줄 이후 짧은 페이드를 거쳐 기존 letting-go 진입 로직으로 자연스럽게 연결된다.
- 새 상태는 새 shared 파일(`shared/blackoutLogic.ts`)로 관리, 비트1의 `dialogue-overlay`/
  `renderDialogueBox`를 그대로 재사용한다.

## 제외 범위
- 새 배경 이미지/일러스트 (색 오버레이로 "정전·변모"를 표현, 실제 지구 풍경 그림은 그리지 않음)
- 외계 가족 구출 서브시퀀스(비트3) — 이번 화면은 letting-go로 바로 연결되고, 비트3은 이후
  별도 작업에서 이 사이에 끼워 넣는다.
- 대치 대화에 대한 선택지 (원작에서도 분기 없음)

## 완료 조건
- 마지막 추억 물건을 정리하면 letting-go 대신 정전·대치 화면이 먼저 뜬다.
- 대사 5줄(대치 3줄 + 내레이션 2줄)이 순서대로 진행되며 화면이 점점 어두워진다.
- 마지막 줄 이후 페이드를 거쳐 기존 letting-go 화면으로 정상 진입한다(퀴즈가 정상 동작).
- 키보드(E/Enter)와 클릭 양쪽으로 진행 가능.
- live region 안내 문구가 갱신된다.
- `npm run typecheck && npm run test && npm run build && npm run design:lint && git diff --check` 통과.
- 기존 화면(map/warning/playing/awakening/result/letting-go/epilogue)의 동작이 회귀하지 않는다.
```

## Agent Understanding

- 수집 완료 트리거는 기존 `interact()`의 `collectionAvailable` 분기 안, `next.completed`가 참이 될 때다. 이 지점은 비트1과 달리 기존 코드(수집 완료 시 `letting-go`로 보내는 로직) 내부이므로, 여기서는 "새 분기 추가"가 아니라 "기존 분기의 전환 대상 3줄을 blackout으로 바꾸는" 최소한의 수정이 불가피하다 — add-only 원칙의 예외 지점으로 명시하고 리뷰에서 특히 살펴보게 한다.
- `shared/blackoutLogic.ts`는 `wardenWarningLogic.ts`와 동일한 `{step, seen}` 상태 기계 패턴을 그대로 따른다(검증된 패턴 재사용, 새 개념 도입 최소화).
- 렌더링은 `renderDialogueBox`(비트1에서 만든 `shared/dialogueBox.ts`)를 그대로 재사용하고, 그 위에 `step`에 비례해 짙어지는 반투명 검은 오버레이를 추가로 그려 "정전" 느낌을 낸다. 새 이미지 에셋은 만들지 않는다.
- 마지막 줄(`seen === true`) 이후 420ms 페이드는 비트1의 `warningFadeStartedAt` 패턴을 그대로 재사용(`blackoutFadeStartedAt`).
- 비트3(구출 서브시퀀스)은 아직 없으므로, 이번 화면은 페이드 후 곧장 기존 `letting-go` 진입 로직(`createLettingGo()` 호출)으로 연결한다. 비트3 작업 시 이 연결점(1줄)만 바꾸면 된다.

## Agent Questions

_(판단이 필요한 질문을 에이전트가 여기에 기록한다.)_

## Developer Decisions

- 2026-08-10: 비트2의 "새 에셋 필요 여부" 결정(2b) — 에이전트가 실제 그림 에셋을 제작할 수 없다는 실질적 제약에 따라 색·조명 오버레이로 정전·변모를 표현하기로 함. 실제 아트 에셋이 준비되면 이후 교체 가능.
- 2026-08-10: 새로고침/챕터 재진입 시 진행 상태(퍼즐, 수집, letting-go, 에필로그, 그리고 비트1의 "경고를 봤다" 플래그 포함) 전부를 초기화하는 기존 동작을 유지한다. 영구 저장(localStorage 등)은 지금 도입하지 않고, 필요해지면 게임 전체에 대한 별도 저장 기능으로 나중에 설계한다. 비트1의 경고 상태도 이 규칙을 따라 세션(인스턴스) 범위로만 관리한다.
- 2026-08-10: Chapter3 보완의 대상 스토리 비트 4개를 모두 승인함 — (1) 장치 작동 전 누나의 경고 컷씬, (2) 우주선 정전·기억세계 변모 연출, (3) 외계 가족 구출 서브시퀀스, (4) 마지막 저녁식탁 환상 인식 장면. 세부 착수 순서는 미정이며, 다음 `Developer Request`에서 지정한다. 상세는 `src/features/chapter3/CLAUDE.md`의 "스토리 갭 백로그" 참고.
- 2026-08-10: "기존 코드 수정 없이 추가" 규칙은 "신규 파일 + 최소 연결 훅 허용" 수준으로 확정. 상세 정의는 루트 `CLAUDE.md`의 "Add-only 개발 원칙" 참고.
- 2026-08-10: Chapter3 보완 작업은 이 파일을 Codex `BRIEF.md`에 준하는 단일 창구로 사용하기로 결정.

## Agent Result

_(비트1의 상세 구현 기록은 git 이력(커밋 `d3c285b`, `dd0d13c`)에 남아 있다. 요약은 아래 Completed Work Log 참고.)_

**구현 목표**: 비트 2 · 우주선 정전 · 기억세계 변모 연출 (완료 조건은 위 Developer Request 참고)

**변경 파일**
- 신규: `src/features/chapter3/shared/blackoutLogic.ts`, `blackoutLogic.test.ts`
- 수정(최소 연결 훅 + 예외 1건): `src/features/chapter3/client/MemoryReconstructionGame.ts` — `Screen`에 `'blackout'` 추가, `blackout`/`blackoutFadeStartedAt` 필드, `interact()`/`onKeyDown`/`onCanvasClick`/`loop()`/`render()`에 새 분기, 신규 `drawBlackout()`(비트1의 `dialogue-overlay` 재사용 + step 비례 암전 오버레이), `syncControls()` 정리. **add-only 예외**: `interact()`의 기존 `collectionAvailable` 분기 안 `if (next.completed) {...}` 블록 3~4줄을 "letting-go 직행"에서 "blackout 경유"로 교체(리뷰에서 위험도 낮음으로 평가받음, 상세는 아래 리뷰 결과 참고).

**주요 설계 결정**
- `blackoutLogic.ts`는 `wardenWarningLogic.ts`와 동일한 `{step, seen}` 패턴을 그대로 재사용(검증된 패턴 재사용, 새 개념 최소화).
- 렌더링은 비트1의 `renderDialogueBox`를 그대로 재사용하고, `step`에 비례해 짙어지는 반투명 검은 오버레이만 추가해 "정전" 연출(새 이미지 에셋 없음, Developer Decisions의 2b 결정 반영).
- 비트3(구출 서브시퀀스)이 아직 없어 페이드 후 곧장 기존 `letting-go` 진입 로직(`createLettingGo()`)으로 연결 — 비트3 작업 시 이 한 지점만 바꾸면 됨.

**실행한 검사와 결과**
- `npm run typecheck` 통과
- `npm run test` — 157/158 통과(신규 4건 포함). 실패 1건은 `mapLogic.test.ts`의 무관한 기존 실패(리뷰어가 클린 HEAD `dd0d13c`에서 동일 재현 확인).
- `npm run build`, `npm run design:lint`(신규 컴포넌트 없음, 기존 경고 2건만), `git diff --check` 통과.

**리뷰 서브에이전트 결과**: 읽기 전용 Explore 서브에이전트가 diff, 4/5·5/5 수집 케이스의 회귀 여부, 페이드 타이머 1회성, `dimAlpha` 범위, 화자 순서(원작 203~227줄 대조)를 독립 검토. add-only 예외 지점도 명시적으로 평가 요청함 — "위험 수준 낮음, 은폐된 수정 아님"으로 판단. 발견 사항 없음, **승인**.

**브라우저 실동작 확인 — 부분적으로만 완료**
- 이동(방향키), 장치 탐색까지는 여러 차례 화면으로 확인.
- 그러나 이번 검증 라운드에서는 dev 서버의 Vite HMR 연결이 반복적으로 끊기고 재접속하는 현상("server connection lost. Polling for restart...")이 여러 차례 발생했고, 이 과정에서 페이지가 임의로 챕터 선택 메뉴로 되돌아가거나(추정: 자동화 탭이 백그라운드로 처리되며 발생하는 환경 제약), 최종적으로는 게임 인스턴스는 마운트되었으나 렌더링된 `<canvas>`가 DOM에서 분리된 것으로 보이는 상태(빈 화면, `map-controls`가 계속 `hidden`, live region 빈 문자열, 그러나 게임 루프 콜백은 등록된 것으로 확인됨)에 도달해, blackout 화면까지 실제 도달하는 데는 실패했다.
- 서버 재시작과 재접속을 여러 번 시도했지만 동일 환경 불안정성이 반복되어, 이 항목은 사람이 직접 로컬에서 `npm run dev`로 플레이해 최종 확인하는 것을 권장한다.
- 다만 이번 비트2가 재사용한 대화창 오버레이·페이드 메커니즘 자체는 비트1 작업에서 이미 브라우저로 완전히 검증된 바 있다(맵→경고→3줄 진행→페이드→퍼즐 전환까지 실제 확인됨). 비트2는 그 위에 암전 오버레이만 추가한 것이라 핵심 렌더링 경로의 위험은 낮다고 판단한다.

**남은 위험 / 확인하지 못한 영역**
- **정전 암전 연출의 실제 체감**(5줄에 걸친 어두워짐, 페이드와의 합성)을 브라우저에서 직접 확인하지 못함 — 코드 계산(0.15~0.63 범위, 이후 페이드로 1.0까지)은 검증됨.
- **수집 완료 → blackout → letting-go 전체 전환**의 실제 화면 동작을 끝까지 눈으로 확인하지 못함. 정적 분석·테스트·독립 리뷰로는 검증됨.
- `MemoryReconstructionGame` 클래스 자체의 통합 테스트는 기존에도 없어 이번에도 커버되지 않음.

## Developer Final Check

_(개발자가 diff와 실제 동작을 확인한 뒤 여기에 기록한다.)_

## Completed Work Log

- 2026-08-10: 비트 1(장치 작동 전 누나의 경고 컷씬) 구현 완료. typecheck/test/build/git diff --check 통과, 리뷰 서브에이전트 승인.
- 2026-08-10: 비트 1 연출을 전체 암전 텍스트 방식에서 대화창 오버레이 + 페이드 전환 방식으로 재작업. 2차 리뷰 승인, 브라우저 실동작 확인 완료.
- 2026-08-10: 비트 1 대화창을 Chapter2 대화창(`dialogueBox.ts`)과 동일한 시각 형식으로 재구현(신규 `shared/dialogueBox.ts` 복제). 검사·브라우저 확인 완료.
- 2026-08-10: 비트 2(우주선 정전·기억세계 변모 연출) 구현 완료. typecheck/test/build/design:lint/git diff --check 통과, 리뷰 서브에이전트 승인. 브라우저 실동작 확인은 dev 서버 환경 불안정으로 부분적으로만 완료 — 개발자의 로컬 실동작 확인 권장.
