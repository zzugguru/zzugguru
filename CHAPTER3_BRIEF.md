# Chapter 3 보완 작업 브리프

이 파일은 Chapter3(`src/features/chapter3/`) 보완 작업의 요청·질문·결정·결과를 공유하는 단일 창구다. 작업마다 새 파일을 만들지 않고 이 파일을 재사용한다. 섹션 소유권 규칙은 루트 `CLAUDE.md`의 "Feature delivery workflow"를 따른다.

- 개발자 소유: `Developer Request`, `Developer Decisions`, `Developer Final Check`
- 에이전트 소유: `Agent Understanding`, `Agent Questions`, `Agent Result`

## Developer Request

상태: READY

```markdown
# 비트 1 · 장치 작동 전 누나의 경고 컷씬

## 목표
플레이어가 처음 기억 재구성 장치와 상호작용하기 전에, 외계 누나가 장치의 위험성을 경고하는 대화를 먼저 보게 한다.

## 범위
- 경고를 아직 안 본 상태에서 장치와 상호작용(E/Enter)하면, 퍼즐 대신 경고 대화 화면이 먼저 뜬다.
- 원작 61~80줄 대사를 활용한 2~3줄짜리 진행형 대화.
- 대화를 끝까지 넘기면 그 즉시 기존 퍼즐 진입 로직으로 연결된다.
- 새 상태는 새 shared 파일(`shared/wardenWarningLogic.ts`)로 관리하고, `MemoryReconstructionGame.ts`에는 새 `Screen` 값 1개 + 분기만 추가한다 (add-only 원칙).

## 제외 범위
- 경고에 대한 선택지 (원작에서도 영수는 경고를 듣고 그대로 진행 — 분기 없음)
- 새 배경 이미지 (기존 맵 배경 위에 대화 UI만 오버레이)
- 경고를 다시 보여주는 기능 (예: 메뉴에서 재확인)
- 새로고침/재방문 간 "경고를 봤다" 상태의 영구 저장 — 아래 Developer Decisions 참고

## 완료 조건
- 최초 장치 접근 시 퍼즐이 아니라 경고 대화가 먼저 뜬다.
- 대화를 끝까지 진행하면 기존 퍼즐 진입으로 자연스럽게 이어진다.
- 경고를 한 번 본 뒤에는 같은 세션 내에서 장치 재상호작용(실패 후 재시도 등) 시 다시 뜨지 않는다.
- 키보드(Enter/E)와 클릭 양쪽으로 진행 가능 (기존 접근성 패턴 유지).
- live region 안내 문구가 경고 화면에서도 갱신된다.
- `npm run typecheck && npm run test && npm run build && git diff --check` 통과.
- 기존 7개 화면(map/playing/awakening/result/letting-go/epilogue/기타)의 동작이 회귀하지 않는다.
```

## Agent Understanding

- 최초로 장치와 상호작용하는 순간(맵 화면, `canActivateDevice`가 참인 시점)을 가로채, 아직 경고를 보지 않았다면 퍼즐 대신 경고 대화 화면을 먼저 보여준다.
- 경고 상태는 `shared/wardenWarningLogic.ts`에 독립 상태 기계로 만든다 (`epilogueLogic.ts`의 선형 phase 진행 패턴을 참고). 다른 shared 모듈을 수정하지 않는다.
- `MemoryReconstructionGame.ts`에는 새 `Screen` 값 `'warning'`과 그에 대응하는 분기만 추가한다 — `interact()`의 장치-활성화 분기 앞에 조건부 guard 하나, `onKeyDown`/`onCanvasClick`에 진행 처리 분기 하나씩, `render()`에 `drawWarning()` 호출 분기 하나, `syncControls()`에 문구/버튼 노출 조건 확장. 기존 `epilogueNext` 버튼(범용 "다음" 버튼)을 재사용해 새 DOM 요소를 추가하지 않는다.
- 경고 완료 후에는 자동으로 기존 `transitionFlow({ type: 'interact', ... })` 경로를 호출해 퍼즐 진입 로직을 그대로 재사용한다.
- 새로고침 시 전체 초기화라는 기존 동작을 그대로 따르므로 영구 저장 로직은 만들지 않는다.

