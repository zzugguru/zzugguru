# ZZUGGURU 개발 프로세스 가이드

이 문서는 Codex 하네스를 처음 사용하는 개발자가 기능 하나를 안전하게 개발하는 전체 흐름을 설명한다. 읽는 순서대로 따라 하면 작업 준비부터 구현, 독립 검증, 하네스 개선, 개발자 최종 확인까지 진행할 수 있다.

이 프로젝트에서 **하네스**는 게임 테스트 실행기를 뜻하지 않는다. 메인 에이전트와 검증 서브에이전트가 정해진 규칙에 따라 기능을 구현하고 검증하도록 만드는 Codex 작업 체계를 뜻한다.

```text
개발자가 기능과 완료 조건을 결정
             ↓
메인 에이전트가 기능을 구현하고 테스트
             ↓
검증 서브에이전트가 읽기 전용으로 독립 검토
             ↓
메인 에이전트가 유효한 발견 사항을 수정
             ↓
같은 검증 에이전트가 수정 결과를 재검증
             ↓
개발자가 diff와 실제 게임 동작을 최종 확인
```

두 에이전트는 동시에 코드를 작성하지 않는다. 구현이 끝난 뒤 검증을 시작하고, 검증이 끝난 뒤 메인 에이전트가 수정한다.

---

## 1. 하네스에 사용하는 파일과 역할

```text
.
├── AGENTS.md
├── BRIEF.md
├── DESIGN.md
├── .agents/
│   └── skills/
│       └── two-agent-harness/
│           ├── SKILL.md
│           └── agents/
│               └── openai.yaml
├── .github/
│   └── workflows/
│       ├── pull-request-checks.yml
│       └── deploy-pages.yml
├── 00_Two_Agent_Harness_Guaid.md
├── 01_Dev_Process_Guaid.md
├── 02_Release_for_GitPage.md
└── src/
    └── features/
```

### `AGENTS.md`: 저장소 공통 작업 규칙

Codex가 저장소에서 작업을 시작할 때 읽는 지속 지침이다.

현재 다음 내용을 관리한다.

- 기능 중심 디렉터리 구조
- 타입 검사, 테스트, 빌드 명령
- 기능 개발 시 `$two-agent-harness`를 사용한다는 규칙
- 불필요한 공통화와 범위 밖 리팩터링 금지
- 시각 변경 시 `DESIGN.md`를 따라야 한다는 규칙
- 판단하기 어려운 요구사항은 개발자에게 다시 확인한다는 규칙

특정 기능 하나의 상세 요구사항은 `AGENTS.md`에 넣지 않는다. 모든 작업에서 반복되는 규칙만 기록한다.

### `BRIEF.md`: 개발자와 에이전트의 작업 창구

현재 작업의 목표, 범위, 완료 조건, 질문, 결정과 결과를 명시적으로 남기는 단일 파일이다. 작업마다 새 파일을 만들지 않고 같은 `BRIEF.md`를 재사용한다.

- 개발자는 `Developer Request`, `Developer Decisions`, `Developer Final Check`를 작성한다.
- 메인 에이전트는 `Agent Understanding`, `Agent Questions`, `Agent Result`만 작성한다.
- 에이전트는 개발자 영역을 임의로 수정하거나 삭제하지 않는다.
- 완료된 상세 내용은 Git 이력에 남고, `Completed Work Log`에는 한 줄 요약을 남긴다.
- 프롬프트와 `BRIEF.md`가 충돌하면 에이전트가 개발자에게 확인한다.

### `.agents/skills/two-agent-harness/SKILL.md`: 2에이전트 실행 절차

기능 개발 때만 불러오는 재사용 워크플로다.

다음 순서를 정의한다.

1. 기능 계약과 완료 조건 확인
2. 기존 코드와 Git 상태 확인
3. 메인 에이전트의 수직 기능 구현
4. 타입 검사, 테스트, 빌드 실행
5. 검증 서브에이전트 한 개 실행
6. 메인 에이전트의 수정
7. 같은 검증 에이전트의 재검증
8. 결과와 남은 위험 보고

메인 에이전트와 검증 서브에이전트를 합쳐 총 두 에이전트다. 검증자를 두 명 만들면 3에이전트 구조가 되므로 현재 하네스와 다르다.

### `agents/openai.yaml`: 스킬 표시 정보

