# Current Work Brief

이 파일은 현재 작업의 요청, 질문, 결정과 결과를 공유하는 단일 창구입니다. 작업마다 새 파일을 만들지 않고 현재 작업 영역을 재사용합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

상태 흐름: `DRAFT` → `READY` → `IN_PROGRESS` → `REVIEW` → `ACCEPTED`

## Developer Request

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

### Task

Chapter 1 일반 경비복 탑뷰 영수와 인터랙티브 스토리 연출

### Goal

`src/assets/yeongsu-alien-suit-sprites.png`의 4방향 프레임 구조와 김영수의 정체성을 기준으로 일반 경비원 복장의 Chapter 1 전용 스프라이트를 만들고, Chapter 2·3의 탑뷰 쯔꾸르식 공간 연출을 Chapter 1 스토리에 섞는다. 기존 흰 화면 구간은 리듬 입력 없이 이동과 상호작용에 반응하는 짧은 시퀀스로 바꾼다.

### Context

- 관련 기능: `src/features/chapter1/`
- 프레임·체형 기준: `src/assets/yeongsu-alien-suit-sprites.png` (256×80, 64×80 프레임 4개)
- 외형 기준: `src/assets/yeongsu-guard.png`
- 참고 구현: `src/features/chapter2/client/MapScene.ts`, `src/features/chapter2/client/playerSprite.ts`, `src/features/chapter3/client/MemoryReconstructionGame.ts`, `src/features/chapter3/client/playerSprite.ts`
- 현재 Chapter 1 스토리는 대부분 정지 배경과 대사 패널로 진행되며 whiteout 3개 비트도 단순한 광원 배경이다.

### Included Scope

- 기존 256×80 4방향 레이아웃을 보존한 일반 경비복 영수 스프라이트 생성
- Chapter 1 전용 결과물은 `src/features/chapter1/assets/`에 보관
- 주요 장면 사이에 2~3개의 짧은 탑뷰 탐색·상호작용 구간 삽입
- 경비실·CCTV·지하 계단실 장면에 탑뷰 맵 합성, 영수 방향 프레임, 오브젝트 강조와 공간 연출 적용
- whiteout 구간에 이동 입력과 상호작용으로 진행되는 비리듬형 저항 시퀀스 적용
- 키보드와 화면 포인터 입력, live region 안내, 로딩 fallback 유지
- 스프라이트 실제 포맷·크기·프레임별 알파 경계, 표시 배율·발 기준선·이동 극값·상호작용 도달성 테스트
- 브라우저에서 대표 탑뷰 장면과 whiteout 상호작용 시각·동작 확인

### Excluded Scope

- `src/assets/yeongsu-alien-suit-sprites.png` 공통 원본 덮어쓰기
- Chapter 2·3 코드·에셋·게임 흐름 변경
- Chapter 1 대사 내용과 옥상 탈출 규칙 변경
- 리듬 게임 복원, 전투, 인벤토리, 분기 엔딩 추가
- 음원 편집·재작곡

### Constraints

- 관련 `AGENTS.md`, `DESIGN.md`, `src/assets/README.md` 규칙을 따른다.
- 일반 경비복은 짙은 남색 모자·재킷·바지와 검은 신발로 통일하고, 기존 노년 체형·회색 머리·4방향 포즈를 유지한다.
- 각 프레임은 64×80 셀에 들어가며 투명 배경, 보이는 발 기준선과 정수 배율을 사용한다.
- 탑뷰 구간은 짧고 목표가 명확해야 하며 기존 클릭·Z·Enter 스토리 진행을 불필요하게 막지 않는다.
- whiteout 인터랙션은 리듬 타이밍을 요구하지 않고 방향 이동과 한 번의 상호작용만 사용한다.
- 대사 패널과 HUD 가독성, 로딩 실패 fallback, 기존 스토리→추격→옥상 흐름을 보존한다.

### Done When

