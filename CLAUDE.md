# ZZUGGURU Claude Code Instructions

## 이 문서와 AGENTS.md의 관계

- `AGENTS.md`는 Codex 세션이 자동으로 읽는 지속 지침이다. 이 `CLAUDE.md`는 Claude Code 세션용 동등한 지침이며, 같은 저장소 규칙(프로젝트 구조, 명령, `DESIGN.md`)을 공유하되 워크플로는 Claude Code의 도구(Agent, Task 등)에 맞게 조정한다.
- 두 파일의 내용이 서로 어긋나게 되면 임의로 한쪽에 맞춰 다른 쪽을 고치지 않는다. 사람에게 먼저 확인한다.
- `src/features/chapter3/`에서 작업할 때는 이 파일에 더해 `src/features/chapter3/CLAUDE.md`도 함께 적용된다.

## Project layout

- 사용자가 경험하는 기능은 `src/features/<feature-name>/`에 둔다.
- 한 기능의 client, shared 타입, 테스트, 재현 시나리오는 같은 디렉터리 안에 함께 둔다.
- 여러 기능이 쓰는 브라우저 실행 기반은 `src/platform/`에 둔다.
- 실제로 여러 기능이 공유하는 것이 확인된 뒤에만 코드를 `src/shared/`로 옮긴다.
- 빈 placeholder 디렉터리를 만들지 않는다. 최상위 `tests/`는 실제 기능 간 통합 테스트가 생겼을 때만 만든다.

## 현재 작업 초점: Chapter 3 보완 전용

- 지금 이 저장소에서 진행하는 세션들의 목표는 `src/features/chapter3/`의 게임 콘텐츠를 보완하는 것이다.
- 명시적인 요청 없이는 `chapter1`, `chapter2`, `welcome`, `platform`, 최상위 `shared`, 설정 파일을 수정하지 않는다.
- 이 초점은 브랜치 `feature/chapter3_extra`와 2026-08-10 대화에서 사용자가 직접 정한 것이다. 다른 챕터나 공통 코드 작업을 요청받으면 이 제약이 여전히 유효한지 먼저 확인한다.
- Chapter3 세부 규칙과 스토리 갭 백로그는 `src/features/chapter3/CLAUDE.md`를 따른다.

## Commands

작업을 완료로 선언하기 전에 다음을 실행한다.

```bash
npm run typecheck
npm run test
npm run build
git diff --check
```

실패한 테스트를 이유 없이 지우거나 약화하지 않는다. 현재 변경으로 생긴 실패와 원래 있던 실패를 구분해서 보고한다.

## Add-only 개발 원칙 (Chapter3 보완 작업의 핵심 규칙)

- 원칙: **기존 코드는 수정하지 않고 새로운 게임 요소를 추가하여 conflict를 최소화한다.** 이것이 현재 Chapter3 보완 작업 전체를 관통하는 가장 중요한 규칙이다.
- 허용 범위는 2026-08-10 대화에서 "신규 파일 + 최소 연결 훅 허용"으로 확정했다.
  - **허용**: 새 로직/렌더링/테스트를 담은 새 파일 추가. 기존 파일에는 다음과 같은 최소 연결 훅만 예외적으로 허용한다 — 기존 union 타입에 새 멤버 한 개 추가, 기존 switch/if 체인에 새 분기 한 개 추가, 새 모듈을 가져오는 import 한 줄, 새 함수를 호출하는 한 줄.
  - **금지**: 기존 함수 본문 재작성, 기존 상태 모양(shape) 변경, 기존 파일 리네임·재배치, 요청받지 않은 리팩터링.
- 어떤 변경이 "최소 연결 훅" 범위를 넘어서는지 판단하기 애매하면, 구현을 진행하지 말고 사용자에게 먼저 확인한다.
- 새 시각 자산은 `src/features/chapter3/assets/`에 추가하고, 기존 에셋 파일은 교체하지 않는다.

## Feature delivery workflow (Claude Code용 2-에이전트 하네스 재현)

저장소 원본 하네스 문서(`00_Two_Agent_Harness_Guaid.md`, `01_Dev_Process_Guaid.md`)는 Codex 전용이며 `gpt-5.6-terra`/`gpt-5.6-sol` 같은 Codex 모델을 지정한다. Claude Code 세션에서는 같은 핵심 원칙(구현자와 검증자 역할 분리, 순차 실행, 총 2 에이전트 유지, 검증자는 읽기 전용)을 Claude Code의 Agent 도구로 재현한다.

- 작업 창구 파일은 루트의 `CHAPTER3_BRIEF.md`다. `Developer Request` / `Agent Understanding` / `Agent Questions` / `Developer Decisions` / `Agent Result` / `Developer Final Check` / `Completed Work Log` 섹션을 작업마다 재사용한다.
- 개발자 소유 섹션(`Developer Request`, `Developer Decisions`, `Developer Final Check`)은 사용자의 명시적 요청 없이 수정하거나 삭제하지 않는다. 에이전트는 `Agent Understanding`, `Agent Questions`, `Agent Result`만 작성한다.
- 절차:
  1. `CHAPTER3_BRIEF.md`의 `Developer Request`를 읽고 `Agent Understanding`을 작성한다.
  2. 위 add-only 원칙을 지키며 구현한다.
  3. `npm run typecheck && npm run test && npm run build && git diff --check`를 실행한다.
  4. Agent 도구로 읽기 전용 리뷰 서브에이전트를 실행해 diff를 독립적으로 검토시킨다. 리뷰어에게는 구현 과정의 추론이 아니라 요구사항, diff, 테스트 결과를 전달한다.
  5. 리뷰어의 지적 중 타당한 항목만 최소 범위로 수정한다.
  6. 같은 리뷰 관점으로 재검증한다(새 서브에이전트를 늘리지 않는다).
  7. 결과와 남은 위험을 `Agent Result`에 기록하고 사용자 최종 확인을 기다린다.
- 리뷰 서브에이전트는 파일을 수정하지 않는다. 두 에이전트가 동시에 같은 파일을 쓰지 않는다.
- 사소한 오탈자, 한 줄 수정, 설명·조사성 작업에는 이 워크플로를 강제하지 않는다.

## Visual changes

- UI를 추가하거나 변경하기 전에 `DESIGN.md`를 읽고 따른다.
- `DESIGN.md`의 YAML 디자인 토큰을 값의 단일 원본으로 취급한다.
- `DESIGN.md`를 갱신하지 않고 새 시각 토큰이나 컴포넌트 변형을 도입하지 않는다.
- `DESIGN.md`를 변경한 뒤에는 `npm run design:lint`를 실행한다.

## User validation

- 판단하기 어렵거나, 실질적으로 모호하거나, 시각적으로 주관적이거나, 제품 방향을 바꿀 수 있는 결정을 구현하기 전에는 사용자에게 한 번 더 확인을 요청한다.
- 불확실한 지점, 추천 해석, 실용적 대안을 간결하게 제시한다.
- 이미 확립된 프로젝트 관습을 따르는, 일상적이고 되돌리기 쉬운 구현 세부사항까지 이 규칙으로 막지 않는다.

## Completion report

구현된 결과, 실행한 검사와 결과, 반영한 리뷰 지적, 남은 위험이나 검증하지 못한 동작을 보고한다.
