# Current Logic Work Brief

이 파일은 로직 작업 전용 계약입니다. 에셋 제작은 `BRIEF_ASSET.md`에서 별도 세션이 담당합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Active Request — deploy the default branch to GitHub Pages (supersedes the older requests below)

#### Task

Make pushes merged into the repository default branch deploy the built game to GitHub Pages automatically.

#### Included Scope

- Use `develop`, confirmed by `refs/remotes/origin/HEAD`, as the sole automatic production deployment branch.
- Remove `Feat-test` and `main` as Pages push triggers; retain an explicit manual dispatch path for recovery.
- Align Pull Request checks and repository release documentation with `develop`.
- Preserve the Vite project-site base `/zzugguru/` and the official Pages artifact/deployment flow.
- Add a repository-level regression test for branch triggers, Pages permissions/environment, artifact path, deploy dependency, and Vite base.

#### Excluded Scope

- Pushing, merging, changing GitHub repository settings, enabling Pages in the GitHub UI, custom domains, or altering branch protection through the API.
- Application gameplay or visual changes.

#### Done When

- A push to `develop` runs verification, builds `dist`, uploads the Pages artifact, and deploys it through the `github-pages` environment.
- Pushes to `main` or `Feat-test` do not trigger production Pages deployment.
- Pull Requests into `develop` run the verification workflow without deploying.
- Local required checks and one independent Terra review pass.

### Active Request — chapter selection UI refresh (supersedes the older requests below)

#### Task

Improve the opening chapter-selection interface without changing chapter gameplay or sequential unlock rules.

#### Included Scope

- Preserve the existing cinematic background and dark indigo design system.
- Replace plain chapter buttons with structured chapter cards showing number, title, short premise, availability, and next action.
- Show an at-a-glance journey/progress indicator and make the next playable chapter visually prominent.
- Keep locked chapters disabled and expose their prerequisite in visible text, title, and accessible labeling.
- Provide responsive desktop and mobile layouts with clear keyboard focus and readable contrast.
- Add regression coverage for card structure, state rendering, label stability, and responsive styling.

#### Excluded Scope

- New raster assets, chapter narrative changes, progress reset controls, or changes to sequential unlock behavior.
- Changes to in-game HUDs or canvas gameplay.

#### Done When

- The opening screen communicates the three-chapter journey and the current next action without relying on color alone.
- Each chapter card shows stable content in unlocked and locked states without destroying its internal markup.
- Locked prerequisites remain visible and accessible, and unlocked chapters remain keyboard operable.
- Desktop and narrow mobile layouts remain usable without clipping core actions.
- Design lint, typecheck, all tests, build, diff check, and one independent Terra review pass.

### Active Request — persistent sequential chapter unlocking (supersedes the older request below)

#### Task

Lock Chapter 2 until Chapter 1 is completed, and lock Chapter 3 until Chapter 2 is completed.

#### Included Scope

- Chapter 1 is always available; Chapter 2 and Chapter 3 menu buttons expose clear locked/disabled states.
- Persist the highest unlocked chapter in browser `localStorage` so progress survives reloads.
- Treat missing, malformed, unsupported, or inaccessible stored data as fresh Chapter 1-only progress.
- Completing Chapter 1 unlocks and starts Chapter 2; completing Chapter 2 unlocks and starts Chapter 3.
- Unlocking is monotonic and cannot relock an already available chapter.
- Stop the completed chapter's animation loop and input listeners before mounting the next chapter.
- Add regression tests for initial locks, reload persistence, malformed storage, monotonic updates, completion callbacks, cleanup, and menu gating.

#### Excluded Scope

- Reset-progress UI, cloud synchronization, authentication, or cross-browser progress transfer.
- Changes to chapter narratives, gameplay balance, or raster assets.

#### Done When

- A fresh browser can start only Chapter 1.
- Completing Chapter 1 persists and opens Chapter 2; completing Chapter 2 persists and opens Chapter 3.
- Reloading preserves the highest unlocked chapter, while invalid storage safely falls back to Chapter 1.
- Locked buttons cannot start their chapters and communicate their prerequisite accessibly.
- Typecheck, all tests, build, diff check, and one independent Terra review pass complete.

### Active Request — Chapter 1 controls and escape stages (supersedes the older request below)

#### Task

Update Chapter 1 only so its keyboard interface follows Chapter 3, and redesign the final escape into progressively harder stages.

#### Included Scope

- Story exploration: Arrow keys/WASD for movement and E/Enter for interaction or dialogue advance.
- Remove Z as a Chapter 1 story action key and update visible/live-region guidance.
- Rooftop escape: Arrow keys/WASD for movement, E/Enter for start/retry, Space for jump, and Shift/KeyS/ArrowDown for crawl where a stage requires it.
- Increase monster pursuit speed while preserving a fair floor-entry grace period.
- Stage 1: basic pursuit; Stage 2: jump obstacles; Stage 3: jump and crawl obstacles.
- Add visual obstacle/action feedback and regression tests for success, missed actions, capture, stage transitions, and input cleanup.

#### Excluded Scope