- [ ] Chapter 1 전용 일반 경비복 영수 시트가 256×80 RGBA와 4×64×80 레이아웃을 만족한다.
- [ ] 경비실·CCTV·지하 계단실의 대표 비트가 탑뷰 맵과 방향성 영수 스프라이트를 합성한다.
- [ ] 최소 2개의 짧은 탐색 목표가 이동·포인터·상호작용으로 완료되고 다음 스토리 비트로 이어진다.
- [ ] whiteout는 이동에 시각적으로 반응하고 목표 도달 후 Z·Enter·클릭으로 완료된다.
- [ ] 대사 내용, fallback, 스토리→추격→옥상 흐름이 유지된다.
- [ ] 에셋·렌더 좌표·상호작용 경계 테스트, 브라우저 확인, 필수 프로젝트 검사와 독립 리뷰가 완료된다.

## Agent Understanding

> 메인 에이전트 소유 영역입니다. 구현 전에 이해한 목표, 범위와 완료 조건을 기록합니다.

기존 요청의 개발자 확인 피드백으로 Chapter 1 기능 폴더에 남아 있는 주인공 영수의 캐릭터 에셋을 공통 에셋 폴더 `src/assets/`로 이동한다. 현재 사용 중인 네 방향 일반 경비원 스프라이트 `chapter01-yeongsu-guard-sprites.png`와 레거시 리듬 게임의 `yeongsu-guard-sprite.png`를 바이너리 변경 없이 옮기고 모든 import·메타데이터·에셋 검증 테스트를 새 경로로 갱신한다. 이미 공통 폴더에 같은 파일이 있는 `src/features/chapter1/assets/yeongsu-guard.png` 중복본은 공통 원본만 남긴다. 캐릭터가 아닌 Chapter 3의 `yeongsu-quarters.png` 배경은 기능 전용 에셋으로 유지한다.

## Agent Questions

> 메인 에이전트 소유 영역입니다. 개발자의 판단이 필요한 질문과 확인 상태를 기록합니다.

없음. “주인공 영수와 관련된 에셋”은 영수 캐릭터의 초상·전신·방향 스프라이트를 뜻하는 것으로 해석하며, 영수의 방처럼 이름에만 영수가 포함된 장소·배경 에셋은 제외한다. 파일명은 기존 참조와 에셋 정체성을 보존하기 위해 그대로 유지하고 경로만 공통 폴더로 변경한다.

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

## Agent Result

> 메인 에이전트 소유 영역입니다. 구현 결과, 검사 결과, 리뷰 대응과 남은 위험을 기록합니다.

Chapter 1 기능 폴더의 영수 캐릭터 에셋을 공통 폴더로 정리했다. `chapter01-yeongsu-guard-sprites.png`와 `yeongsu-guard-sprite.png`를 `src/assets/`로 이동하고, 스토리·옥상 탈출·레거시 리듬 게임의 import와 `CHAPTER01_TOPVIEW_SPRITE.path`를 공통 경로로 갱신했다. 추적돼 있던 레거시 전신 스프라이트는 이동 전후 Git blob hash가 일치한다. 기능 폴더의 `yeongsu-guard.png`는 공통 원본과 SHA-256이 완전히 같은 중복본임을 확인한 뒤 제거했으며 공통 원본은 그대로 보존했다. `yeongsu-quarters.png`는 캐릭터가 아닌 Chapter 3 배경이므로 이동하지 않았다.

회귀 테스트는 세 공통 영수 에셋의 존재, 이전 Chapter 1 경로의 부재, 새 탑뷰 메타데이터 경로, 실제 PNG 크기·RGBA·프레임 알파 경계를 검증한다. `npm run typecheck`, `npm run test`(40개 파일·194개 테스트), `npm run build`, `git diff --check`가 모두 통과했고 프로덕션 번들에 새 공통 탑뷰 스프라이트가 포함됨을 확인했다. 독립 검토자는 stale import, 누락 파일, 잘못 이동된 배경이나 동작 회귀를 발견하지 않았다. 이동 전 untracked였던 탑뷰 시트는 이전 Git blob과 직접 비교할 수 없지만 파일 이동 외 바이너리 가공은 하지 않았고, 이전 검토와 같은 18,893 bytes 및 실제 PNG 검증을 유지한다. 레거시 리듬 게임은 현재 앱 진입점에서 사용되지 않아 해당 전신 스프라이트가 프로덕션 번들에는 포함되지 않지만 import 해석과 해당 게임 테스트는 통과한다.

## Developer Final Check

> 개발자 소유 영역입니다. 실제 동작과 변경사항을 확인한 뒤 결과를 기록하고 상태를 `ACCEPTED`로 변경합니다.



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