Codex UI가 사용하는 스킬 이름, 짧은 설명, 기본 호출 프롬프트를 담는다. 개발 절차를 이 파일에 길게 적지 않는다. 절차는 `SKILL.md`에서 관리한다.

### `DESIGN.md`: 디자인 시스템의 단일 원본

화면에 보이는 UI를 수정할 때 참고한다.

- YAML front matter: 정확한 색상, 타이포그래피, 간격, radius와 컴포넌트 토큰
- Markdown 본문: 디자인 의도와 적용 원칙

시각적 기능을 개발할 때는 메인 에이전트에게 `DESIGN.md`를 읽고 `npm run design:lint`를 실행하도록 한다.

### `00_Two_Agent_Harness_Guaid.md`: 하네스 상세 설명

두 에이전트의 책임, 검증 보고 형식, worktree 사용법과 실패 대응을 자세히 설명하는 참고 문서다. Codex가 모든 작업에서 자동으로 읽는 파일은 아니다.

### `01_Dev_Process_Guaid.md`: 개발자용 순서 안내

지금 읽고 있는 문서다. 새로운 팀원이 실제 기능 개발을 시작할 때 따라 하는 운영 안내서다. 에이전트의 실행 규칙은 `SKILL.md`가 기준이며, 이 문서는 사람이 이해하기 위한 설명이다.

### `.github/workflows/`: Pull Request 검증과 자동 배포

- `pull-request-checks.yml`: `main` 대상 Pull Request에서 타입 검사, 테스트, 디자인 검사와 빌드를 실행한다. 운영 사이트는 배포하지 않는다.
- `deploy-pages.yml`: 변경이 `main`에 병합된 뒤 같은 검증을 다시 실행하고, 성공한 `dist/`만 GitHub Pages에 배포한다.

개발자는 로컬에서 먼저 확인하고, GitHub의 Pull Request 검사까지 통과한 변경만 병합한다. 최초 Pages 활성화와 상세한 배포 확인 방법은 `02_Release_for_GitPage.md`에서 설명한다.

### `src/features/<기능명>/`: 실제 기능 코드

하나의 기능에 필요한 클라이언트, 서버, 공유 타입과 테스트를 가까이 둔다.

```text
src/features/inventory/
├── client/
├── server/
├── shared/
└── tests/
    ├── fixtures/
    ├── scenarios/
    └── inventory.test.ts
```

처음부터 빈 폴더를 전부 만들지 않는다. 실제 파일이 생길 때 필요한 폴더만 만든다.

---

## 2. 개발을 시작하기 전에 준비할 것

### 2.1 새 Codex 대화 또는 세션 시작

`AGENTS.md`와 저장소 스킬은 새 Codex 세션에서 탐색된다. 하네스 파일을 처음 받았거나 변경한 직후라면 이 저장소에서 새 대화를 시작한다.

처음에는 다음 요청으로 적용 상태를 확인할 수 있다.

```text
현재 저장소에서 읽은 AGENTS.md 규칙과 사용할 수 있는
$two-agent-harness 스킬을 짧게 요약해줘. 파일은 수정하지 마.
```

응답에 기능 중심 구조, 검증 명령, 메인 에이전트와 검증 에이전트의 순차 작업이 포함되는지 확인한다.

### 2.2 기능 브랜치 준비

작업 하나당 하나의 짧은 브랜치를 사용한다.

```bash
git switch -c feature/inventory-use-item
git status
```

다른 개발자가 같은 파일을 동시에 수정할 가능성이 크다면 Codex 앱의 별도 worktree에서 작업한다. 같은 Git 브랜치를 여러 worktree에서 동시에 checkout하지 않는다.

### 2.3 작업을 작은 사용자 결과로 나누기

아래 작업은 너무 크다.

```text
인벤토리를 구현한다.
```

다음처럼 각각 실행하고 검증할 수 있는 단위로 나눈다.

```text
1. 보유 아이템 목록을 조회한다.
2. 회복 아이템 하나를 사용한다.
3. 아이템을 폐기한다.
```

이 가이드에서는 `회복 아이템 하나를 사용한다`를 하나의 작업으로 진행한다.

### 2.4 `BRIEF.md`에 기능 계약 작성

프롬프트에만 요구사항을 적지 않고 루트 `BRIEF.md`의 `Developer Request`를 작성한다. 예시는 다음과 같다.

