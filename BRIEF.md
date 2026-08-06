# Current Work Brief

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Task

`Feat-test` 브랜치 GitHub Pages 자동 배포 허용

### Goal

게임 프로토타입을 `main`에 병합하기 전에 현재 `Feat-test` 브랜치에 push하는 것만으로 기존 GitHub Pages 주소에서 플레이할 수 있게 한다.

### Included Scope

- `Feat-test` 브랜치 push를 Pages 배포 트리거에 추가
- 기존 검증과 빌드가 성공한 경우에만 배포
- 기존 `main` push 배포 유지
- 현재 Vite `/zzugguru/` base 경로 유지

### Excluded Scope

- 브랜치별 별도 Preview URL
- 동시에 여러 Pages 버전 호스팅
- GitHub 저장소 웹 설정 직접 변경
- 커밋, push 또는 Pull Request 생성

### Done When

- [ ] `Feat-test` push에서 검증 성공 후 Pages 배포가 실행된다.
- [ ] `main` push 배포도 계속 실행된다.
- [ ] 그 외 브랜치 push와 Pull Request에서는 Pages 배포가 실행되지 않는다.
- [ ] 기존 타입 검사, 테스트, 디자인 검사와 빌드가 배포 전에 유지된다.
- [ ] `npm run typecheck`, `npm run test`, `npm run build`, `git diff --check`를 통과한다.

## Developer Decisions

- `Feat-test`는 별도 Preview가 아니라 기존 GitHub Pages 사이트를 덮어써 배포한다.
- 이후 `main` push가 발생하면 동일한 사이트가 `main` 빌드로 다시 교체될 수 있다.
- 현재 저장소의 2인 하네스 절차에 따라 구현과 독립 검토를 진행한다.

## Agent Understanding

- 목표: 현재 체크아웃된 `Feat-test` 브랜치를 원격에 push하면 기존 Pages 워크플로가 동일한 품질 검사를 거쳐 게임 빌드를 기존 사이트에 배포한다.
- 포함 범위: `.github/workflows/deploy-pages.yml`의 push 브랜치 필터에 정확히 `Feat-test`를 추가하고, `main`과 기존 검증·배포 단계 및 `/zzugguru/` 경로는 유지한다.
- 제외 범위: 별도 Preview 주소나 동시 버전 호스팅, 다른 브랜치 배포, 저장소 설정 변경, 커밋과 원격 push.
- 배포 경계: `main` 또는 `Feat-test` push만 Pages 배포를 시작한다. PR 이벤트와 다른 브랜치 push는 배포하지 않으며, 공유 `github-pages` 환경이므로 가장 최근 성공 배포가 사이트 내용을 결정한다.
- 완료 기준: 워크플로 트리거와 기존 단계가 요구사항에 맞고 프로젝트 전체 검사와 diff 검사가 통과한다.
- 검증: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run design:lint`, `npm.cmd run build`, 워크플로 텍스트 확인, `git diff --check`.

## Agent Questions

없음.

## Agent Result

- `.github/workflows/deploy-pages.yml`의 push 필터에 정확한 대소문자 `Feat-test`를 추가했다. 이제 `Feat-test` 또는 `main` push에서만 동일한 검증 후 기존 GitHub Pages 사이트를 배포한다.
- 기존 `npm ci`, 타입 검사, 테스트, 디자인 검사, 빌드, Pages artifact 업로드와 배포 단계 및 `/zzugguru/` base 경로는 변경하지 않았다. PR과 다른 브랜치 push는 Pages를 배포하지 않는다.
- `npm.cmd run typecheck`, `npm.cmd run test`(9개), `npm.cmd run design:lint`, `npm.cmd run build`, `git diff --check`를 통과했다. 디자인 검사는 오류 없이 기존 미사용 토큰 경고 3건만 보고했다.
- 독립 리뷰어가 브랜치 대소문자, 이벤트 범위, 검증 선행 조건, Pages 권한·동시성, Vite base와 PR 워크플로 충돌 여부를 확인했으며 수정이 필요한 문제는 없었다.
- 잔여 위험: GitHub 저장소의 `github-pages` Environment 보호 규칙이 `Feat-test` 배포를 허용하는지는 로컬에서 확인할 수 없다. 실제 push 후 Actions 실행과 Pages URL을 확인해야 한다.
