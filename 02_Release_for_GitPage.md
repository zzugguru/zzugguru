# GitHub Pages 배포 가이드

이 문서는 로컬에서 확인한 ZZUGGURU 웹 게임을 GitHub Pages에 배포하는 방법을 설명한다.

이 저장소는 **로컬에서 먼저 확인하고, Pull Request에서는 자동 검사만 실행하며, 기본 브랜치인 `develop`에 병합되는 순간 GitHub Pages에 자동 배포**되도록 구성되어 있다. 저장소의 설정 파일은 준비되어 있지만 GitHub 웹 화면에서 Pages를 활성화하는 작업은 관리자가 최초 한 번 수행해야 한다.

```text
최초 1회
GitHub Pages의 Source를 GitHub Actions로 선택

이후 매 작업
로컬 개발·검증 → PR 자동 검사 → 리뷰·develop 병합 → 자동 빌드·배포
```

---

## 1. GitHub Pages에서 배포할 수 있는 것

GitHub Pages는 HTML, CSS, JavaScript와 이미지 같은 **정적 파일을 제공하는 서비스**다. 이 프로젝트는 Vite가 게임 코드를 정적 파일로 빌드하므로 Pages에 배포할 수 있다.

```text
TypeScript 소스
      ↓ npm run build
dist/ 정적 파일
      ↓ GitHub Actions
GitHub Pages
```

다만 다음 기능은 GitHub Pages 자체에서 실행할 수 없다.

- Node.js 서버와 같은 상시 실행 백엔드
- 서버 전용 데이터베이스 연결
- 서버에만 보관해야 하는 API 키나 비밀 값
- 서버 측 인증 및 권한 검사

브라우저에 포함되는 `VITE_*` 환경 변수는 사용자가 확인할 수 있으므로 비밀 키를 넣으면 안 된다. 나중에 게임에 로그인, 결제, 서버 권한 검증이나 영구 데이터 저장이 필요해지면 별도의 백엔드 배포 환경을 준비해야 한다.

---

## 2. 저장소에 적용된 배포 설정

다음 설정은 이 저장소에 이미 반영되어 있다. 개발자는 설정의 역할을 이해하고 저장소 이름이나 배포 방식이 달라질 때 함께 수정한다.

현재 Git 원격 저장소 이름을 기준으로 예상 배포 주소는 다음과 같다.

```text
https://zzugguru.github.io/zzugguru/
```

사용자 또는 조직 사이트가 아니라 저장소 단위의 프로젝트 사이트이므로 URL에 `/zzugguru/`가 붙는다.

### 2.1 Vite의 배포 기준 경로 설정

루트의 `vite.config.ts`에는 다음 `base`가 설정되어 있다.

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/zzugguru/',
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
  },
});
```

이 설정이 없으면 배포된 페이지가 JavaScript나 이미지 파일을 도메인의 루트에서 찾는다. 그 결과 HTML은 열리더라도 게임 화면이 비어 있거나 리소스가 `404`로 실패할 수 있다.

저장소 이름을 바꾸면 `base`도 새 이름에 맞게 바꿔야 한다. `https://zzugguru.github.io/` 자체를 사용하는 사용자 사이트나 루트에 연결된 사용자 도메인을 사용한다면 일반적으로 `base: '/'`를 사용한다.

### 2.2 Pull Request 검증 워크플로

`.github/workflows/pull-request-checks.yml`은 `develop` 대상 Pull Request가 생성되거나 새 commit이 push될 때 실행된다.

```text
npm ci
  ↓
npm run typecheck
  ↓
npm run test
  ↓
npm run design:lint
  ↓
npm run build
```

이 워크플로에는 Pages 쓰기 권한과 배포 단계가 없다. 따라서 기능 브랜치와 Pull Request의 코드는 운영 사이트에 배포되지 않는다. 새로운 push가 들어오면 이전 검사는 취소하고 최신 commit을 다시 검사한다.

### 2.3 `develop` 자동 배포 워크플로

`.github/workflows/deploy-pages.yml`은 다음 상황에만 실행된다.

- Pull Request가 `develop`에 병합되어 `develop` push가 발생했을 때
- Actions 탭에서 `workflow_dispatch`로 수동 실행했을 때

워크플로는 PR과 동일한 검증을 다시 실행한 뒤 Vite의 `dist/`를 업로드한다. 검증이나 빌드 하나라도 실패하면 `deploy` 작업이 실행되지 않으므로 기존 운영 사이트가 그대로 유지된다.

```text
develop push
  ↓
타입 검사·테스트·디자인 검사·빌드
  ↓ 성공한 경우에만
Pages artifact 업로드
  ↓
GitHub Pages 배포
```

액션 버전은 시간이 지나면서 바뀔 수 있다. 실제 설정 시점에 이 문서 하단의 Vite 및 GitHub 공식 문서에서 현재 권장 버전을 함께 확인한다. 보안을 더 엄격하게 운영할 때는 버전 태그 대신 검증된 commit SHA로 액션 버전을 고정할 수 있다.

### 2.4 `develop` 직접 push 차단

