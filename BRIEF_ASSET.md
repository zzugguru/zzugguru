# Current Asset Work Brief

이 파일은 에셋 작업 전용 요청, 질문, 결정과 결과를 공유하는 단일 창구입니다. 로직 작업의 `BRIEF.md`와 독립적으로 관리합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

상태 흐름: `DRAFT` → `READY` → `IN_PROGRESS` → `REVIEW` → `ACCEPTED`

## Developer Request

### Active Request — Chapter 1 story scene variants (supersedes the older request below)

#### Task

Create and integrate Chapter 1 story scene assets so eligible pages visibly change with the text while consecutive pages in the same place share a coherent base scene.

#### Included Scope

- Treat the upper-right counter as 1-based pages 1–49.
- Preserve the existing presentation on excluded pages 3, 11, 16, 31, 33, 34, and 43–49.
- For every other page, select a text-appropriate location plate and apply a distinct page variant using character presence, prop focus, light level, CCTV noise, silhouette exposure, or supernatural interference.
- Reuse coherent base plates for guard room, CCTV surveillance, basement search, guard-room haunting, whiteout apparition, morning aftermath, and final CCTV loop.
- Keep the dialogue panel readable, retain exploration gameplay layers/fallbacks, and preload all integrated images.
- Add page mapping, raster metadata/file checks, renderer selection checks, excluded-page checks, and build inclusion tests.

#### Excluded Scope

- Further changes to Chapter 1 controls or escape gameplay.
- Any Chapter 2 or Chapter 3 code or asset changes.
- Changes to story text, page order, excluded-page list, or accessibility controls.

#### Done When

- All 36 eligible pages have a deterministic scene variant and all 13 excluded pages retain their prior backdrop behavior.
- Shared location plates remain visually coherent while adjacent eligible pages visibly differ.
- New assets are 960×540 PNGs with no text/watermark and render behind the existing dialogue panel.
- Loading failure preserves the existing procedural/top-view fallback.
- Typecheck, all tests, build, diff check, and one independent Terra asset review pass.

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

### Task

Chapter 3 외계 가족 구출 NPC 에셋 생성 및 통합

### Goal

Chapter 3 가족 구출 단계를 기존 우주선 연구실 배경으로 전환하고, 임시 도형으로 표시되는 외계 아버지·어머니·누나를 영수와 혈연관계가 느껴지는 단정하고 댄디한 탑뷰 픽셀 아트 NPC로 교체한다.

### Context

- 관련 기능: `src/features/chapter3/client/MemoryReconstructionGame.ts`, `shared/rescueLogic.ts`
- 현재 구출 대상은 원·사각형·이름표 Canvas fallback으로만 표시된다.
- 기존 인간 가족 아내·아들·딸 에셋은 기억 재구성 가족이며 외계 가족과 별개의 인물이다.

### Included Scope

- 외계 아버지·어머니·누나 각 64×80 RGBA 단일 프레임 탑뷰 픽셀 아트 PNG 생성
- 아버지·어머니는 인간 기준 50대 후반 외관, 누나는 40대 후반 외관으로 표현
- 영수와 공유하는 외계 종족 특징과 혈연 인상, 네이비·회색 계열 미래식 스마트 캐주얼 평상복 적용
- 구출 단계 이미지 로딩·선택·nearest-neighbor 렌더링과 기존 도형 fallback 통합
- 구출 단계 배경과 이동 충돌 맵을 기존 `chapter03-spaceship-lab.png`·`SPACESHIP_MAP`으로 전환
- 우주선 열린 바닥에 가족 3명과 영수 spawn을 재배치하고 모든 상호작용 도달성 검증
- 설정 상수, 래스터 메타데이터·알파 경계·발 기준선·맵 경계·충돌·상호작용 도달성 테스트

### Excluded Scope

- 기존 인간 가족 아내·큰아들·작은딸 에셋 및 위치 변경
- 영수 스프라이트, 원본 배경 이미지, 추억 오브젝트와 기록 보관소 에셋 변경
- 구출 순서·대사·상호작용 반경과 Chapter 3 진행 로직 변경
- 방향별 걷기 애니메이션 또는 신규 디자인 토큰 추가

### Constraints

- `AGENTS.md`, `DESIGN.md`, `$two-agent-harness`, `imagegen` 절차를 따른다.
- 각 결과물은 64×80 8-bit RGBA PNG, 투명 배경, 보이는 발 기준선 y=76 이하를 사용한다.
- 외계 종족성은 청회색 피부·큰 짙은 눈·높은 광대 등 절제된 특징으로 표현하고 괴물형 과장은 피한다.
- 우주복·제복이 아닌 셔츠·재킷·슬랙스 계열 평상복을 사용하며 글자·로고·소품·무기는 포함하지 않는다.
- 로딩 실패 시 기존 원·사각형·이름표 fallback을 유지한다.
- 모든 생성·수정·재검증 반복은 작업당 최대 2회이며, 이후 미완료 시 보고하고 진행 여부를 확인한다.

