# Current Logic Work Brief

이 파일은 로직 작업 전용 요청, 질문, 결정과 결과를 공유하는 단일 창구입니다. 에셋 작업은 `BRIEF_ASSET.md`에서 독립적으로 관리합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Task

Chapter 3 하단 마우스 이동·상호작용 인터페이스 제거

### Goal

Chapter 3 게임 하단에 표시되는 방향 버튼과 상호작용 버튼을 제거해 Canvas와 키보드 중심 인터페이스로 단순화한다.

### Included Scope

- 하단 `▲ ◀ ▼ ▶` 방향 버튼 제거
- 하단 상황별 상호작용 버튼 제거
- 관련 pointer 및 click 이벤트 연결과 UI 상태 업데이트 제거
- 맵·개인실 복도·기록 보관소 진입 시 Canvas로 포커스 이동
- 안내 문구를 키보드 입력 기준으로 수정

### Excluded Scope

- 방향키/WASD, E/Enter 키보드 입력 변경
- Canvas 클릭으로 대사·장면 진행하는 기존 동작 변경
- 가족 선택, 놓아주기 선택, 다음, 재시도, 복귀 버튼 제거
- 게임 로직, 에셋, 좌표와 장면 흐름 변경

### Constraints

- `AGENTS.md`, `DESIGN.md`, `$two-agent-harness`를 따른다.
- 키보드 사용자가 맵 진입 시 즉시 조작할 수 있도록 Canvas 포커스를 유지한다.
- 다른 챕터 UI와 Chapter 3의 비이동 선택 버튼은 유지한다.

### Done When

- [ ] DOM과 CSS에서 `.map-controls`, 방향 버튼, 상호작용 버튼이 제거된다.
- [ ] `MemoryReconstructionGame`이 해당 요소 없이 생성·실행된다.
- [ ] 방향키/WASD, E/Enter와 기존 진행 버튼이 유지된다.
- [ ] 맵·복도·보관소 전환 시 Canvas가 포커스를 받는다.
- [ ] 필수 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

하단 map controls DOM과 관련 CSS·Controls 계약·이벤트 연결을 제거한다. 기존 키보드 입력과 Canvas click, 가족/놓아주기/다음/재시도/복귀 버튼은 유지한다. 방향 버튼으로 보내던 focus는 focus 가능한 Canvas로 이동하고 테스트로 보호한다.

## Agent Questions

없음. 사용자가 제안된 제거 범위를 승인했다.

## Developer Decisions

- 2026-08-10: 로직 작업은 `BRIEF.md`, 에셋 작업은 `BRIEF_ASSET.md`를 사용하며 별도 세션에서 진행한다.
- 2026-08-10: Chapter 3 하단 방향·상호작용 버튼은 제거하되 키보드와 나머지 진행 버튼은 유지한다.

## Agent Result

- Chapter 3 하단의 `.map-controls`, 방향 버튼 4개와 상황별 상호작용 버튼을 DOM 및 CSS에서 제거했다.
- `MemoryReconstructionGame`의 Controls 계약, pointer 이벤트와 버튼 상태 업데이트에서 해당 요소 의존성을 제거했다. 안내 문구도 `방향키/WASD`, `E/Enter` 기준으로 수정했다.
- 방향 버튼으로 보내던 focus는 맵 복귀, 정전 종료, 구출 복귀, 개인실 복도 및 기록 보관소 입장 시 focus 가능한 Canvas로 이동한다.
- 방향키/WASD와 E/Enter, Canvas 클릭, 가족 선택·놓아주기·다음·재시도·복귀 버튼은 유지했다.
- Terra 리뷰에서 발견한 기록 보관소 문·기록 근접 안내 누락을 live region용으로 복원했고, 기록실 입장 시 Canvas focus를 추가했다.
- 이벤트 테스트는 KeyW press/release, KeyE 상호작용, Canvas 대사 클릭, 기록실 KeyE 입장·focus와 문·기록 근접 안내를 검증한다. 소스 계약 테스트는 제거된 DOM/CSS 식별자가 없고 키보드 매핑이 남아 있음을 보호한다.
- 최종 검사 결과: `npm run typecheck`, `npm run test`(263/263), `npm run build`, `git diff --check` 모두 통과했다. 동일 Terra 리뷰어의 재검증에서도 추가 finding이 없었다.
- 남은 위험: 브라우저 런타임에서 실제 레이아웃 여백과 키보드 포커스 표시를 육안 확인하지 못했다.

## Developer Final Check



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
