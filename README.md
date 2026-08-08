# ZZUGGURU Web Game

## 명령 실행 시간 측정

새 토큰 사용량 패키지의 `run` 명령으로 typecheck, test, build 실행 시간을 자동 기록합니다.

```powershell
npm run measure:typecheck
npm run measure:test
npm run measure:build
```

기록은 `output/token-usage.jsonl`에 저장되며 다음 명령으로 확인합니다.

```powershell
npm run token-usage-summary
npm run token-usage-summary:json
npm run token-usage-status
```

측정 대상 명령이 실패해도 걸린 시간은 기록되고 동일한 실패 종료 코드가 반환됩니다. 이 기능은 로컬 명령의 실행 시간을 자동 측정하며, Codex 계정의 남은 사용량이나 실제 토큰 수를 자동으로 읽지는 않습니다. 토큰 옵션을 직접 제공하지 않은 기록의 토큰 값은 `null`입니다.

3명이 함께 웹 게임을 만들기 위한 기본 프로젝트입니다. 처음에는 구조를 단순하게 유지하고, 게임이 커질 때 폴더를 추가하는 방식을 권장합니다.

## 2에이전트 하네스

이 프로젝트에서 하네스는 메인 구현 에이전트와 읽기 전용 검증 에이전트가 기능을 순차적으로 개발·검증하는 Codex 운영 체계를 뜻합니다. 저장소 규칙은 `AGENTS.md`, 재사용 절차는 `.agents/skills/two-agent-harness/`에서 관리합니다.

게임 테스트 데이터나 재현 시나리오는 실제로 필요한 기능의 `tests/` 안에 만듭니다. 실행 코드가 없는 최상위 `harness/` 폴더는 사용하지 않습니다.

## 시작하기

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

터미널에 표시된 주소(기본값 `http://localhost:5173`)를 브라우저에서 엽니다.

```bash
npm run typecheck   # TypeScript 오류 검사
npm run test        # 단위 테스트 실행
npm run design:lint # DESIGN.md 구조와 접근성 검사
npm run build       # 배포용 파일 생성
npm run preview     # 빌드 결과를 로컬에서 확인
```

## 디렉터리 구조