- Any modification to Chapter 2 or Chapter 3 code, assets, controls, or gameplay.
- Story scene asset generation and per-page asset mapping; those belong to a later `BRIEF_ASSET.md` session.
- Rhythm-game restoration or unrelated Chapter 1 refactors.

#### Done When

- Chapter 1 story guidance and input accept E/Enter and no longer advertise or accept Z.
- Escape Stage 2 cannot pass its obstacle without a timed jump.
- Escape Stage 3 requires both jump and crawl actions at distinct obstacles.
- The faster monster remains avoidable on a valid-action route and catches a player who misses required actions.
- Typecheck, all tests, build, diff check, and one independent Terra review pass.

### Task

병합된 Chapter 2 CCTV 정상/귀신 영상 로직으로 기존 CCTV 미니게임 교체

### Goal

방금 병합된 채널별 정상/귀신 영상 6장을 사용하는 CCTV 발견 연출을 기준으로 삼고, 기존에 개선한 비순환 채널 진행과 다음 행동 피드백을 결합한다.

### Included Scope

- `scene_cctv`의 채널별 정상/귀신 이미지 쌍을 명시적으로 매핑
- 현재 라운드의 목표 채널에는 귀신 영상, 나머지 채널에는 정상 영상 표시
- 이미지 로딩 실패 시 단색 화면 fallback 유지
- 채널 이동을 1/3~3/3 경계에서 정지
- 정답 독백 종료 후 다음 목표 채널로 자동 이동하고 상태 피드백 표시
- 잘못된 채널 피드백, 진행 단계, CCTV HUD 표시
- E/Enter·클릭 확인과 좌우 방향키 유지

### Excluded Scope

- CCTV 이미지 생성·편집
- Chapter 2의 다른 장면 및 Chapter 1·3 변경

### Asset Contract

- `src/features/chapter2/assets/scene_cctv/under_parking_normal.png`
- `src/features/chapter2/assets/scene_cctv/under_parking_ghost.png`
- `src/features/chapter2/assets/scene_cctv/front_robby_normal.png`
- `src/features/chapter2/assets/scene_cctv/front_robby_ghost.png`
- `src/features/chapter2/assets/scene_cctv/front_security_normal.png`
- `src/features/chapter2/assets/scene_cctv/front_security_ghost.png`

### Done When

- [ ] 세 채널이 병합된 정상/귀신 영상 쌍을 올바르게 선택한다.
- [ ] 이미지 실패 시 fallback과 전체 진행이 유지된다.
- [ ] 1/3 왼쪽과 3/3 오른쪽 입력이 순환하지 않는다.
- [ ] 정답 확인 뒤 다음 목표 채널과 명확한 피드백이 표시된다.
- [ ] 마지막 3/3 확인 후에만 장면이 완료된다.
- [ ] 필수 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

The repository already has the correct Vite project base and official two-job Pages artifact flow, but its push trigger does not include the actual default branch. The deployment and PR workflows will be aligned to `develop`, feature/test branches will not deploy production, and a manual dispatch will remain available. Documentation and a repository-level regression test will make the branch policy and required Pages permissions explicit. Remote settings and the actual push/merge remain outside this local change.

The opening screen will retain its existing story background but gain a clearer hierarchy: a compact title/progress introduction followed by three structured chapter cards. Each card will retain stable number, title, premise, status, and action elements while the existing persistent sequential progression controls disabled, locked, and next-playable states. No raster or gameplay changes are included. Existing design tokens will be reused, new component variants will be documented in `DESIGN.md`, and responsive/accessibility behavior will be covered by tests.

새 브라우저에서는 Chapter 1만 실행할 수 있고, 완료 순서에 따라 Chapter 2와 Chapter 3을 단조 증가 방식으로 해금한다. 최고 해금 단계는 버전이 포함된 `localStorage` 레코드로 보존하며 읽기·쓰기 예외와 잘못된 값은 Chapter 1-only 상태로 안전하게 처리한다. Chapter 1 및 Chapter 2 완료 시 기존 게임의 RAF와 입력 리스너를 먼저 정리한 뒤 다음 챕터를 자동 시작한다. 메뉴 버튼은 실제 `disabled`와 잠금 사유를 함께 제공한다. 저장 초기화 UI, 서버 동기화, 게임 내용 변경은 범위 밖이다.


병합 충돌에 남은 기존 단일 이미지 구현 대신 새 `scene_cctv` 정상/귀신 쌍 선택을 기준으로 CCTV 렌더링을 구성한다. 이전 로직에서 개선한 채널 clamp, 자동 다음 채널, 오답·경계 피드백과 E/Enter 안내는 유지한다. 이미지가 아직 로드되지 않았거나 유효하지 않으면 기본 화면을 표시하되 상태 진행은 막지 않는다.

## Agent Questions

- GitHub reports `develop` as the repository default branch, while the existing Pages workflow and release documentation describe `main` (and the workflow additionally deploys `Feat-test`). Recommended: make `develop` the sole automatic production deployment branch and align PR checks/docs; alternative: keep `main` as the intended release branch and change the repository default branch outside this workspace.
- Resolved 2026-08-10: developer approved the recommended `develop`-only production deployment policy.