Actions의 `push: develop` 조건은 Pull Request 병합뿐 아니라 직접 push에도 반응한다. 따라서 “검증된 Pull Request를 병합할 때만 배포”를 보장하려면 GitHub에서 `develop` 보호 규칙을 반드시 활성화해야 한다.

1. 저장소의 **Settings → Rules → Rulesets**를 연다.
2. `develop`을 대상으로 하는 branch ruleset을 만들고 Enforcement status를 `Active`로 설정한다.
3. **Require a pull request before merging**을 활성화한다.
4. **Require status checks to pass**를 활성화하고 `Pull Request Checks / Verify`를 필수 검사로 추가한다.
5. 팀 정책에 따라 최소 승인 인원을 설정하고, 일반 개발자가 규칙을 우회하지 못하도록 bypass 목록을 확인한다.

필수 검사 목록에 `Pull Request Checks / Verify`가 아직 나타나지 않으면 먼저 이 워크플로가 포함된 Pull Request를 한 번 실행한 뒤 다시 설정한다. Ruleset을 사용할 수 없는 저장소 설정이라면 동일한 요구사항을 branch protection rule로 구성한다.

### 2.5 GitHub에서 Pages 최초 활성화

저장소의 GitHub 웹 화면에서 다음 순서로 설정한다. 이 작업을 하려면 저장소 관리자 권한이 필요하다.

1. 저장소의 **Settings**를 연다.
2. 왼쪽 메뉴에서 **Pages**를 선택한다.
3. **Build and deployment**의 **Source**를 `GitHub Actions`로 선택한다.
4. 설정을 저장한다.
5. **Actions** 탭에서 `Deploy to GitHub Pages` 작업이 실행되는지 확인한다.

GitHub Actions 방식에서는 빌드 결과인 `dist/`를 별도 브랜치에 직접 commit할 필요가 없다. 소스와 배포 산출물을 같은 브랜치에서 관리하지 않아도 된다.

### 2.6 최초 배포 확인

설정 파일을 `develop`에 merge하면 워크플로가 자동 실행된다. GitHub의 **Actions** 탭에서 `build`와 `deploy`가 모두 초록색으로 끝났는지 확인한다.

배포 주소는 다음 위치에서 확인할 수 있다.

- **Settings → Pages**의 사이트 주소
- 완료된 Actions 실행의 `deploy` 단계

첫 배포나 변경 반영에는 잠시 시간이 걸릴 수 있다. Actions가 성공했는데 이전 화면이 보이면 브라우저를 강력 새로고침하거나 캐시를 비운 뒤 다시 확인한다.

---

## 3. 최초 설정 후 개발자가 배포하는 흐름

설정이 끝나면 평소 개발 흐름은 다음과 같다.

### 3.1 기능 브랜치에서 개발

`01_Dev_Process_Guaid.md`에 따라 `BRIEF.md`에 작업을 작성하고 기능 브랜치에서 하네스로 개발한다.

```bash
git switch -c feature/example
npm run dev
```

기능 개발 중에는 로컬 서버에서 동작을 확인한다. `npm run dev`는 개발용 서버이며 GitHub Pages 배포와는 별개다.

### 3.2 배포 전 로컬 검증

메인 에이전트의 검증 결과에 더해 개발자가 실제 화면과 조작을 확인한다.

```bash
npm run typecheck
npm run test
npm run design:lint
npm run build
npm run preview
```

`npm run build`가 성공하면 배포할 정적 파일이 `dist/`에 만들어진다. `npm run preview`는 그 결과를 로컬에서 확인하는 명령이며 운영 서버로 사용하지 않는다. `base`가 설정되어 있으면 터미널에 표시된 주소에서 `/zzugguru/` 경로까지 포함해 확인한다.

`dist/`는 빌드할 때마다 다시 만들어지는 결과물이므로 Git에 직접 추가하지 않는다.

### 3.3 GitHub에 올리고 Pull Request merge

기능 브랜치를 GitHub에 push하고 Pull Request를 만든다.

```bash
git push -u origin feature/example
```

기능 브랜치를 push하면 Pull Request의 `Pull Request Checks / Verify`가 검사만 수행한다. 따라서 **기능 브랜치를 push한 것만으로는 운영 사이트가 바뀌지 않는다.** 자동 검사와 개발자 검토를 마치고 Pull Request를 `develop`에 merge하면 별도의 배포 명령 없이 자동 배포가 시작된다.

```text
기능 브랜치 push
      ↓
Pull Request 자동 검사
      ↓
개발자 검토
      ↓
develop에 merge
      ↓
GitHub Actions 검사·빌드
      ↓
검사가 성공하면 GitHub Pages 배포
```

즉, 최초 Pages 활성화 후에는 개발자 관점에서 대체로 “로컬과 PR에서 검증한 코드를 `develop`에 병합하면 자동 배포된다”가 맞다. 단, `Deploy to GitHub Pages`가 성공했고 실제 배포 화면도 정상인지 마지막으로 확인해야 한다.

---

## 4. 배포 후 확인할 항목

자동 배포가 성공한 뒤에는 최소한 다음을 직접 확인한다.