```markdown
## Status

`READY`

## Developer Request

### Task

회복 아이템 사용

### Goal

플레이어가 보유한 회복 아이템을 사용해 체력을 회복한다.

### Context

- 관련 기능: `src/features/inventory/`

### Included Scope

- 인벤토리의 사용 버튼
- 클라이언트 사용 요청
- 서버의 아이템 소유권 및 사용 가능 여부 검증
- 성공 후 아이템 수량과 체력 갱신

### Excluded Scope

- 아이템 구매와 폐기
- 장비 아이템
- 사용 애니메이션

### Constraints

- 판단하기 어렵거나 제품 방향에 영향을 주는 부분은 구현 전에 확인한다.

### Done When

- [ ] 보유한 회복 아이템을 사용하면 수량이 1 감소한다.
- [ ] 체력이 최대치를 넘지 않는다.
- [ ] 보유하지 않은 아이템은 서버에서 거부한다.
- [ ] 빠르게 두 번 요청해도 아이템이 중복 차감되지 않는다.
- [ ] 관련 테스트와 프로젝트 검증 명령이 통과한다.
```

개발자는 요청 영역을 작성한 뒤 상태를 `READY`로 바꾼다. 이 내용은 현재 작업이 끝날 때까지 삭제하지 않는다.

---

## 3. 메인 에이전트에게 보내는 시작 프롬프트

기능 계약은 이미 `BRIEF.md`에 있으므로 프롬프트에는 하네스 실행 요청만 전달한다.

```text
$two-agent-harness를 사용해서 `BRIEF.md`의 현재 작업을 구현해줘.

구현 전에 Developer Request를 읽고 Agent Understanding에 이해한 내용을 기록해.
요청과 프롬프트가 충돌하거나 판단하기 어려운 부분은 구현하지 말고
Agent Questions에 기록한 뒤 나에게 확인해줘.
```

프롬프트가 실수로 지워지거나 대화가 바뀌어도 명시적인 요구사항은 `BRIEF.md`와 Git 이력에 남는다. 작업 중 요구사항이 바뀌면 개발자가 `Developer Decisions`를 수정한 뒤 다음처럼 알린다.

```text
BRIEF.md의 Developer Decisions를 업데이트했어. 변경된 결정을 다시 읽고 계속 진행해줘.
```

---

## 4. 프롬프트를 보낸 뒤 진행되는 과정

### 4.1 메인 에이전트가 기준을 확인한다

메인 에이전트는 가장 먼저 `BRIEF.md`를 읽고, 이어서 `AGENTS.md`, `SKILL.md`, 관련 기능 코드와 테스트를 읽는다. UI 변경이 있으면 `DESIGN.md`도 읽는다. 작업을 시작하기 전에 `Agent Understanding`에 이해한 목표와 범위를 기록한다.

요구사항에 여러 해석이 가능하고 선택에 따라 결과가 크게 달라지면 에이전트가 개발자에게 다시 확인한다. 이때 권장안과 대안을 비교한 뒤 결정한다.

### 4.2 메인 에이전트가 기능을 수직으로 구현한다

한 명의 메인 에이전트가 필요한 범위를 처음부터 끝까지 담당한다.

```text
클라이언트 UI와 상태
        ↓
공유 요청·응답 타입
        ↓
서버 검증과 상태 변경
        ↓
테스트 데이터와 자동 테스트
```

클라이언트 작업과 서버 작업을 별도 에이전트에 동시에 맡기지 않는다. 현재 하네스의 두 번째 에이전트는 구현자가 아니라 독립 검증자다.

### 4.3 메인 에이전트가 먼저 자체 검증한다

검증 에이전트를 부르기 전에 메인 에이전트가 다음 명령을 실행한다.

```bash
npm run typecheck
npm run test
npm run build
git diff --check
```

`DESIGN.md`를 수정했다면 다음도 실행한다.

```bash
npm run design:lint
```

기존 실패가 있다면 숨기거나 테스트를 삭제하지 않고, 이번 작업으로 생긴 실패인지 구분해서 보고한다.

### 4.4 검증 서브에이전트가 독립 검토한다

구현과 자체 검사가 끝난 뒤 메인 에이전트가 검증 서브에이전트 한 개를 실행한다. 검증자는 파일을 수정하지 않는다.

검증자는 다음을 확인한다.

