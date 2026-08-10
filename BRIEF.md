# Current Logic Work Brief

이 파일은 로직 작업 전용 요청, 질문, 결정과 결과를 공유하는 단일 창구입니다. 에셋 작업은 `BRIEF_ASSET.md`에서 독립적으로 관리합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

상태 흐름: `DRAFT` → `READY` → `IN_PROGRESS` → `REVIEW` → `ACCEPTED`

## Developer Request

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

### Task

Chapter 3 경고·정전·가족 구출·마지막 저녁 로직 선택 통합

### Goal

기존 Chapter 3의 배경·스프라이트·오브젝트 위치·기록 보관소 렌더링을 그대로 보존하면서, 새로 추가된 경고·정전·가족 구출·마지막 저녁 로직을 현재 `MemoryReconstructionGame` 진행 흐름에 선택적으로 연결한다.

### Context

- 관련 기능: `src/features/chapter3/client/MemoryReconstructionGame.ts`
- 새 로직: `wardenWarningLogic.ts`, `blackoutLogic.ts`, `rescueLogic.ts`, `dinnerIllusionLogic.ts`, `dialogueBox.ts`
- 기존 기억 재구성 완료 후 추억 정리에서 바로 놓아주기로 전환된다.
- 현재 배경·가족 NPC·추억 오브젝트·장치·에필로그 에셋 통합은 유지해야 한다.

### Included Scope

- 장치 최초 상호작용 전 관리자 경고 시퀀스 연결
- 추억 정리 완료 후 정전 시퀀스 연결
- 정전 후 기존 맵에서 외계 가족 3명 구출 흐름 연결
- 구출 완료 후 마지막 저녁 환상 대사와 기존 놓아주기 단계 연결
- E·Enter·화면 클릭·다음 버튼, focus 이동과 live region 안내 통합
- 구출 대상의 맵 경계·충돌 회피·상호작용 도달성 회귀 테스트
- 기존 로직 단위 테스트와 통합 상태 전환 회귀 테스트

### Excluded Scope

- 신규 이미지 생성·수정·import
- 기존 가족·오브젝트·장치·배경·기록 보관소 좌표 또는 렌더링 변경
- 기존 기억 퍼즐 규칙, 놓아주기 선택지와 에필로그 내용 변경
- Chapter 1·2 코드와 에셋 변경

### Constraints

- 관련 `AGENTS.md`, `DESIGN.md`, `$two-agent-harness` 규칙을 따른다.
- 현재 `MemoryReconstructionGame.ts`의 에셋 import, 이미지 로딩, draw geometry와 맵 좌표를 보존한다.
- 새 장면은 기존 배경과 디자인 토큰 기반 Canvas 도형·대사 상자만 사용한다.
- 구출 대상은 플레이어의 26×26 충돌 몸체와 실제 이동 가능 영역을 기준으로 모두 도달 가능해야 한다.
- 기존 퍼즐→추억 정리와 놓아주기→에필로그 양 끝 흐름 및 로딩 fallback을 보존한다.

### Done When

- [ ] 진행 순서가 경고→기억 퍼즐→추억 정리→정전→가족 구출→마지막 저녁→놓아주기→에필로그로 연결된다.
- [ ] 기존 배경·스프라이트·오브젝트·장치·기록 보관소 에셋 코드와 좌표가 변경되지 않는다.
- [ ] 세 구출 대상이 기존 맵에서 충돌물을 피해 상호작용 가능한 위치까지 도달 가능하다.
- [ ] 키보드·포인터·다음 버튼과 focus·live region 안내가 모든 새 상태에서 동작한다.
- [ ] 기존 퍼즐·놓아주기·에필로그와 fallback 동작이 유지된다.
- [ ] 필수 프로젝트 검사와 Terra 독립 리뷰가 완료된다.

## Agent Understanding

> 메인 에이전트 소유 영역입니다. 구현 전에 이해한 목표, 범위와 완료 조건을 기록합니다.