## Agent Questions

_(판단이 필요한 질문을 에이전트가 여기에 기록한다.)_

## Developer Decisions

- 2026-08-10: 새로고침/챕터 재진입 시 진행 상태(퍼즐, 수집, letting-go, 에필로그, 그리고 비트1의 "경고를 봤다" 플래그 포함) 전부를 초기화하는 기존 동작을 유지한다. 영구 저장(localStorage 등)은 지금 도입하지 않고, 필요해지면 게임 전체에 대한 별도 저장 기능으로 나중에 설계한다. 비트1의 경고 상태도 이 규칙을 따라 세션(인스턴스) 범위로만 관리한다.
- 2026-08-10: Chapter3 보완의 대상 스토리 비트 4개를 모두 승인함 — (1) 장치 작동 전 누나의 경고 컷씬, (2) 우주선 정전·기억세계 변모 연출, (3) 외계 가족 구출 서브시퀀스, (4) 마지막 저녁식탁 환상 인식 장면. 세부 착수 순서는 미정이며, 다음 `Developer Request`에서 지정한다. 상세는 `src/features/chapter3/CLAUDE.md`의 "스토리 갭 백로그" 참고.
- 2026-08-10: "기존 코드 수정 없이 추가" 규칙은 "신규 파일 + 최소 연결 훅 허용" 수준으로 확정. 상세 정의는 루트 `CLAUDE.md`의 "Add-only 개발 원칙" 참고.
- 2026-08-10: Chapter3 보완 작업은 이 파일을 Codex `BRIEF.md`에 준하는 단일 창구로 사용하기로 결정.

## Agent Result

**구현 목표**: 비트 1 · 장치 작동 전 누나의 경고 컷씬 (완료 조건은 위 Developer Request 참고)

**변경 파일**
- 신규: `src/features/chapter3/shared/wardenWarningLogic.ts`, `wardenWarningLogic.test.ts`
- 수정(최소 연결 훅만): `src/features/chapter3/client/MemoryReconstructionGame.ts` — `Screen`에 `'warning'` 추가, `warning` 필드, `interact()`/`onKeyDown`/`onCanvasClick`/`render()`에 새 분기, 신규 `drawWarning()`, `syncControls()`의 `epilogueNext.hidden`·live region 문구 확장, `epilogueNext` 클릭 핸들러를 화면별 조건부 위임으로 변경

**주요 설계 결정**
- 경고 완료 시 `screen = 'map'`으로 되돌린 뒤 `this.interact()`를 재귀 호출해, 기존 `transitionFlow` 퍼즐 진입 로직을 그대로 재사용(중복 구현 없음).
- 새 DOM 요소를 추가하지 않고 기존 `epilogueNext`("다음" 버튼)를 경고 화면에서도 재사용.
- "경고를 봤다" 상태는 인스턴스 필드로만 유지 — 새로고침 시 초기화되는 기존 동작과 동일(영구 저장 없음, Developer Decisions 참고).

**실행한 검사와 결과**
- `npm run typecheck` 통과
- `npm run test` — 150/151 통과. 실패 1건(`mapLogic.test.ts` "uses room-specific furniture collisions after reconstruction")은 리뷰 서브에이전트가 `git stash` 후 클린 HEAD(`8c39b7c`)에서도 동일하게 재현됨을 확인한 **기존 실패**로, 이번 diff와 무관.
- `npm run build`, `git diff --check` 통과

**리뷰 서브에이전트 결과**: 읽기 전용 Explore 서브에이전트가 diff·상태 전이 경로·add-only 준수 여부를 독립 검토. 발견 사항 없음, **승인**.

**남은 위험 / 확인하지 못한 영역**
- `MemoryReconstructionGame` 클래스 자체의 전용 통합 테스트는 기존에도 없던 패턴이라 이번에도 추가하지 않음(shared 로직만 단위 테스트).

---

**2차 반영: 연출 방식 재작업 (2026-08-10)**