### Done When

- [ ] 외계 아버지·어머니·누나가 구출 좌표에 픽셀 아트 NPC로 표시된다.
- [ ] 구출 단계가 기존 우주선 연구실 배경·충돌 구조에서 시작되고 세 가족이 열린 바닥에 자연스럽게 배치된다.
- [ ] 세 인물의 연령·혈연·외계 종족 특징과 댄디한 평상복 설정이 구분되면서 일관된다.
- [ ] 모든 보이는 실루엣이 캔버스·맵 경계와 충돌물을 침범하지 않고 상호작용 가능하다.
- [ ] 이미지 실패 시 기존 도형 fallback과 이름표가 유지된다.
- [ ] 필수 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

The active Chapter 1 asset request uses a small set of coherent 960×540 story plates rather than 36 unrelated images. A deterministic 1-based page map will combine each plate with per-page lighting, focus, scanline, silhouette, and interference parameters so every eligible page changes while excluded pages preserve the current renderer. Chapter 2/3 and the completed control/escape logic are out of scope.

> 메인 에이전트 소유 영역입니다. 구현 전에 이해한 목표, 범위와 완료 조건을 기록합니다.

`BRIEF_ASSET.md` 자산 lane에서 외계 아버지·어머니·누나의 64×80 투명 탑뷰 픽셀 아트 NPC를 생성한다. 영수보다 실제로 연장자지만 인간 기준 50대 후반처럼 보이는 부모와 40대 후반 누나로 설정하며, 공유된 절제된 외계 특징과 네이비·회색 스마트 캐주얼로 혈연성과 단정한 인상을 만든다. 구출 단계는 기존 우주선 연구실 배경과 충돌 맵으로 전환하고 영수와 세 가족을 열린 바닥에 재배치한다. 발 기준선 렌더링, 실패 fallback, 실제 알파 경계, 맵·충돌·상호작용 도달성을 검증한다.

## Agent Questions

Resolved 2026-08-10: the developer approved shared location backgrounds with per-page scene variations instead of a unique standalone image for every eligible page.

> 메인 에이전트 소유 영역입니다. 개발자의 판단이 필요한 질문과 확인 상태를 기록합니다.

해결됨. 2026-08-10 사용자가 권장 연령·혈연 특징·댄디한 미래식 평상복 설정으로 외계 가족을 생성하고, 구출 장면은 기존 우주선 연구실 배경을 재사용해 가족을 적절한 열린 바닥에 배치하도록 확인했다.

## Developer Decisions

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

- 2026-08-09: 사용자가 제공한 노년 경비원 캐릭터 이미지를 영수의 얼굴, 헤어스타일, 체형과 연령감의 주 참조로 사용한다. 손전등·무전기·커피·가족사진 소품은 스프라이트에 포함하지 않는다.
- 2026-08-09: 참고 이미지의 마른 노년 체형을 유지하기 위해 초기의 실루엣 약 26px 폭보다 시각적 일치를 우선한다. 최종 폭은 앞·뒤 18px, 좌·우 14px로 하되 960×540 맵 합성으로 가독성을 검증한다.
- 2026-08-09: 확정한 영수 스프라이트는 여러 챕터에서 사용할 공통 에셋으로 `src/assets/`에 보관한다.
- 2026-08-10: 원본 64×80 프레임은 유지하고 Chapter 3 게임 표시 크기를 48×60으로 확대한다. 충돌 영역은 기존 26×26을 유지한다.
- 2026-08-10: 재구성 가족과 작별한 뒤 누나와 대화하는 장면의 배경은 작고 소박한 우주선 내 영수 개인실로 설정한다.
- 2026-08-10: 영수 스프라이트는 Chapter 3에서 원본 프레임과 동일한 64×80 크기로 표시한다. 충돌·상호작용 크기는 26×26을 유지한다.
- 2026-08-10: Chapter 2 배경은 지하 경비실, 외계 어린 시절 방, 우주선 홀로그램 기록실, 우주선 전망실의 네 종류로 구성한다.
- 2026-08-10: 검증 에이전트는 `gpt-5.6-terra`로 고정하고, 모든 반복 작업은 최대 2회 후 사용자에게 계속 진행할지 확인한다.
- 2026-08-10: Chapter 2·3의 오브젝트 충돌 영역은 중심을 유지한 채 가로·세로를 90%로 축소한다.
- 2026-08-10: Chapter 2·3 상호작용 오브젝트는 배경과 같은 탑다운 픽셀 아트 에셋으로 교체하고, 작은 오브젝트는 투명 스프라이트 시트로 관리한다.
- 2026-08-10: 재구성 가족은 우주복·제복이 아닌 평상복을 입는다. 큰아들은 12–14세, 작은딸은 7–9세로 처음 생성안보다 어리게 표현한다.

## Agent Result

### Active Chapter 1 scene-variant result (2026-08-10)