Chapter 3의 현재 에셋 import·로딩·좌표·렌더링은 바꾸지 않고 다섯 신규 shared 모듈을 `MemoryReconstructionGame`에 연결한다. 경고는 장치 최초 작동 전에, 정전은 추억 정리 완료 뒤에, 가족 구출과 마지막 저녁은 놓아주기 전에 순서대로 배치한다. 새 상태의 입력·focus·live region과 세 구출 지점의 실제 이동 도달성을 검증하며 기존 퍼즐·놓아주기·에필로그 양끝 흐름을 보존한다.

## Agent Questions

> 메인 에이전트 소유 영역입니다. 개발자의 판단이 필요한 질문과 확인 상태를 기록합니다.

없음. 사용자가 신규 이미지 에셋 관련 로직을 제외하고 상태·대사·입력 흐름만 적용하도록 명시적으로 승인했다. 구출 대상은 현재 임시 Canvas 도형으로 표시하며 별도 픽셀 아트 교체는 asset lane 후속 작업으로 남긴다.

## Developer Decisions

> 개발자 소유 영역입니다. 에이전트는 명시적인 요청 없이 수정하거나 삭제하지 않습니다.

- 2026-08-10: 로직 작업은 `BRIEF.md`, 에셋 작업은 `BRIEF_ASSET.md`를 사용하며 별도 세션의 메인 에이전트가 각각 오케스트레이션한다.
- 2026-08-10: 각 세션은 자체 구현 에이전트와 Terra 검증 에이전트로 two-agent harness를 수행하고 상대 brief 및 담당 파일을 수정하지 않는다.

## Agent Result

> 메인 에이전트 소유 영역입니다. 구현 결과, 검사 결과, 리뷰 대응과 남은 위험을 기록합니다.

Chapter 3의 기존 배경·영수·가족 NPC·추억 오브젝트·재구성 장치·기록 보관소 import와 좌표·draw geometry를 유지한 채 신규 로직 다섯 모듈을 `MemoryReconstructionGame`에 연결했다. 진행 순서는 장치 앞 관리자 경고→기존 기억 퍼즐→추억 정리→정전→외계 가족 3명 구출→마지막 저녁 환상→기존 놓아주기→에필로그다. E·Enter·Canvas 클릭·공용 다음 버튼, 상태별 focus 이동과 live region 메시지를 새 화면에 연결했다. 신규 이미지는 추가하거나 import하지 않았으며 정전 후에도 기존 `drawMemoryArea()` 에셋 렌더 경로를 유지한다.

구출 대상 3명의 좌표는 26×26 플레이어 몸체, 보이는 스프라이트 여백과 `MEMORY_ROOM_MAP` 충돌 영역을 사용한 4px BFS로 spawn에서 각 상호작용 반경까지 도달 가능함을 검증한다. 실제 `MemoryReconstructionGame` 인스턴스를 가짜 Canvas·컨트롤과 고정 시간으로 구동하는 테스트는 경고 페이드, 퍼즐 성공 복귀, 마지막 추억 수집, 정전 페이드, 세 가족의 순차 대사·해제, 구출 완료 페이드, 저녁 대사·페이드와 놓아주기 도착, focus와 live region을 실행한다. 별도 계약 테스트는 기존 에셋 로딩·가족/오브젝트/에필로그 렌더 경로 보존을 고정한다.

`npm run typecheck`, `npm run test`(57개 파일·261개 테스트), `npm run build`, `git diff --check`가 모두 통과했다. Terra 독립 리뷰의 상태 전환 테스트가 소스 문자열 검사에 머문다는 지적을 실제 인스턴스 시퀀스 테스트로 해결했고, 같은 리뷰어의 재검증에서 해결 확인 및 새 차단 문제 없음 판정을 받았다. 남은 위험은 브라우저 백엔드가 없어 실제 키보드·버튼·Canvas 이벤트 디스패치와 Canvas 레이어 가독성을 런타임에서 확인하지 못한 점이다.

## Developer Final Check

> 개발자 소유 영역입니다. 실제 동작과 변경사항을 확인한 뒤 결과를 기록하고 상태를 `ACCEPTED`로 변경합니다.



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
