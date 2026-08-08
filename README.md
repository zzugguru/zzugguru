# ZZUGGURU Web Game

ZZUGGURU의 스토리를 브라우저에서 플레이할 수 있도록 만든 2D 픽셀아트 게임 프로토타입입니다. 현재 Chapter01의 리듬 호러와 Chapter03의 기억 재구성·이별·에필로그 흐름을 제공합니다.

## 실행 방법

Node.js 18 이상이 필요합니다.

```powershell
npm install
npm run dev
```

PowerShell 실행 정책 때문에 `npm` 명령이 차단되면 다음처럼 실행하세요.

```powershell
npm.cmd install
npm.cmd run dev
```

터미널에 표시된 주소를 브라우저에서 엽니다. 기본 주소는 `http://localhost:5173`입니다. 서버를 종료하려면 실행 중인 터미널에서 `Ctrl+C`를 누르세요.

## 구현된 챕터

### Chapter01 · 리듬 호러

- `D`, `F`, `J`, `K` 키를 사용하는 리듬 입력
- 체력과 실패 판정
- 일시 정지와 재시작

### Chapter03 · 마지막 이별

- 방향키 또는 `WASD`로 이동하는 탑다운 맵
- 가족 기억 재구성 전 우주선 연구 구역
- 기억 장치 상호작용과 가족별 기억 연결 미니게임
- 재구성 성공 후 네 명 가족사진이 있는 기억 속 거실
- 가족과 관련된 추억 물건 수집·정리
- 기억을 붙잡거나 기록하고 놓아주는 이별 과정
- 기록 보관소, 고향별, 경비일지와 프롤로그형 마무리 연출

## 조작법

### Chapter01

| 조작 | 기능 |
| --- | --- |
| `D`, `F`, `J`, `K` | 리듬 입력 |
| `Enter` | 시작 또는 다시 시작 |
| `Esc` | 일시 정지 |

### Chapter03

| 조작 | 기능 |
| --- | --- |
| 방향키 / `WASD` | 캐릭터 이동 |
| `E` / `Enter` | 장치·물건·문 상호작용 |
| `1`, `2`, `3` | 기억 대상 또는 선택지 선택 |
| 화면 버튼 | 모바일 및 마우스 조작 |

## 개발 명령

```powershell
npm run typecheck
npm run test
npm run build
npm run preview
```

- `typecheck`: TypeScript 타입 검사
- `test`: Vitest 자동 테스트
- `build`: 프로덕션 번들 생성
- `preview`: 빌드 결과 로컬 미리보기

UI를 변경했다면 `DESIGN.md`의 디자인 토큰과 접근성 규칙을 확인하세요. `DESIGN.md` 자체를 변경한 경우에는 `npm run design:lint`도 실행합니다.

## 프로젝트 구조

```text
src/
  features/
    rhythm-horror/           Chapter01 리듬 게임
    memory-reconstruction/   Chapter03 맵·기억·이별·에필로그
  platform/                  공용 브라우저 게임 기반
  shared/                    여러 기능에서 공유하는 코드
Story/                       챕터 원문
DESIGN.md                    디자인 토큰과 UI 규칙
```

각 기능의 클라이언트 코드, 공유 로직, 테스트와 에셋은 해당 `src/features/<feature-name>/` 안에서 함께 관리합니다.

## 검증

변경 사항을 완료하기 전에 다음 명령이 모두 통과해야 합니다.

```powershell
npm run typecheck
npm run test
npm run build
git diff --check
```