개발자 피드백 — 전체 암전 패널 대신 "대화창 같은 새로운 프레임" 또는 "대화 후 씬 전환" 방식을 검토해달라는 요청. 두 방향을 SVG 목업으로 비교 제시한 뒤 "대화창 오버레이 + 페이드 전환"으로 결정.

- **변경 파일**: `shared/wardenWarningLogic.ts`(`WARNING_LINES`를 문자열 배열 → `{speaker, text}` 객체 배열로 변경), `client/MemoryReconstructionGame.ts`(`drawWarning()` 재작성 — 연구 구역 배경·플레이어를 유지한 채 하단 대화창 오버레이, `warningFadeStartedAt` 필드와 420ms 페이드 후 자동 전환 로직 추가), `DESIGN.md`(`dialogue-overlay` 컴포넌트 신규 추가, 기존 `corridor`/`archive` 에필로그 패턴과 동일 계열).
- **검사**: typecheck/test(기존 무관 실패 1건 동일)/build/design:lint/git diff --check 전부 통과.
- **리뷰**: 2차 독립 리뷰 승인 — 페이드 타이머가 정확히 1회만 트리거되는지, 연타 시 재설정되지 않는지, `epilogueNext.hidden` 불리언 조건이 5가지 케이스 모두에서 올바른지 확인.
- **브라우저 실동작 확인**: dev 서버에서 맵 진입 → 장치 접근 → 대화창 오버레이(배경·플레이어 그대로 보이며 하단에 화자+대사) → 3줄 진행 → 자동 페이드 → 퍼즐 전환까지 직접 플레이로 확인 완료.
- **확인하지 못한 영역**: 페이드의 시각적 부드러움(프레임 단위 opacity 보간)은 코드상 보장되지만, 실제 60fps 환경에서의 체감은 사람이 최종 확인 필요.

---

**3차 반영: Chapter2 대화창 형식과 일치 (2026-08-10)**

개발자 요청 — Chapter3 대화창을 Chapter2의 대화창(`chapter2/shared/dialogueBox.ts`)과 동일한 출력 형식으로 맞춰달라는 요청.

- **범위 판단**: Chapter2 코드를 import하지 않고, 동일한 시각 사양으로 `src/features/chapter3/shared/dialogueBox.ts`를 새로 복제했다. `src/shared/`로 승격해 두 챕터가 코드를 공유하는 방안도 검토했으나, 현재 "chapter3만 수정" 범위 제약상 Chapter2 파일을 건드려야 하는 승격은 하지 않기로 판단(향후 필요 시 별도 결정 가능).
- **변경 파일**: 신규 `shared/dialogueBox.ts`(+ 테스트), `client/MemoryReconstructionGame.ts`의 `drawWarning()`이 자체 박스 렌더링 코드 대신 `renderDialogueBox()` 호출로 교체(테두리 제거, 위치/폭/모서리/색상/굵기를 Chapter2와 동일하게), `DESIGN.md`의 `dialogue-overlay` 설명 갱신.
- **검사**: typecheck/test(신규 3건 포함 153/154, 무관 기존 실패 1건 동일)/build/design:lint/git diff --check 전부 통과.
- **브라우저 확인**: 대화창 위치·모서리·색상·힌트 문구가 목표 형식과 일치함을 직접 확인.

## Developer Final Check

_(개발자가 diff와 실제 동작을 확인한 뒤 여기에 기록한다.)_

## Completed Work Log

- 2026-08-10: 비트 1(장치 작동 전 누나의 경고 컷씬) 구현 완료. typecheck/test/build/git diff --check 통과, 리뷰 서브에이전트 승인.
- 2026-08-10: 비트 1 연출을 전체 암전 텍스트 방식에서 대화창 오버레이 + 페이드 전환 방식으로 재작업. 2차 리뷰 승인, 브라우저 실동작 확인 완료.
- 2026-08-10: 비트 1 대화창을 Chapter2 대화창(`dialogueBox.ts`)과 동일한 시각 형식으로 재구현(신규 `shared/dialogueBox.ts` 복제). 검사·브라우저 확인 완료. 개발자 최종 확인 대기 중.