- 첫 화면이 빈 화면 없이 표시되는가?
- 브라우저 개발자 도구의 Console에 오류가 없는가?
- Network 탭에서 JavaScript, 이미지와 사운드가 `404` 없이 로드되는가?
- 키보드, 마우스 또는 터치 조작이 정상인가?
- 새로고침 후에도 게임이 정상적으로 시작되는가?
- 모바일을 지원한다면 실제 모바일 화면에서도 레이아웃이 유지되는가?

GitHub Actions의 성공은 파일이 정상적으로 만들어져 배포되었다는 의미다. 게임의 규칙, 조작성과 시각적 결과가 의도대로라는 사실까지 보장하지는 않으므로 개발자의 최종 확인이 필요하다.

---

## 5. 자주 발생하는 문제

### 화면이 비어 있고 파일 요청이 `404`인 경우

가장 먼저 `vite.config.ts`의 `base`가 `/zzugguru/`인지 확인한다. 저장소 이름과 대소문자까지 같아야 한다.

### Actions는 실행되지만 Pages 배포 단계가 실패하는 경우

**Settings → Pages → Source**가 `GitHub Actions`인지 확인한다. 워크플로의 `pages: write`, `id-token: write` 권한과 `github-pages` environment 설정도 확인한다.

### Pull Request의 `Verify`가 실패하는 경우

실패한 단계의 로그를 확인하고 기능 브랜치에서 수정한 뒤 다시 push한다. 검사를 우회해 `develop`에 직접 push하지 않는다. `develop` Ruleset의 필수 검사에 `Pull Request Checks / Verify`가 포함됐는지 확인한다.

### 로컬에서는 되지만 GitHub에서 이미지가 안 보이는 경우

GitHub Actions의 Linux 환경은 파일 이름의 대소문자를 구분한다. 예를 들어 코드가 `Player.png`를 요청하는데 실제 파일이 `player.png`라면 로컬 환경에 따라 보이더라도 배포 후 실패할 수 있다.

또한 `src`의 리소스는 import하거나 Vite 방식에 맞게 참조하고, `public`의 파일은 배포 기준 경로를 고려해 참조해야 한다. 문자열로 루트 절대 경로를 직접 작성하면 프로젝트 사이트의 `/zzugguru/`가 빠질 수 있다.

### 특정 게임 URL을 새로고침하면 `404`인 경우

현재처럼 하나의 HTML 진입점만 사용하는 게임에는 보통 문제가 없다. 나중에 클라이언트 라우터를 도입하고 `/inventory` 같은 경로를 직접 사용하면 GitHub Pages는 해당 서버 파일을 찾으려 하므로 `404`가 날 수 있다. 이때는 hash routing을 사용하거나 Pages용 `404.html` fallback 전략을 별도로 설계한다.

### 비공개 저장소에서 Pages를 사용하려는 경우

GitHub 요금제와 조직 정책에 따라 비공개 저장소의 Pages 사용 가능 여부가 다를 수 있다. 또한 저장소가 비공개여도 배포 사이트의 공개 범위는 별개일 수 있으므로 민감한 정보나 비밀 값을 빌드 결과에 포함하지 않는다.

---

## 6. 문제가 있는 버전을 되돌리는 방법

배포 후 치명적인 문제가 발견되면 롤백 브랜치에서 잘못된 변경을 되돌리고 긴급 Pull Request를 만든다. 필수 검사를 통과한 롤백 Pull Request를 `develop`에 병합하면 같은 워크플로가 이전의 정상 코드로 다시 빌드하고 배포한다.

```bash
git switch -c revert/broken-release
git revert <문제가-생긴-commit>
git push -u origin revert/broken-release
```

push 후 GitHub에서 `develop` 대상 Pull Request를 열고 `Pull Request Checks / Verify`와 개발자 확인을 거쳐 병합한다. 긴급 상황에서도 보호 규칙을 우회해 `develop`에 직접 push하지 않는다. 공유 브랜치의 이력을 강제로 바꾸는 `reset --hard`나 force push도 사용하지 않는다.

---

## 7. 체크리스트

### 최초 1회

- [ ] GitHub Pages의 Source를 `GitHub Actions`로 선택했다.
- [ ] `develop` Ruleset에서 Pull Request를 필수로 설정하고 직접 push를 막았다.
- [ ] `Pull Request Checks / Verify`를 필수 검사로 지정했다.
- [ ] 최초 Actions의 `build`와 `deploy`가 성공했다.
- [ ] `https://zzugguru.github.io/zzugguru/`에서 실제 게임을 확인했다.

### 기능을 배포할 때마다

- [ ] 하네스 검증과 개발자 최종 확인을 마쳤다.
- [ ] 로컬 타입 검사, 테스트, 디자인 검사와 빌드가 성공했다.
- [ ] Pull Request Checks / Verify가 성공했다.
- [ ] Pull Request를 검토하고 `develop`에 merge했다.
- [ ] Deploy to GitHub Pages가 성공했다.
- [ ] 배포 주소에서 핵심 게임 흐름을 다시 확인했다.

---

## 공식 문서

- [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html)
- [GitHub Docs: Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Docs: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Docs: GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