- 완료 조건을 실제로 충족하는가?
- 클라이언트와 서버의 요청·응답 계약이 일치하는가?
- 실패와 경계 조건이 누락되지 않았는가?
- 테스트가 실제로 중요한 오류를 잡을 수 있는가?
- 범위 밖 변경과 기존 기능 회귀 위험이 있는가?
- 보안 또는 데이터 무결성 문제가 있는가?

Codex 앱이나 IDE에서는 서브에이전트 활동 패널에서 상태를 확인할 수 있다. Codex CLI에서는 `/agent`로 에이전트 스레드를 확인하고 전환할 수 있다.

### 4.5 메인 에이전트가 발견 사항을 분류하고 수정한다

검증자의 제안을 모두 자동으로 적용하지 않는다.

| 분류 | 예시 | 처리 |
|---|---|---|
| 필수 수정 | 요구사항 위반, 데이터 중복 차감 | 즉시 수정 |
| 이번 작업에서 수정 | 핵심 경계 테스트 누락 | 범위 안에서 수정 |
| 후속 작업 | 성능 개선, 공통화 후보 | 별도 작업으로 기록 |
| 기각 | 스타일 취향, 근거 없는 추측 | 이유를 남기고 미적용 |

유효한 발견 사항은 메인 에이전트가 수정하고 관련 검사를 다시 실행한다.

### 4.6 같은 검증자가 재검증한다

메인 에이전트는 새 검증자를 만들지 않고 최초 검증자에게 수정 결과를 다시 확인하도록 요청한다.

```text
이전에 보고한 발견 사항을 수정했다.
각 항목이 해결됐는지와 수정으로 새 회귀가 생기지 않았는지 다시 검토해줘.
파일은 수정하지 말고 결과만 보고해줘.
```

재검증이 끝날 때까지 기능 완료로 판단하지 않는다.

### 4.7 메인 에이전트가 결과를 보고한다

최종 보고에는 다음 내용이 있어야 한다.

- 구현된 사용자 동작
- 변경된 주요 파일
- 실행한 검사와 통과 여부
- 검증자가 발견한 문제와 수정 결과
- 의도적으로 적용하지 않은 제안과 이유
- 사람이 확인해야 할 동작과 남은 위험

---

## 5. 개발자가 반드시 확인할 것

에이전트의 완료 보고만 보고 바로 병합하지 않는다.

### 5.1 변경 범위 확인

```bash
git status
git diff --check
git diff
```

요청하지 않은 파일, 비밀정보, 범위 밖 리팩터링이 포함되지 않았는지 확인한다.

### 5.2 자동 검사 재확인

```bash
npm run typecheck
npm run test
npm run build
```

UI 또는 `DESIGN.md`가 변경됐다면 다음도 확인한다.

```bash
npm run design:lint
```

### 5.3 실제 게임에서 확인

```bash
npm run dev
```

브라우저에서 정상 흐름뿐 아니라 실패와 경계 상황도 직접 확인한다. 특히 입력감, 레이아웃, 애니메이션, 시각적 위계처럼 자동 테스트만으로 판단하기 어려운 부분은 개발자가 확인한다.

확인이 끝나면 개발자가 `BRIEF.md`의 `Developer Final Check`에 결과를 기록하고 상태를 `ACCEPTED`로 바꾼다. 에이전트가 대신 승인 상태를 작성하게 하지 않는다.

### 5.4 Pull Request 자동 검사 확인

기능 브랜치를 push하고 `main`을 대상으로 Pull Request를 만든다. GitHub의 `Pull Request Checks / Verify`는 다음 검사를 자동으로 다시 실행한다.

```text
타입 검사 → 테스트 → 디자인 검사 → 빌드
```

이 단계에서는 GitHub Pages에 배포하지 않는다. 검사 실패 원인을 기능 브랜치에서 수정하고 다시 push한다. 저장소의 `main` Ruleset에서 Pull Request와 `Pull Request Checks / Verify` 통과를 필수로 지정하고 직접 push를 막아야 한다.

### 5.5 `main` 병합과 자동 배포 확인

Pull Request 검사와 사람의 리뷰가 끝나면 `main`에 병합한다. 보호된 `main`에는 직접 push하지 않는다. 병합으로 `main` push가 발생하면 `Deploy to GitHub Pages`가 검증과 빌드를 다시 수행하고, 모두 성공한 경우에만 운영 사이트를 배포한다.

