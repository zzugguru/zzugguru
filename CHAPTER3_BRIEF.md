# Chapter 3 보완 작업 브리프

이 파일은 Chapter3(`src/features/chapter3/`) 보완 작업의 요청·질문·결정·결과를 공유하는 단일 창구다. 작업마다 새 파일을 만들지 않고 이 파일을 재사용한다. 섹션 소유권 규칙은 루트 `CLAUDE.md`의 "Feature delivery workflow"를 따른다.

- 개발자 소유: `Developer Request`, `Developer Decisions`, `Developer Final Check`
- 에이전트 소유: `Agent Understanding`, `Agent Questions`, `Agent Result`

## Developer Request

상태: READY

```markdown
# 비트 4 · 마지막 저녁식탁 환상 인식 장면

## 목표
비트3(구출)이 끝난 뒤, 영수 자신도 자기 기억 속 거짓 행복(식탁)에 갇혀 있었다는 것을 스스로
깨닫는 이 챕터의 감정적 클라이맥스를 구현한다. 선택지 없는 고정 컷씬으로 만든다(Developer Decisions).

## 범위
- 비트3의 구출 완료 페이드가 끝나면 letting-go로 곧장 가지 않고, 원작 237~333줄 기반 대사
  시퀀스(약 18줄: 평화로운 식탁 → "밖에 있는 사람들은?" 등 위화감 단서 → "당신은 내가 행복하길
  바라?" 결정적 질문 → 음식이 검은 입자로 변하는 균열 → 아이들의 만류 → 영수의 대답)가
  대화창 오버레이(비트1~3과 동일한 `dialogueBox`)로 순서대로 진행된다.
- 대사 후반(균열 시작 지점)부터 `danger` 색조 오버레이가 옅게 깔려 "거짓이 깨지는" 느낌을 준다.
- 마지막 줄 이후 짧은 페이드를 거쳐 기존 letting-go 진입 로직으로 연결된다.
- 새 상태는 새 shared 파일(`shared/dinnerIllusionLogic.ts`)로 관리.

## 제외 범위
- 위화감 단서를 플레이어가 직접 찾는 상호작용형 (Developer Decisions에서 고정 컷씬으로 확정)
- 새 배경 이미지 (기존 기억의 방 배경 + `danger` 색 오버레이로 표현, 새 에셋 없음)
- letting-go 이후 실제 재구성 데이터 삭제 등 후속 로직 변경 (letting-go는 이미 원작 353~419줄을
  커버하고 있으므로 이번 비트는 그 앞의 빈틈만 채운다)

## 완료 조건
- 비트3 완료 직후 letting-go 대신 식탁 환상 장면이 먼저 뜬다.
- 약 18줄의 대사가 순서대로 진행되며, 균열 시작 지점부터 danger 색조가 나타난다.
- 마지막 줄 이후 페이드를 거쳐 기존 letting-go 화면으로 정상 진입한다(퀴즈 정상 동작).
- 키보드(E/Enter)와 클릭 양쪽으로 진행 가능, live region 안내 문구 갱신.
- `npm run typecheck && npm run test && npm run build && npm run design:lint && git diff --check` 통과.
- 기존 화면(map/warning/blackout/rescue/playing/awakening/result/letting-go/epilogue)의 동작이 회귀하지 않는다.
```

## Agent Understanding

