# Current Work Brief

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Task

GitHub Pages 자동 배포 구성

### Goal

기능 브랜치에서는 로컬과 Pull Request CI로 검증하고, main에 병합되는 순간 GitHub Pages에 자동 배포한다.

### Included Scope

- Vite GitHub Pages 경로 설정
- Pull Request 타입 검사, 테스트, 디자인 검사 및 빌드
- main 병합 시 동일한 검사 후 GitHub Pages 자동 배포
- README와 개발·배포 가이드 수정

### Excluded Scope

- 기능 브랜치별 Preview 사이트
- 별도 백엔드 배포
- 커스텀 도메인

### Done When

- [ ] 로컬에서 개발 서버와 배포 빌드를 확인할 수 있다.
- [ ] Pull Request에서는 검증만 실행되고 배포되지 않는다.
- [ ] main에 병합하면 검증 성공 후 자동 배포된다.
- [ ] 관련 문서가 실제 설정과 일치한다.

## Agent Understanding

- 목표: 기능 브랜치에서는 로컬 개발과 Pull Request CI로 품질을 확인하고, `main` 병합으로 발생한 push에서만 GitHub Pages 운영 사이트를 자동 배포한다.
- 구현 범위: Vite 프로젝트 사이트 기준 경로 `/zzugguru/`, PR 전용 검증 워크플로, `main` 전용 검증·Pages 배포 워크플로, README와 개발·배포 가이드의 실제 설정 동기화.
- 배포 경계: 기능 브랜치 push와 Pull Request에서는 배포하지 않는다. `main` push에서도 타입 검사, 테스트, 디자인 검사와 빌드가 모두 성공한 경우에만 배포한다.
- 제외 범위: 브랜치별 Preview URL, 백엔드, 커스텀 도메인, GitHub 저장소 웹 설정의 직접 변경.
- 검증: `npm run typecheck`, `npm run test`, `npm run design:lint`, `npm run build`, 로컬 preview 응답 확인, 워크플로 구문과 `git diff --check` 확인.

## Agent Questions

없음

## Agent Result

- `vite.config.ts`에 GitHub 프로젝트 사이트 경로 `/zzugguru/`를 적용했다.
- `pull-request-checks.yml`은 `main` 대상 Pull Request에서 타입 검사, 테스트, 디자인 검사와 빌드만 수행하며 배포 권한과 단계가 없다.
- `deploy-pages.yml`은 `main` push에서 동일 검증과 빌드가 성공한 경우에만 Pages artifact를 배포한다. 임의 브랜치를 배포할 수 있는 수동 실행 트리거는 두지 않았다.
- README, 개발 프로세스 가이드와 Pages 배포 가이드를 실제 설정에 맞췄다. `main` 직접 push를 막고 PR 및 `Pull Request Checks / Verify`를 요구하는 Ruleset 설정과 PR 기반 롤백 절차도 명시했다.
- `npm run typecheck`, `npm run test`, `npm run design:lint`, `npm run build`, YAML 파싱과 `git diff --check`를 통과했다. 디자인 검사는 오류 없이 기존 미사용 토큰 경고 3건만 보고했다.
- 로컬 preview가 `http://127.0.0.1:4173/zzugguru/`에서 응답하고 빌드 asset URL이 `/zzugguru/assets/...`를 사용하는 것을 확인했다.
- 독립 검증자가 수동 실행의 임의 브랜치 배포 위험과 보호된 `main`에 맞지 않는 직접 push 롤백 예시를 발견했다. 수동 트리거를 제거하고 Ruleset 및 PR 롤백으로 수정했으며, 같은 검증자의 최종 재검증을 통과했다.
- GitHub 웹에서 Pages Source, `main` Ruleset과 필수 검사 활성화 및 최초 실제 배포는 개발자가 확인해야 한다.