```text
로컬 확인
    ↓
Pull Request 검사 통과
    ↓
개발자 리뷰와 main 병합
    ↓
main 재검증·빌드
    ↓
GitHub Pages 자동 배포
```

Actions의 성공 여부와 실제 배포 사이트의 핵심 게임 흐름을 확인해야 작업이 끝난다. GitHub Pages의 최초 설정, 배포 주소와 문제 해결은 `02_Release_for_GitPage.md`를 따른다.

### 5.6 추가 리뷰 사용

필요하면 Codex의 `/review`를 사용해 현재 변경, 특정 커밋 또는 기준 브랜치 대비 diff를 추가로 검토할 수 있다. 이것은 개발자의 최종 판단을 대신하지 않는다.

---

## 6. 작업 단위로 하네스를 업데이트하는 방법

하네스는 처음 한 번 만들고 끝나는 설정이 아니다. 실제 작업에서 반복되는 문제를 발견할 때 조금씩 고친다. 하지만 기능 하나에서만 발생한 문제를 모두 공통 하네스에 추가하면 컨텍스트가 불필요하게 커진다.

문제가 발생했을 때 먼저 다음 표로 수정 위치를 판단한다.

| 발견한 내용 | 수정할 위치 |
|---|---|
| 모든 기능에서 지켜야 할 저장소 규칙 | `AGENTS.md` |
| 구현·검증 순서나 검증자의 행동 규칙 | `SKILL.md` |
| 색상, 간격, 컴포넌트의 시각 규칙 | `DESIGN.md` |
| 특정 기능에만 해당하는 테스트와 경계 조건 | 해당 기능의 `tests/` |
| 현재 작업의 목표, 범위, 결정과 결과 | `BRIEF.md` |
| 새로운 개발자를 위한 설명 | 이 가이드 문서 |

### 예시 1: 작업이 끝난 뒤 `BRIEF.md` 재사용

개발자가 기능을 확인하고 상태를 `ACCEPTED`로 바꾼 뒤, 다음 작업을 시작하기 전에 완료 기록을 남긴다.

```markdown
## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
| 2026-08-06 | 회복 아이템 사용 | feature/inventory-use-item | Accepted |
```

그다음 현재 작업 영역을 새 요청으로 교체하고 상태를 `READY`로 바꾼다. 이전 상세 요청은 Git 이력에서 확인할 수 있다. 하나의 파일을 계속 사용하되, 작업 도중에는 기존 요청을 지우지 않는다.

### 예시 2: 특정 기능에만 해당하는 문제

아이템 사용 기능에서 중복 요청 문제가 발견됐다고 가정한다.

```text
문제: 사용 버튼을 빠르게 두 번 누르면 아이템이 두 번 차감된다.
```

이 문제는 우선 인벤토리 기능의 테스트와 구현을 수정한다.

```text
src/features/inventory/
└── tests/
    └── use-item.test.ts
```

이 단계에서는 `AGENTS.md`나 `SKILL.md`를 수정하지 않는다. 다른 기능에도 동일한 문제가 반복되는지 아직 알 수 없기 때문이다.

### 예시 3: 여러 기능에서 같은 누락이 반복됨

아이템 사용, 보상 수령, 상점 구매에서 모두 중복 요청 검증이 누락됐다고 가정한다. 이제 문제는 특정 기능이 아니라 서버 상태 변경 기능의 반복 위험이다.

이 경우 `SKILL.md`의 검증자 체크리스트에 다음과 같은 항목을 추가할 수 있다.

```markdown
- For state-changing requests, check retry and duplicate-submission behavior.
```

수정 후 공식 스킬 검증기를 실행하고 새 Codex 세션에서 실제 기능 작업으로 확인한다. 한 번 발생한 실수만으로 공통 규칙을 늘리지 않고, 반복되거나 위험이 큰 문제만 반영한다.

### 예시 4: 프로젝트 검증 명령이 추가됨

팀이 E2E 테스트 명령 `npm run test:e2e`를 도입했다고 가정한다.

다음 두 곳을 수정한다.

1. `AGENTS.md`의 공통 완료 명령에 추가
2. `SKILL.md`의 구현 후 검증 단계에 추가

```markdown
npm run typecheck
npm run test
npm run test:e2e
npm run build
git diff --check
```

사람용 안내가 달라졌으므로 이 문서의 명령 예제도 함께 갱신한다.

### 예시 5: 디자인 규칙이 확정됨

