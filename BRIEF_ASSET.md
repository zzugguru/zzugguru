# Current Asset Work Brief

이 파일은 에셋 작업 전용 계약입니다. 로직은 `BRIEF.md`의 별도 세션이 담당합니다.

## Status

`READY_FOR_DEVELOPER_CHECK`

## Developer Request

### Task

Chapter 2 CCTV 채널용 2D 기억 화면 3장 생성

### Goal

Chapter 2 CCTV 콘솔의 빈 화면을 대체할 서사적 2D 픽셀 아트 장면을 제작해 누나가 점점 영수에게 가까워지는 긴장과 기억 각성을 전달한다.

### Included Scope

- `imagegen`으로 600×340 CCTV 장면 PNG 3장 생성
- 지하주차장, 1층 로비, 경비실 앞의 동일 인물·시간대·카메라 시점 일관성 유지
- 기존 Chapter 2 경비실 배경과 어울리는 어둡고 저채도인 2D 픽셀 아트
- 실제 파일 메타데이터·치수·색상 모드와 장면 식별성 검증
- 게임 통합은 로직 세션의 Asset Contract에 맞는 파일 제공까지 담당

### Scene Specification

1. `cctv-parking-memory.png`: 지하주차장 17번 기둥 주변, 화면 먼 곳에 인간 여성처럼 보이는 누나의 흐릿한 전신 실루엣. 얼굴 식별 불가, 가장 약한 신호 왜곡.
2. `cctv-lobby-memory.png`: 새벽의 1층 로비, 유리문과 엘리베이터 사이에 조금 가까워진 같은 인물. 자세와 의상 정체성 유지, 중간 수준의 신호 왜곡.
3. `cctv-guard-door-memory.png`: 경비실 앞 출입문 바로 너머에 다가온 같은 인물. 얼굴은 그림자·노이즈로 식별 불가, 가장 강한 신호 왜곡과 긴장감.

### Constraints

- 정확히 600×340 RGB 또는 RGBA PNG.
- 화면 속 글자, 채널 번호, 시간, 프레임, 스캔라인 UI를 굽지 않는다. 로직 세션이 Canvas로 덧씌운다.
- 특정 영화·게임·작가의 식별 가능한 스타일을 모방하지 않는다.
- 세 장의 카메라는 고정 CCTV 구도이며 여성의 실루엣·옷·머리 길이가 동일해야 한다.
- 유혈, 노골적 괴물 외형, 점프 스케어 얼굴 클로즈업은 사용하지 않는다.
- 생성·수정·재검증 반복은 최대 2회다.

### Excluded Scope

- TypeScript·CSS·게임 로직 수정
- 기존 배경·캐릭터·오브젝트 에셋 변경
- 이미지 안에 UI 텍스트 삽입

### Done When

- [ ] 세 PNG가 `src/features/chapter2/assets/`의 지정 파일명으로 존재한다.
- [ ] 각 파일은 정확히 600×340이고 장면과 접근 거리가 뚜렷하게 구분된다.
- [ ] 동일 인물과 CCTV 시점·팔레트의 연속성이 유지된다.
- [ ] 인물 얼굴은 식별되지 않고 1→3 순서로 긴장과 신호 왜곡이 증가한다.
- [ ] Terra 독립 에셋 리뷰와 필수 검사가 완료된다.

## Agent Understanding

에셋 세션은 내장 `imagegen`으로 지하주차장→1층 로비→경비실 앞의 연속되는 CCTV 기억 장면 3장을 생성하고 지정 경로에 저장한다. 같은 여성은 어깨 아래 길이의 검은 머리, 무릎 아래까지 오는 짙은 회청색 코트와 어두운 바지라는 고정 실루엣을 유지한다. 장면별로 인물의 화면 점유율과 환경 왜곡만 점진적으로 높이고 얼굴은 끝까지 식별되지 않게 한다. 이미지에 UI·텍스트·채널·시간·프레임·스캔라인을 굽지 않으며 정확한 600×340 RGB/RGBA PNG와 장면 식별성을 검증한다. TypeScript·CSS·`BRIEF.md`·기존 에셋은 수정하지 않는다.

## Agent Questions

없음. 사용자가 추천 장면 구성으로 진행하도록 승인했다.

## Developer Decisions

- 2026-08-10: 에셋 생성은 `BRIEF_ASSET.md`의 별도 오케스트레이션 세션이 담당한다.
- 2026-08-10: 3개 장면은 지하주차장→1층 로비→경비실 앞 순서로 누나가 가까워지는 구성을 사용한다.

## Agent Result

- 내장 `imagegen`으로 동일한 성인 여성(어깨 아래 검은 머리, 짙은 회청색 무릎길이 코트, 차콜 바지·어두운 신발)이 등장하는 CCTV 기억 화면 3장을 생성했다. 지하주차장 먼 실루엣→유리문·엘리베이터가 있는 1층 로비의 중거리 인물→경비실 문 앞의 가까운 인물 순으로 접근 거리와 긴장감을 높였다.
- 최종 파일은 `cctv-parking-memory.png`, `cctv-lobby-memory.png`, `cctv-guard-door-memory.png`이며 모두 정확히 600×340, 8-bit RGB, non-interlaced PNG다. 300×170의 56색 제한 팔레트 픽셀 그리드를 정확히 2배 nearest-neighbor 확대한 일관된 2D 픽셀 아트로 정규화했다.
- 신호 왜곡은 UI·스캔라인이 아니라 국소 사각 블록 변위로만 표현했고 1→2→3 순서로 강도를 높였다. 세 장 모두 글자·숫자·채널·시간·UI 프레임·모니터 베젤·스캔라인·자막·워터마크·유혈·괴물 외형·얼굴 클로즈업이 없다.
- SHA-256은 주차장 `d930c1df2a58bfb9629a6cf808e04a58b3564a48987fee8f5dc1c4acef9db33b`, 로비 `1c1d43e9f0cb5b5d916166dfc35ea12bea539ac987ab85f59be934efce2e1f59`, 경비실 앞 `07fe6e47ce47eb4f6183610e8e216edfc72e42cc799ef30cb1b9de134a585a95`다.
- Terra 독립 리뷰가 첫 결과의 부드러운 시네마틱 렌더링과 주차장 인물 식별성을 지적했다. 두 번째이자 마지막 수정 루프에서 제한 팔레트·2배 정수 픽셀 그리드와 주차장 대비 보강을 적용했고, 같은 리뷰어의 재검증에서 두 지적 모두 해결되고 장면·인물·접근·왜곡 연속성 및 금지 UI 부재가 확인됐다.
- 필수 검사: `npm run typecheck`, `npm run test`(62개 파일·293개 테스트), `npm run build`, `git diff --check` 모두 통과했다. TypeScript·CSS·`BRIEF.md`·기존 에셋은 이 에셋 세션에서 수정하지 않았다.
- 남은 위험: 첫 장의 인물은 서사 의도상 작지만, 재검증에서 먼 전신 실루엣과 후속 장면 연속성을 판독 가능한 수준으로 확인했다.

## Developer Final Check



## Completed Work Log

| Date | Task | Branch / PR / Commit | Result |
|---|---|---|---|
