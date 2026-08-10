# Current Logic Work Brief

이 파일은 로직 작업 전용 계약입니다. 에셋 제작은 `BRIEF_ASSET.md`에서 별도 세션이 담당합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

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

<<<<<<< HEAD
병합 충돌에 남은 기존 단일 이미지 구현 대신 새 `scene_cctv` 정상/귀신 쌍 선택을 기준으로 CCTV 렌더링을 구성한다. 이전 로직에서 개선한 채널 clamp, 자동 다음 채널, 오답·경계 피드백과 E/Enter 안내는 유지한다. 이미지가 아직 로드되지 않았거나 유효하지 않으면 기본 화면을 표시하되 상태 진행은 막지 않는다.

## Agent Questions

없음. 사용자가 방금 병합한 CCTV 로직을 기준으로 수정하도록 명시했다.
=======
로직 세션은 기존 채널 상태 머신, 경계 이동과 진행 피드백을 보존하면서 에셋 세션이 제공한 600×340 PNG 3개를 지하주차장→1층 로비→경비실 앞 채널에 명시적으로 매핑한다. 유효한 이미지는 600×340 native size로 렌더링하고 채널명·시간·신호·스캔라인 HUD는 Canvas로 덧씌운다. 로딩 실패나 오규격 이미지에서는 기존 단색 화면 fallback과 전체 진행을 유지한다.

## Agent Questions

해결됨. `BRIEF_ASSET.md` 에셋 세션이 지정된 600×340 RGB PNG 3개를 생성했고 사용자가 CCTV 적용을 요청해 로직 세션을 재개했다.
>>>>>>> 9ff51417c47613f32315fe1f18e17c3b64dc1148

## Developer Decisions

- 2026-08-10: 로직은 `BRIEF.md`, 이미지 생성은 `BRIEF_ASSET.md`의 별도 세션이 담당한다.
- 2026-08-10: CCTV 장면은 지하주차장→1층 로비→경비실 앞 순서이며 채널 이동은 양 끝에서 순환하지 않는다.
- 2026-08-10: 기존 3장 단일 기억 이미지 방식 대신 방금 병합된 채널별 정상/귀신 6장 전환 로직을 사용한다.

## Agent Result

<<<<<<< HEAD
- 병합 충돌을 해소하고 기존 3장 단일 이미지 구현을 `scene_cctv`의 채널별 정상/귀신 이미지 6장 전환 로직으로 교체했다.
- 현재 라운드의 목표 채널만 귀신 영상을 표시하고 다른 채널은 정상 영상을 표시한다. 유효한 영상은 `(180,80,600,340)`에 맞춰 렌더링하며 미로딩·오규격 영상은 단색 fallback을 유지한다.
- 1/3·3/3 채널 경계 clamp, 정답 독백 종료 후 다음 목표 자동 이동, 오답·첫/마지막 화면·진행 단계 피드백과 E/Enter 안내를 유지했다.
- 테스트는 6개 에셋 경로, 라운드별 정상/귀신 선택, 로딩 실패, 렌더 좌표, 양끝 경계, 자동 이동, 오답과 마지막 라운드 완료를 검증한다.
- 최종 검사: `npm run typecheck`, `npm run test`(64개 파일·309개 테스트), `npm run build`, `git diff --check` 모두 통과했다.
- Terra(high) 독립 리뷰에서 추가 finding이 없었으며 집중 검사 22/22가 통과했다.
- 남은 위험: 브라우저 실제 플레이를 수행하지 못해 800×436 영상을 600×340으로 표시할 때의 미세한 종횡비 변화는 런타임 육안 검증이 필요하다.
=======
- CCTV 채널 이동을 1/3~3/3 경계에서 고정하고, 정답 독백 종료 시 다음 목표 채널 자동 선택, 다음 화면·잘못된 화면·진행 단계 피드백을 유지했다.
- `cctv-parking-memory.png`, `cctv-lobby-memory.png`, `cctv-guard-door-memory.png`를 지하주차장→1층 로비→경비실 앞에 명시적으로 매핑하고 Vite `new URL(..., import.meta.url)` 경로로 로드한다.
- 유효한 이미지는 원본과 같은 600×340 크기로 화면 `(180,80)`에 nearest-neighbor 렌더링한다. 미로딩·오규격 이미지는 기존 `#111827` 단색 화면을 유지하며 진행 상태와 입력에는 영향을 주지 않는다.
- 채널 번호·장소, 관측 시간, 단계별 신호 상태와 4px 간격 스캔라인은 이미지가 아닌 Canvas HUD로 덧씌우고, 독백 오버레이가 가장 마지막에 그려져 HUD를 가리도록 유지했다.
- 조작 안내는 Chapter 2 공통 입력인 `E/Enter`를 표시하며 shared `InputState`를 통한 클릭 확인과 좌우 채널 입력도 유지된다.
- 테스트 15개가 에셋 순서, native draw, 로딩·치수 실패, fallback 패널, Canvas HUD, 양끝 경계, 오답, 자동 이동과 최종 완료를 검증한다.
- 필수 검사: `npm run typecheck`, `npm run test`(62개 파일·300개 테스트), `npm run build`(세 PNG 번들 포함), `git diff --check` 모두 통과했다.
- Terra 독립 리뷰에서 finding이 없었고 채널 매핑, fallback, HUD 그리기 순서, E/Enter·클릭 및 진행 회귀를 확인했다.
- 남은 위험: 제어 가능한 브라우저에서 실제 Canvas 대비와 이미지 로딩 순간을 캡처하지 못해 소스·에셋·단위 테스트 검증으로 대체했다.
>>>>>>> 9ff51417c47613f32315fe1f18e17c3b64dc1148

## Developer Final Check



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