팀이 모든 주요 버튼의 radius를 `8px`로 통일했다고 가정한다. 이 값은 `AGENTS.md`나 프롬프트에 반복하지 않고 `DESIGN.md`의 토큰과 컴포넌트 규칙을 수정한다.

```yaml
rounded:
  md: 8px

components:
  button-primary:
    rounded: "{rounded.md}"
```

그다음 아래 명령으로 규격과 토큰 참조를 확인한다.

```bash
npm run design:lint
```

### 예시 6: 하네스가 같은 실수를 두 번 반복함

메인 에이전트가 두 작업에서 연속으로 범위 밖 리팩터링을 했다고 가정한다. 이때는 `AGENTS.md`의 기존 규칙이 충분히 구체적인지 확인하고, 실제 실패 형태와 안전한 행동을 짧게 보강한다.

```markdown
- Do not move code out of a feature during feature implementation unless two existing features already use it.
```

긴 회고나 사건 설명 전체를 `AGENTS.md`에 넣지 않는다. 에이전트가 다음 작업에서 바로 행동으로 옮길 수 있는 짧은 규칙만 남긴다.

### 하네스 변경 후 확인 순서

```text
1. 변경 이유가 한 기능만의 문제인지 공통 문제인지 판단한다.
2. AGENTS.md, SKILL.md, DESIGN.md 중 가장 좁은 위치를 선택한다.
3. 기존 규칙과 중복되는 문장을 제거한다.
4. 스킬을 수정했다면 스킬 구조 검증을 실행한다.
5. DESIGN.md를 수정했다면 npm run design:lint를 실행한다.
6. 새 Codex 세션에서 변경된 규칙이 탐색되는지 확인한다.
7. 다음 실제 작업에서 규칙이 문제를 줄였는지 회고한다.
```

하네스 규칙은 많을수록 좋은 것이 아니다. 자동으로 로드되는 `AGENTS.md`는 짧고 반복 가능한 규칙 위주로 유지하고, 상세한 순차 절차는 필요할 때만 로드되는 `SKILL.md`에 둔다.

---

## 7. 작업 완료 체크리스트

```text
[ ] 기능 목표, 포함 범위, 제외 범위가 명확하다.
[ ] BRIEF.md의 Developer Request를 작성하고 상태를 READY로 바꿨다.
[ ] $two-agent-harness를 사용해 작업을 시작했다.
[ ] 메인 에이전트가 클라이언트부터 서버와 테스트까지 구현했다.
[ ] 프로젝트 검증 명령이 통과했다.
[ ] 검증 서브에이전트가 읽기 전용 검토를 수행했다.
[ ] 메인 에이전트가 유효한 발견 사항을 수정했다.
[ ] 같은 검증자가 수정 결과를 재검증했다.
[ ] 개발자가 diff를 직접 확인했다.
[ ] 개발자가 브라우저에서 실제 동작을 확인했다.
[ ] 개발자가 Developer Final Check를 작성하고 상태를 ACCEPTED로 바꿨다.
[ ] Pull Request Checks / Verify가 통과했다.
[ ] main 병합 후 Deploy to GitHub Pages가 성공했다.
[ ] 배포된 사이트에서 핵심 게임 흐름을 확인했다.
[ ] 반복 가능한 교훈만 올바른 하네스 파일에 반영했다.
```

---

## 8. 공식 참고 자료

- [Codex Best practices](https://learn.chatgpt.com/guides/best-practices)
- [Codex Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex Skills](https://developers.openai.com/plugins/concepts/skills)
- [Codex Code review](https://learn.chatgpt.com/docs/code-review)
- [Codex Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)

---

## 9. 마지막 원칙

프로젝트가 커지면 기능 수, 팀 규모, 배포 방식과 위험 수준도 달라진다. 그에 따라 현재의 2에이전트 하네스가 역할별 스킬, 추가 검증 단계, 자동화 또는 별도 worktree 중심 구조로 바뀔 수 있다. 지금의 구조를 영구적인 정답으로 취급하지 말고 실제 개발 결과를 보면서 작게 수정한다.

하네스가 구현과 검증을 자동화하더라도 최종 책임은 개발자에게 있다. 모든 하네스 작업의 끝에서 개발자가 변경 diff, 테스트 결과, 실제 게임 동작과 남은 위험을 직접 확인하고, 잘못된 판단이나 부족한 구현은 반드시 수정한 뒤 병합한다.
