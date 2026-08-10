# Current Logic Work Brief

이 파일은 로직 작업 전용 요청, 질문, 결정과 결과를 공유하는 단일 창구입니다. 에셋 작업은 `BRIEF_ASSET.md`에서 독립적으로 관리합니다.

## Status

`REVIEW`

상태 흐름: `DRAFT` → `READY` → `IN_PROGRESS` → `REVIEW` → `ACCEPTED`

## Developer Request

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

### Task

Chapter 2 가족사진 중복 렌더링 제거

### Goal

경비실 배경에 이미 그려진 가족사진 위에 가족사진 스프라이트가 다시 표시되는 문제를 제거하고, 배경 사진 자체를 상호작용 대상으로 사용한다.

### Context

- 관련 기능: `src/features/chapter2/client/MapScene.ts`, `cctvRoomScene.ts`
- 경비실 배경 탁자 위에 가족사진이 이미 포함되어 있다.
- 현재 `family-photo` 스프라이트가 같은 위치에 추가 렌더링되어 사진 안에 사진이 겹쳐 보인다.

### Included Scope

- 가족사진 오브젝트의 스프라이트와 fallback 도형 렌더링 생략
- 배경 사진 위치를 기준으로 `가족사진` 이름과 완료 상태 유지
- 기존 `Z : 액자 보기` 프롬프트와 상호작용 유지
- 다른 오브젝트 렌더링 회귀 테스트

### Excluded Scope

- 배경 이미지 및 스프라이트 시트 변경
- 다른 Chapter 2 오브젝트 렌더링 변경
- 상호작용 좌표·반경, 충돌, 대사와 장면 흐름 변경
- Chapter 1·3 변경

### Constraints

- `AGENTS.md`, `DESIGN.md`와 `$two-agent-harness` 절차를 따른다.
- 렌더링 생략 여부와 라벨 위치를 분리해 배경 속 오브젝트도 상호작용 대상으로 재사용할 수 있게 한다.
- 모든 수정·재검증 반복은 작업당 최대 2회이며, 이후 미완료 시 보고하고 진행 여부를 확인한다.

### Done When

- [ ] 가족사진 스프라이트와 fallback 도형이 렌더링되지 않는다.
- [ ] 배경 사진 아래 이름, 완료 표시와 행동 프롬프트는 유지된다.
- [ ] 다른 9개 오브젝트의 에셋·fallback 렌더링은 유지된다.
- [ ] 필수 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

> 메인 에이전트 소유 영역입니다. 구현 전에 이해한 목표, 범위와 완료 조건을 기록합니다.

로직 세션은 `BRIEF.md`만 사용한다. 가족사진 정의에 배경 포함 오브젝트임을 나타내는 렌더링 생략 옵션을 적용해 스프라이트와 fallback 사각형을 모두 그리지 않는다. 기존 visual 위치는 상시 이름 배치에 사용하고 상호작용 로직은 변경하지 않는다.

## Agent Questions

> 메인 에이전트 소유 영역입니다. 개발자의 판단이 필요한 질문과 확인 상태를 기록합니다.

없음. 사용자가 가족사진 중복 문제의 수정을 요청했다.

## Developer Decisions

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

- 2026-08-10: 로직 작업은 `BRIEF.md`, 에셋 작업은 `BRIEF_ASSET.md`를 사용하며 별도 세션의 메인 에이전트가 각각 오케스트레이션한다.
- 2026-08-10: 각 세션은 자체 구현 에이전트와 Terra 검증 에이전트로 two-agent harness를 수행하고 상대 brief 및 담당 파일을 수정하지 않는다.

## Agent Result

> 메인 에이전트 소유 영역입니다. 구현 결과, 검사 결과, 리뷰 대응과 남은 위험을 기록합니다.

- `MapObjectDefinition.renderMarker`와 공통 `shouldRenderObjectMarker` 판정을 추가했다. 값이 명시적으로 `false`이면 스프라이트 렌더링과 fallback 사각형을 모두 건너뛴다.
- 경비실 `family-photo-frame`에만 `renderMarker: false`를 적용해 배경에 이미 포함된 가족사진 위의 중복 사진을 제거했다. 다른 9개 오브젝트는 기본값으로 기존 렌더링을 유지한다.
- 가족사진의 visual 좌표는 라벨 배치에 계속 사용하므로 `가족사진`, `· 완료`, `Z : 액자 보기`와 기존 상호작용 좌표·반경·메시지는 유지된다.
- 실제 `family-photo` visual을 가진 테스트 객체가 sprite/fallback 공통 판정에서 제외되고, 기본 visual 객체는 렌더링되는지 검증한다. 라벨과 상호작용 유지도 함께 확인한다.
- 로직과 에셋 작업을 분리했다. 로직 세션은 `BRIEF.md`, 별도 자산 세션은 `BRIEF_ASSET.md`를 사용하며 각 세션이 자체 메인 오케스트레이터와 Terra 리뷰어를 운영한다. `AGENTS.md`와 `$two-agent-harness`에 선택 brief 및 파일 소유권 규칙을 반영했고 스킬 검증을 통과했다.
- Terra 독립 리뷰의 이미지-backed sprite 누락 테스트 지적을 첫 수정 반복에서 해결했으며 재검증을 통과했다.
- 최종 검사 결과: `npm run typecheck`, `npm run test`(165/165), `npm run build`, `git diff --check` 모두 통과했다.
- 남은 위험: 브라우저 실행 환경이 없어 실제 합성 화면은 확인하지 못했다. 두 세션의 파일 소유권은 절차 규칙이며 파일시스템 권한으로 강제되지는 않는다.

## Developer Final Check

> 개발자 소유 영역입니다. 실제 동작과 변경사항을 확인한 뒤 결과를 기록하고 상태를 `ACCEPTED`로 변경합니다.



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
