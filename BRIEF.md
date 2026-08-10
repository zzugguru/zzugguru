# Current Logic Work Brief

이 파일은 로직 작업 전용 계약입니다. CCTV 이미지 제작은 `BRIEF_ASSET.md`에서 별도 에셋 세션이 담당합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Task

Chapter 2 CCTV 채널 진행과 2D 화면 연출 개발

### Goal

빈 단색 CCTV 화면을 채널별 2D 그림이 표시되는 장면으로 발전시키고, 채널 순환과 불명확한 다음 행동을 수정한다.

### Included Scope

- 채널 이동을 1/3~3/3 경계에서 정지시켜 순환 방지
- 정답 채널 확인·독백 종료 후 다음 목표 채널로 자동 이동
- `다음 CCTV 화면으로 이동했습니다` 상태 피드백 표시
- 잘못된 채널 확인 피드백과 현재 진행 단계 표시
- 에셋 세션이 제공할 3개 이미지를 명시적 채널 매핑으로 로드·렌더링
- 이미지 로딩 실패 시 기존 단색 화면 fallback 유지
- 스캔라인, 채널명, 시간, 신호 상태 HUD를 Canvas로 표시
- E/Enter·클릭 확인과 좌우 방향키 유지

### Excluded Scope

- CCTV 이미지 생성·편집
- Chapter 2 다른 장면·게임 흐름·에셋 변경
- Chapter 1·3 변경

### Asset Contract

- `src/features/chapter2/assets/cctv-parking-memory.png`
- `src/features/chapter2/assets/cctv-lobby-memory.png`
- `src/features/chapter2/assets/cctv-guard-door-memory.png`
- 각 파일은 600×340 RGB/RGBA PNG이며 글자·UI·프레임을 이미지에 굽지 않는다.

### Done When

- [ ] 1/3에서 왼쪽, 3/3에서 오른쪽 입력이 채널을 순환시키지 않는다.
- [ ] 각 정답 확인 후 독백을 닫으면 다음 목표 채널과 명확한 피드백이 표시된다.
- [ ] 세 채널에 대응하는 2D 그림과 CCTV HUD가 표시된다.
- [ ] 이미지 실패 시 fallback 화면과 전체 진행이 유지된다.
- [ ] 마지막 3/3 확인 후에만 장면이 완료된다.
- [ ] 필수 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

로직 세션은 기존 채널 상태 머신, 경계 이동과 진행 피드백을 보존하면서 에셋 세션이 제공한 600×340 PNG 3개를 지하주차장→1층 로비→경비실 앞 채널에 명시적으로 매핑한다. 유효한 이미지는 600×340 native size로 렌더링하고 채널명·시간·신호·스캔라인 HUD는 Canvas로 덧씌운다. 로딩 실패나 오규격 이미지에서는 기존 단색 화면 fallback과 전체 진행을 유지한다.

## Agent Questions

해결됨. `BRIEF_ASSET.md` 에셋 세션이 지정된 600×340 RGB PNG 3개를 생성했고 사용자가 CCTV 적용을 요청해 로직 세션을 재개했다.

## Developer Decisions

- 2026-08-10: 로직은 `BRIEF.md`, 이미지 생성은 `BRIEF_ASSET.md`의 별도 세션이 담당한다.
- 2026-08-10: CCTV 장면은 지하주차장→1층 로비→경비실 앞 순서이며 채널 이동은 양 끝에서 순환하지 않는다.

## Agent Result

- CCTV 채널 이동을 1/3~3/3 경계에서 고정하고, 정답 독백 종료 시 다음 목표 채널 자동 선택, 다음 화면·잘못된 화면·진행 단계 피드백을 유지했다.
- `cctv-parking-memory.png`, `cctv-lobby-memory.png`, `cctv-guard-door-memory.png`를 지하주차장→1층 로비→경비실 앞에 명시적으로 매핑하고 Vite `new URL(..., import.meta.url)` 경로로 로드한다.
- 유효한 이미지는 원본과 같은 600×340 크기로 화면 `(180,80)`에 nearest-neighbor 렌더링한다. 미로딩·오규격 이미지는 기존 `#111827` 단색 화면을 유지하며 진행 상태와 입력에는 영향을 주지 않는다.
- 채널 번호·장소, 관측 시간, 단계별 신호 상태와 4px 간격 스캔라인은 이미지가 아닌 Canvas HUD로 덧씌우고, 독백 오버레이가 가장 마지막에 그려져 HUD를 가리도록 유지했다.
- 조작 안내는 Chapter 2 공통 입력인 `E/Enter`를 표시하며 shared `InputState`를 통한 클릭 확인과 좌우 채널 입력도 유지된다.
- 테스트 15개가 에셋 순서, native draw, 로딩·치수 실패, fallback 패널, Canvas HUD, 양끝 경계, 오답, 자동 이동과 최종 완료를 검증한다.
- 필수 검사: `npm run typecheck`, `npm run test`(62개 파일·300개 테스트), `npm run build`(세 PNG 번들 포함), `git diff --check` 모두 통과했다.
- Terra 독립 리뷰에서 finding이 없었고 채널 매핑, fallback, HUD 그리기 순서, E/Enter·클릭 및 진행 회귀를 확인했다.
- 남은 위험: 제어 가능한 브라우저에서 실제 Canvas 대비와 이미지 로딩 순간을 캡처하지 못해 소스·에셋·단위 테스트 검증으로 대체했다.

## Developer Final Check



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