```text
.
├── AGENTS.md                # Codex가 자동으로 읽는 저장소 작업 규칙
├── BRIEF.md                 # 현재 작업의 요청·질문·결과를 공유하는 단일 창구
├── DESIGN.md                # 디자인 토큰과 시각적 원칙의 단일 원본
├── .agents/
│   └── skills/
│       └── two-agent-harness/
│           ├── SKILL.md     # 구현 → 독립 검증 → 재검증 워크플로
│           └── agents/
│               └── openai.yaml
├── .github/
│   └── workflows/
│       ├── pull-request-checks.yml # PR 타입 검사·테스트·빌드
│       └── deploy-pages.yml        # main 검증 후 Pages 자동 배포
├── src/                     # 실제 배포되는 게임 코드
│   ├── features/            # 클라이언트부터 서버까지 기능별 코드
│   │   └── welcome/         # 첫 화면 예제 기능
│   │       └── client/
│   ├── platform/            # 여러 기능이 사용하는 실행 기반
│   │   └── client/          # 게임 루프, 입력, 라우팅
│   ├── shared/              # 여러 기능이 실제로 공유하는 작은 코드
│   ├── main.ts              # 애플리케이션 시작점
│   └── style.css            # 전역 스타일
├── docs/                    # 기획, 아키텍처, 회의 결정 기록
├── 00_Two_Agent_Harness_Guaid.md
├── 01_Dev_Process_Guaid.md
├── 02_Release_for_GitPage.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 3인 기능 단위 책임 개발

각자 기술 영역이 아니라 **사용자가 경험하는 기능 하나**를 처음부터 끝까지 책임집니다. 담당자는 필요한 클라이언트 화면, 서버 로직, 데이터 타입, 하네스 시나리오와 테스트를 한 기능 디렉터리 안에서 함께 개발합니다.

| 담당 예시 | 책임 범위 |
|---|---|
| 플레이어 대시 | 입력과 애니메이션, 서버 검증, 재사용 대기시간, 테스트 |
| 인벤토리 아이템 사용 | UI, 사용 요청 API, 서버 규칙, 데이터 갱신, 테스트 |
| 랭킹 조회 | 랭킹 화면, 조회 API, 집계 로직, 빈 상태와 오류 처리 |

기능 담당자는 고정하지 않고 작업마다 바꿀 수 있습니다. `platform/`, 최상위 `shared/`, 설정 파일처럼 모두에게 영향을 주는 부분은 수정 전에 팀에 알리고 반드시 다른 사람의 리뷰를 받습니다.

각 개발자는 기능 작업을 Codex에 맡길 때 저장소 공유 스킬 `$two-agent-harness`를 사용합니다. 이 스킬은 메인 구현 에이전트 한 개와 읽기 전용 검증 서브에이전트 한 개를 순차적으로 운영합니다. 자세한 사용법은 [`00_Two_Agent_Harness_Guaid.md`](./00_Two_Agent_Harness_Guaid.md)와 [`01_Dev_Process_Guaid.md`](./01_Dev_Process_Guaid.md)를 참고하세요.

`AGENTS.md`는 Codex 세션 시작 시 탐색되므로 하네스 설정을 처음 받은 뒤에는 새 Codex 대화나 세션을 시작하세요.

## 권장 작업 흐름

1. `BRIEF.md`의 `Developer Request`와 완료 조건을 작성합니다.
2. 작업 하나당 짧은 브랜치를 만듭니다: `feature/player-movement`, `fix/score-reset`.
3. `$two-agent-harness`를 호출해 `BRIEF.md`의 작업을 실행합니다.
4. 클라이언트와 서버를 포함한 기능을 작고 실행 가능한 세로 단위로 구현합니다.
5. 기능 디렉터리에 관련 테스트 또는 재현 시나리오를 추가합니다.
6. 로컬 타입 검사, 테스트, 디자인 검사와 빌드를 통과시킵니다.
7. 개발자가 diff와 실제 동작을 확인하고 `Developer Final Check`를 작성합니다.
8. Pull Request를 열고 GitHub의 `Pull Request Checks / Verify`가 통과했는지 확인합니다.
9. 최소 1명이 리뷰한 뒤 `main`에 병합합니다.
10. 병합 직후 `Deploy to GitHub Pages`가 검증·빌드·배포를 완료했는지 확인합니다.

## 로컬 확인과 자동 배포

기능 브랜치에서는 로컬 개발 서버와 배포 빌드를 모두 확인할 수 있습니다.

```bash
npm run dev
npm run typecheck
npm run test
npm run design:lint
npm run build
npm run preview
```

Pull Request에서는 `.github/workflows/pull-request-checks.yml`이 검사만 실행하며 운영 사이트를 변경하지 않습니다. Pull Request가 `main`에 병합되면 `.github/workflows/deploy-pages.yml`이 같은 검사를 다시 실행하고, 모두 성공했을 때 GitHub Pages에 자동 배포합니다. 이 흐름을 보장하려면 GitHub Ruleset에서 `main` 직접 push를 막고 Pull Request와 `Pull Request Checks / Verify` 통과를 필수로 설정해야 합니다.

최초 한 번은 GitHub 저장소에서 `main` 보호 Ruleset을 활성화하고, **Settings → Pages → Source**를 `GitHub Actions`로 선택해야 합니다. 설정과 오류 대응은 [`02_Release_for_GitPage.md`](./02_Release_for_GitPage.md)를 참고하세요.

커밋 메시지는 `feat: 플레이어 이동 추가`, `fix: 점수 초기화 오류 수정`, `test: 충돌 시나리오 추가`처럼 변경 종류와 내용을 짧게 적습니다.

## 새 코드를 어디에 만들까?

- 한 기능에서만 사용: `src/features/<기능명>/`
- 기능 전용 클라이언트·서버 공통 타입: `src/features/<기능명>/shared/`
- 기능 하나의 재현 시나리오와 테스트: `src/features/<기능명>/tests/`
- 여러 기능이 사용하는 브라우저·서버 기반: `src/platform/`
- 여러 기능에서 검증된 작은 공통 코드: `src/shared/`
- 여러 기능을 연결하는 통합 테스트: 실제 필요가 생길 때 최상위 `tests/` 생성

처음부터 공통화를 예상해 코드를 `shared/`로 옮기지 마세요. 기능 안에서 구현한 뒤 실제 반복과 동일한 변경 이유가 확인될 때 리팩터링하는 편이 이해와 협업에 유리합니다.