- 비트3의 구출 완료 페이드가 끝나는 지점(`loop()`의 `rescueOutro==='fade' && elapsed>=420` 블록)을 "letting-go 직행"에서 "dinner 화면 진입"으로 바꾼다. 비트3 때 만든 지점을 다시 수정하는 것이라 add-only 예외로 명시하고 리뷰에서 확인받는다 — 지금까지 비트2→3에서도 동일한 성격의 예외가 있었던 지점이라 패턴이 이미 검증되어 있다.
- `dinnerIllusionLogic.ts`는 `wardenWarningLogic.ts`와 동일한 `{step, seen}` 패턴을 그대로 재사용한다. 대사가 많아지는(약 18줄) 것 외에는 새 개념이 없다.
- 렌더링은 비트1~3에서 만든 `renderDialogueBox`를 그대로 재사용하고, `DINNER_CRACK_STEP` 인덱스부터 `danger`(#fb7185) 색 오버레이를 얇게 덧씌운다. 새 배경 이미지나 DESIGN.md 토큰 추가는 없다(기존 `danger` 토큰 재사용).
- 원작 대사를 20자 내외의 짧은 줄로 쪼개 `dialogueBox.ts`의 줄바꿈 미지원 한계를 피한다(비트1~3에서 이미 검증된 길이 기준).
- 이번 비트로 4개 스토리 비트가 모두 완료되며, letting-go/에필로그까지 Chapter3 전체 흐름이 처음부터 끝까지 이어진다.

## Agent Questions

_(판단이 필요한 질문을 에이전트가 여기에 기록한다.)_

## Developer Decisions

- 2026-08-10: 비트2의 "새 에셋 필요 여부" 결정(2b) — 에이전트가 실제 그림 에셋을 제작할 수 없다는 실질적 제약에 따라 색·조명 오버레이로 정전·변모를 표현하기로 함. 실제 아트 에셋이 준비되면 이후 교체 가능.
- 2026-08-10: 새로고침/챕터 재진입 시 진행 상태(퍼즐, 수집, letting-go, 에필로그, 그리고 비트1의 "경고를 봤다" 플래그 포함) 전부를 초기화하는 기존 동작을 유지한다. 영구 저장(localStorage 등)은 지금 도입하지 않고, 필요해지면 게임 전체에 대한 별도 저장 기능으로 나중에 설계한다. 비트1의 경고 상태도 이 규칙을 따라 세션(인스턴스) 범위로만 관리한다.
- 2026-08-10: Chapter3 보완의 대상 스토리 비트 4개를 모두 승인함 — (1) 장치 작동 전 누나의 경고 컷씬, (2) 우주선 정전·기억세계 변모 연출, (3) 외계 가족 구출 서브시퀀스, (4) 마지막 저녁식탁 환상 인식 장면. 세부 착수 순서는 미정이며, 다음 `Developer Request`에서 지정한다. 상세는 `src/features/chapter3/CLAUDE.md`의 "스토리 갭 백로그" 참고.
- 2026-08-10: "기존 코드 수정 없이 추가" 규칙은 "신규 파일 + 최소 연결 훅 허용" 수준으로 확정. 상세 정의는 루트 `CLAUDE.md`의 "Add-only 개발 원칙" 참고.
- 2026-08-10: Chapter3 보완 작업은 이 파일을 Codex `BRIEF.md`에 준하는 단일 창구로 사용하기로 결정.
- 2026-08-10: 비트3은 letting-go 진입을 위한 **필수** 진행 조건으로 확정(스킵 불가). 구출 게임 방식은 **맵 탐색형**으로 확정(추억 물건 수집과 동일한 패턴 — 지점에 접근해 E키로 상호작용).
- 2026-08-10: 비트2 브라우저 실동작은 개발자가 로컬에서 직접 확인 완료. 이후 세션에서 dev 서버 환경 불안정 문제는 별도로 재확인하지 않아도 됨.
- 2026-08-10: 비트4(식탁 인식 장면)는 위화감 단서를 직접 찾는 상호작용형 대신 **고정 컷씬**으로 확정.

## Agent Result

_(비트1·2·3의 상세 구현 기록은 git 이력(커밋 `d3c285b`, `dd0d13c`, `4e97349`, `f078abe`)과 `markdown/chapter3-development-log.md`에 남아 있다. 요약은 아래 Completed Work Log 참고.)_

**구현 목표**: 비트 4 · 마지막 저녁식탁 환상 인식 장면 (완료 조건은 위 Developer Request 참고)

**변경 파일**
- 신규: `src/features/chapter3/shared/dinnerIllusionLogic.ts`, `dinnerIllusionLogic.test.ts`
- 수정(최소 연결 훅 + 예외 1건): `src/features/chapter3/client/MemoryReconstructionGame.ts` — `Screen`에 `'dinner'` 추가, `dinner`/`dinnerFadeStartedAt` 필드, `mount()`의 `epilogueNext` 클릭 핸들러/`onKeyDown`/`interact()`/`onCanvasClick`/`render()`/`syncControls()`에 각각 새 분기 1개씩, 신규 `drawDinner()`(대화창 재사용 + 균열 색조 오버레이 + 페이드). **add-only 예외 1건**(리뷰에서 검토·승인): `loop()`의 구출-페이드-완료 목적지를 "letting-go 직행"에서 "dinner 화면 진입"으로 변경하고, dinner의 페이드 완료 블록이 원래의 `createLettingGo()` + `letting-go` 전환을 대신 수행하도록 새로 추가.

**주요 설계 결정**
- `dinnerIllusionLogic.ts`는 `wardenWarningLogic.ts`/`blackoutLogic.ts`와 동일한 `{step, seen}` 패턴을 그대로 재사용 — 새 개념 도입 없음. 대사는 원작 237~333줄(약 21줄)을 20자 내외로 쪼갠 것.
- `DINNER_CRACK_STEP`(=14, "아내는 대답하지 못했다..." 줄)부터 DESIGN.md의 기존 `danger` 색 토큰(#fb7185)을 옅게 덧씌워 균열을 표현 — 새 배경 이미지·새 DESIGN.md 토큰 없음(Developer Decisions에서 고정 컷씬으로 확정한 것과 함께, 새 아트 에셋을 만들 수 없다는 기존 제약을 재사용).
- 렌더링 순서는 `drawBlackout()`과 동일하게 배경→플레이어→오버레이→대화창→페이드 순서를 지켜, 비트3에서 있었던 "이펙트가 대화창에 가려 안 보이는" 버그가 재현되지 않도록 함.

**실행한 검사와 결과**
- `npm run typecheck` 통과
- `npm run test` — 169/170 통과(신규 4건 포함). 실패 1건은 `mapLogic.test.ts`의 무관한 기존 실패(diff에 `mapLogic.ts`/`mapAssetManifest.ts` 변경 없음으로 재확인, 비트1~3 때와 동일한 실패).
- `npm run build`, `npm run design:lint`(신규 컴포넌트 없음, 기존 경고 2건만), `git diff --check` 통과.

**리뷰 서브에이전트 결과**: 읽기 전용 Explore 서브에이전트가 diff, add-only 예외(rescue→dinner 리다이렉트)의 안전성·단일 실행 보장, `drawDinner()`의 렌더링 순서(균열 오버레이가 대화창을 가리지 않는지), `DINNER_CRACK_STEP` 범위, 테스트 커버리지, 기존 화면 회귀 여부를 독립 검토. 지적 사항 없음. **승인(APPROVE)**.

**브라우저 실동작 확인**: 챕터3 진입까지는 스크린샷으로 정상 로드를 확인했으나, 이후 자동화 브라우저 탭이 이번에도 `document.hidden=true`로 백그라운드 스로틀링되어(비트2·3과 동일한 환경 문제) 프레임이 전혀 진행되지 않아 dinner 화면까지 도달하지 못했다. 재사용한 핵심 메커니즘(대화창 오버레이, 페이드, 색 오버레이)은 비트1~3에서 이미 브라우저로 검증된 패턴이라 위험은 낮다고 판단하며, 로컬 `npm run dev`로 구출 완료 이후 식탁 장면을 확인해 줄 것을 요청한다.

**남은 위험 / 확인하지 못한 영역**
- dinner 화면의 실제 대사 흐름, 균열 색조의 체감 강도, 페이드 타이밍은 브라우저로 확인되지 않았다.
- `MemoryReconstructionGame` 클래스 자체의 통합 테스트는 기존에도 없어 이번에도 커버되지 않는다.

## Developer Final Check

- 2026-08-10: 비트4(마지막 저녁식탁 환상 인식 장면)를 로컬 `npm run dev`에서 직접 확인함. 게임 자체는 추가 보완이 필요해 보이나, 이번 라운드 결과는 커밋하고 이후 별도로 보완 작업을 이어가기로 함.

## Completed Work Log

- 2026-08-10: 비트 1(장치 작동 전 누나의 경고 컷씬) 구현 완료. typecheck/test/build/git diff --check 통과, 리뷰 서브에이전트 승인.
- 2026-08-10: 비트 1 연출을 전체 암전 텍스트 방식에서 대화창 오버레이 + 페이드 전환 방식으로 재작업. 2차 리뷰 승인, 브라우저 실동작 확인 완료.
- 2026-08-10: 비트 1 대화창을 Chapter2 대화창(`dialogueBox.ts`)과 동일한 시각 형식으로 재구현(신규 `shared/dialogueBox.ts` 복제). 검사·브라우저 확인 완료.
- 2026-08-10: 비트 2(우주선 정전·기억세계 변모 연출) 구현 완료, 커밋 `4e97349`. typecheck/test/build/design:lint/git diff --check 통과, 리뷰 서브에이전트 승인. 브라우저 실동작 확인은 dev 서버 환경 불안정으로 부분적으로만 완료 — 개발자의 로컬 실동작 확인 권장.
- 2026-08-10: `chapter3-development-log.md` 신규 작성 및 관련 문서 상태 동기화, 커밋 `4e97349`에 포함.
- 2026-08-10: 비트 3(외계 가족 구출 서브시퀀스) 구현 완료. typecheck/test/build/design:lint/git diff --check 통과, 리뷰 서브에이전트 승인(낮은 심각도 지적 1건 반영). 브라우저 실동작은 로컬 확인 요청 — 개발자 확인 대기 중.
- 2026-08-10: 비트 3 구출 연출 드라마화(배경 밝기 변화, 구출 순간 빛 링 이펙트, 여운 대사 한 줄). 검사·리뷰 통과(낮은 심각도 지적 1건 반영).
- 2026-08-10: 구출 링 이펙트가 대화창에 가려 안 보이던 버그 수정(좌표를 대화창 밖 고정 위치로 이동). typecheck/build/git diff --check 통과. 비트3 전체(구출 서브시퀀스+드라마화+버그수정) 커밋 `f078abe`.
- 2026-08-10: 비트 4(마지막 저녁식탁 환상 인식 장면) 구현 완료 — 고정 컷씬으로 확정, 원작 237~333줄 기반 약 21줄 대사 + danger 색조 균열 연출. typecheck/build/design:lint/git diff --check 통과, test 169/170(무관한 기존 mapLogic 실패 1건 제외 전부 통과), 리뷰 서브에이전트 승인(지적 사항 없음). 개발자가 로컬에서 실동작 확인 완료. 커밋 `3a339d1`. 이로써 2026-08-10 확정 4개 비트(경고·정전변모·구출·식탁인식) 전부 완료. 개발자 피드백: 게임 전반에 추가 보완이 필요해 보임 — 다음 라운드에서 이어감.