없음. 사용자가 방금 병합한 CCTV 로직을 기준으로 수정하도록 명시했다.

## Developer Decisions

- 2026-08-10: 로직은 `BRIEF.md`, 이미지 생성은 `BRIEF_ASSET.md`의 별도 세션이 담당한다.
- 2026-08-10: CCTV 장면은 지하주차장→1층 로비→경비실 앞 순서이며 채널 이동은 양 끝에서 순환하지 않는다.
- 2026-08-10: 기존 3장 단일 기억 이미지 방식 대신 방금 병합된 채널별 정상/귀신 6장 전환 로직을 사용한다.

## Agent Result

- Aligned automatic GitHub Pages production deployment with the confirmed default branch, `develop`; removed `main` and `Feat-test` push triggers and retained `workflow_dispatch` for manual recovery.
- Aligned Pull Request verification and all release/process documentation with `develop`.
- Preserved Vite `base: '/zzugguru/'` and the official build → Pages artifact → `github-pages` environment deployment flow.
- Added `tests/githubPagesDeployment.test.js` to enforce branch scope, exact supported Pages action versions, permissions, artifact path, build dependency, environment, and Vite base.
- Verification passed: `npm run typecheck`, `npm run test` (69 files, 332 tests), `npm run build`, and `git diff --check`; focused post-fix deployment tests passed 2/2.
- Independent Terra review found one P1 risk: undocumented Pages action majors. Pinned `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`; the same reviewer verified the fix with no regression.
- Residual external step: repository Settings → Pages → Source must be `GitHub Actions`, and these local changes must be merged/pushed to `develop`; no remote settings, commit, push, workflow run, or live-site check was performed.

- Refreshed the opening chapter selection into three structured story cards while preserving the existing cinematic background and sequential unlock behavior.
- Added a live unlocked-chapter summary and distinct current, completed/replayable, and locked card states with visible prerequisites and accessible labels.
- Added responsive three-column desktop and one-column mobile layouts using existing design tokens; documented `chapter-progress`, `chapter-card`, and `chapter-card-locked` in `DESIGN.md`.
- Updated state rendering so it changes only dedicated status/action nodes and never destroys card markup across rerenders.
- Verification passed: `npm run design:lint` (0 errors; two existing orphan-token warnings), `npm run typecheck`, `npm run test` (68 files, 330 tests), `npm run build`, and `git diff --check`.
- Independent Terra review reported no actionable findings; focused reviewer checks passed (3 files, 18 tests).
- Residual risk: no connected browser was available, so real viewport clipping and visual contrast were not manually inspected.

- Delivered persistent sequential progression: Chapter 1 unlocks/starts Chapter 2, and Chapter 2 unlocks/starts Chapter 3. Fresh sessions expose only Chapter 1.
- Added versioned `localStorage` progress with safe invalid/inaccessible-storage fallback and monotonic writes that preserve newer progress from another tab.
- Added disabled menu states, accessible prerequisite labels, defensive locked activation rejection, and stable labels across rerenders.
- Added one-shot completion handoffs and RAF/input cleanup for Chapter 1 rooftop escape and Chapter 2 before the next chapter mounts.
- Verification passed: `npm run typecheck`; `npm run test` (68 files, 328 tests); `npm run build`; `git diff --check`.
- Independent Terra(high) review found two P2 gaps (stale-tab monotonicity and source-only menu tests); both were fixed and the same reviewer verified the result clean.
- Residual risk: the full Chapter 1-to-3 playthrough was not manually completed in a real browser during this run; automated progression, persistence, gating, callback, and cleanup paths pass.

- 병합 충돌을 해소하고 기존 3장 단일 이미지 구현을 `scene_cctv`의 채널별 정상/귀신 이미지 6장 전환 로직으로 교체했다.
- 현재 라운드의 목표 채널만 귀신 영상을 표시하고 다른 채널은 정상 영상을 표시한다. 유효한 영상은 `(180,80,600,340)`에 맞춰 렌더링하며 미로딩·오규격 영상은 단색 fallback을 유지한다.
- 1/3·3/3 채널 경계 clamp, 정답 독백 종료 후 다음 목표 자동 이동, 오답·첫/마지막 화면·진행 단계 피드백과 E/Enter 안내를 유지했다.
- 테스트는 6개 에셋 경로, 라운드별 정상/귀신 선택, 로딩 실패, 렌더 좌표, 양끝 경계, 자동 이동, 오답과 마지막 라운드 완료를 검증한다.
- 최종 검사: `npm run typecheck`, `npm run test`(64개 파일·309개 테스트), `npm run build`, `git diff --check` 모두 통과했다.
- Terra(high) 독립 리뷰에서 추가 finding이 없었으며 집중 검사 22/22가 통과했다.
- 남은 위험: 브라우저 실제 플레이를 수행하지 못해 800×436 영상을 600×340으로 표시할 때의 미세한 종횡비 변화는 런타임 육안 검증이 필요하다.

## Developer Final Check



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