- Added three coherent 960x540 RGB story plates for CCTV anomaly, guard-room haunting, and whiteout apparition, while reusing the existing guard-room and basement plates.
- Added a deterministic 1-based scene map covering all 36 eligible pages; pages 3, 11, 16, 31, 33, 34, and 43-49 retain the prior renderer.
- Added per-page tint, focus, scanline, signal-tear, and silhouette treatments clipped above the dialogue panel, with existing image-load fallbacks preserved.
- Added raster metadata, exact exclusion/count, renderer-selection, and fallback-facing regression coverage.
- Browser-checked Chapter 1 entry, E/Enter/click guidance, page counter, and page 2 top-view exploration; corrected the remaining stale Z label in `src/main.ts`.
- Validation passed: typecheck; 63 test files / 285 tests; production build; `git diff --check` (line-ending warnings only).
- Independent Terra review passed after addressing its P2/P3 findings: the escape-control label now matches movement/jump/crawl/restart behavior, and tests now cover distinct treatment tuples plus all generated-plate load-failure fallbacks.

> 메인 에이전트 소유 영역입니다. 구현 결과, 검사 결과, 리뷰 대응과 남은 위험을 기록합니다.

- 내장 `imagegen` 모드로 영수와 기존 인간 가족 NPC를 스타일 참조해 외계 아버지·어머니·누나를 각각 생성했다. 부모는 인간 기준 50대 후반, 누나는 40대 후반으로 보이게 설정했고, 청회색 피부·큰 짙은 눈·높은 광대와 네이비·회색 스마트 캐주얼로 혈연성과 댄디한 인상을 통일했다. 우주복·제복·무기·소품은 포함하지 않았다.
- 크로마키 제거 후 각 결과를 64×80 8-bit RGBA, 보이는 발 하단 y=76으로 정규화했다. 최종 알파는 `{0,255}`만 사용하고 투명 픽셀 RGB는 `(0,0,0)`, 불투명 팔레트는 아버지 29색·어머니 30색·누나 29색으로 제한해 halo 없는 단단한 픽셀 가장자리를 만들었다.
- 최종 에셋은 `alien-family-father.png`, `alien-family-mother.png`, `alien-family-sister.png`이며 알파 경계는 각각 `[21,4,43,76]`, `[21,4,42,76]`, `[22,4,42,76]`이다. SHA-256은 각각 `bd25668937905d55adff6e40d75a52b5885fe7011fcf4cbaa9cdb92ae4898f09`, `cf35465dbc00b7194153579dcc28921884e1ff1f2ae3a63dcfc2ae37bcbf1d71`, `ab0c65570b6e2599cca2b1f37bbdd4a8656294db847b01a5332ec41028c16f01`로 고정했다.
- 구출 단계는 기존 `chapter03-spaceship-lab.png`와 `SPACESHIP_MAP`을 사용하도록 전환했다. 정전 종료 시 영수를 유효한 우주선 입구 spawn으로 옮기고, 외계 누나 `(260,300)`, 아버지 `(520,260)`, 어머니 `(830,290)`를 좌·중앙·우측 열린 바닥에 배치했다.
- `alienFamilyNpcSprite.ts`에 연령·종족 특징·복장 설정, 에셋 경로, 64×80 native draw와 y=76 발 anchor를 정의했다. 이미지가 없거나 규격이 다르면 기존 원·사각형 fallback과 이름표가 유지되며, 구출 대화 중에도 해당 NPC가 우주선 배경에 표시된다.
- 실제 알파 실루엣은 아버지 `x509–531,y204–276`, 어머니 `x819–840,y234–306`, 누나 `x250–270,y244–316`으로 모두 우주선 맵 안에 있고 충돌물을 침범하지 않는다. 4px BFS로 우주선 spawn에서 세 상호작용 반경까지 도달 가능함을 검증했고, 실제 좌표 합성본으로 크기·배치·배경 조화를 확인했다.
- Terra 독립 리뷰에서 반투명 antialias fringe와 draw/fallback 실행 테스트 누락을 지적했다. 알파 이진화·팔레트 제한·투명 RGB 정리와 실제 렌더러 단위 테스트로 해결했고, 같은 리뷰어의 재검증에서 두 P2 해결 및 새 차단 문제 없음이 확인됐다.
- 최종 검사: `npm run typecheck`, `npm run test`(60개 파일·273개 테스트), `npm run build`, `git diff --check` 모두 통과했다.
- 남은 위험: 브라우저 런타임이 없어 실제 플레이 화면의 Canvas 합성과 이름표 가독성은 직접 조작 확인하지 못했다. 대신 최종 PNG, 실제 960×540 우주선 좌표 합성, 알파·draw geometry·충돌·도달성을 검증했다.

## Developer Final Check

> 개발자 소유 영역입니다. 실제 동작과 변경사항을 확인한 뒤 결과를 기록하고 상태를 `ACCEPTED`로 변경합니다.



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
