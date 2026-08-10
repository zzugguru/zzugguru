---
version: "alpha"
name: "ZZUGGURU"
description: "A provisional dark, focused visual system for the ZZUGGURU web game."
colors:
  primary: "#312E81"
  feedback: "#818CF8"
  danger: "#FB7185"
  background: "#030712"
  surface: "#111827"
  surface-accent: "#312E81"
  border: "#374151"
  text: "#F9FAFB"
  text-muted: "#C7D2FE"
  shadow: "rgb(0 0 0 / 45%)"
typography:
  display:
    fontFamily: "Inter, Pretendard, system-ui, sans-serif"
    fontSize: 38px
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, Pretendard, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "Inter, Pretendard, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  game-canvas:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    width: 960px
  welcome-title:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.display}"
  welcome-message:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body}"
  rhythm-lane:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.feedback}"
  rhythm-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
  contextual-tutorial:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  dialogue-overlay:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  health-meter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  memory-vessel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  memory-vessel-active:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.text}"
  memory-vessel-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
  chapter-menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  game-choice-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  map-control-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  memory-object:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
  letting-go-choice:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  epilogue-progress:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  rooftop-escape-progress:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.feedback}"
  rooftop-escape-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
---

# ZZUGGURU Design System

## Overview

ZZUGGURU의 초기 디자인 방향은 게임 플레이에 집중할 수 있는 어두운 무대와 선명한 정보 계층이다. 현재 값은 시작 화면에서 추출한 임시 기준이며, 게임 장르와 핵심 경험이 확정되면 팀의 검증을 거쳐 발전시킨다.

YAML front matter의 토큰을 디자인 값의 단일 원본으로 취급한다. 본문은 토큰을 선택한 이유와 적용 방법을 설명한다. 코드와 이 문서가 다르면 임의로 한쪽을 맞추지 말고 의도된 변경인지 먼저 확인한다.

## Colors

- `background`는 브라우저 전체 배경에 사용해 게임 화면과 주변 영역을 분리한다.
- `surface`와 `surface-accent`는 게임 캔버스의 어두운 인디고 그라데이션을 구성한다.
- `text`는 제목과 중요한 정보, `text-muted`는 보조 설명에 사용한다.
- `border`는 캔버스와 패널의 경계를 과도하게 강조하지 않는 용도로 사용한다.
- `primary`는 현재 인디고 계열의 핵심 색상이다. 새로운 강조색이나 상태색은 실제 의미와 사용처가 정해진 뒤 추가한다.
- `feedback`은 노트와 체력처럼 즉시 확인해야 하는 플레이 피드백에, `danger`는 낮은 체력과 실패 판정에 사용한다.

텍스트와 배경의 조합은 WCAG AA 대비 기준을 만족해야 한다. 색만으로 성공, 실패, 선택 상태를 전달하지 않는다.

## Typography

- `display`는 시작 화면 제목과 중요한 장면 제목에 제한한다.
- `body`는 화면 설명과 비교적 큰 게임 메시지에 사용한다.
- `ui`는 버튼, HUD, 메뉴처럼 반복되는 인터페이스 텍스트의 기본값이다.
- 한국어와 영문을 함께 표시할 수 있도록 `Inter`, `Pretendard`, 시스템 글꼴 순서의 fallback을 유지한다.

새로운 글자 크기는 기존 계층으로 의도를 표현할 수 없는 경우에만 추가한다.

## Layout

- 기준 게임 캔버스는 16:9 비율의 `960px × 540px`이다.
- 캔버스는 화면이 좁아지면 비율을 유지하면서 컨테이너 너비에 맞춰 축소한다.
- 브라우저 가장자리와 캔버스 사이에는 최소 `spacing.lg`의 여백을 둔다.
- HUD와 조작 요소는 플레이 영역의 핵심 정보를 가리지 않도록 가장자리부터 배치한다.
- 새로운 간격은 임의의 숫자보다 정의된 spacing 토큰을 우선한다.

## Elevation & Depth

기본 캔버스에는 `0 24px 80px rgb(0 0 0 / 45%)` 그림자를 사용해 브라우저 배경에서 게임 영역을 분리한다. 정보 위계를 그림자만으로 표현하지 않으며, 중첩 패널의 elevation 단계는 실제 필요가 생긴 뒤 정의한다.

## Shapes

- 게임 캔버스는 `rounded.lg`를 사용한다.
- 작은 컨트롤은 `rounded.sm` 또는 `rounded.md`를 사용한다.
- 동일한 역할의 컴포넌트에는 동일한 radius를 적용한다.

## Components

- `game-canvas`는 게임 렌더링 영역의 크기, 표면 색상, 경계 형태를 정의한다.
- `welcome-title`은 가장 높은 시각적 위계를 가진 시작 화면 제목이다.
- `welcome-message`는 플레이어에게 다음 행동을 안내하는 보조 문구다.
- `rhythm-lane`은 네 입력 레인과 눌림 상태를, `rhythm-danger`는 실패 판정을, `health-meter`는 현재 실패 위험을 표시한다.
- `contextual-tutorial`은 현재 빛·어둠 상태, 장애물 접근, 엄폐 가능 여부, 추격 상태에 맞는 한 가지 조작만 우선 안내한다. 일반 안내는 `feedback`, 즉시 생존 행동은 `danger`와 명시적 조작 문구를 함께 사용한다.
- `dialogue-overlay`는 대사가 있는 컷씬(예: Chapter03 장치 작동 전 경고 장면)에서 배경 장면과 플레이어를 그대로 보여준 채 하단에 화자 이름과 대사를 표시한다. Chapter02의 대화창과 동일한 형식(테두리 없는 둥근 사각형, 하단 24px 여백 고정 전체 폭, 화자는 흰색 bold, 대사는 흰색 일반체, 우측 하단에 진행 힌트)을 따르며, 마지막 대사 이후에는 짧은 페이드를 거쳐 다음 장면으로 전환한다.
- `memory-vessel`은 Chapter03 기억 재구성 퍼즐의 세 가족 용기를 나타낸다. `feedback`은 연결 완료, `danger`는 불안정과 실패에만 사용하며 텍스트를 함께 표시한다.
- `chapter-menu`는 기존 Chapter01과 새 Chapter03을 보존하면서 진입점을 제공한다. `game-choice-button`은 챕터와 가족 용기 선택에 사용하고 hover, focus, disabled 상태를 구분한다.
- `map-control-button`은 Chapter03 연구 구역의 포인터·터치 이동과 장치 상호작용에 사용하며 키보드 조작과 동일한 기능을 제공한다.
- `memory-object`는 재구성 성공 이후 맵에서 정리할 추억 물건, 진행 HUD, 기억의 빈틈 대화를 표시한다.
- `letting-go-choice`는 추억 정리 완료 후 붙잡기·기록하기·놓아주기 선택과 비게임오버 재선택 피드백을 표시한다.
- `epilogue-progress`는 기록 배치, 몽타주, 고향별, 경비일지와 크레딧 후 장면을 한 단계씩 진행하는 조용한 후일담 UI다.

버튼, HUD, 패널 등 아직 구현되지 않은 컴포넌트는 미리 추측해 정의하지 않는다. 처음 추가할 때 상태와 접근성 요구사항을 함께 정의한다.

## Do's and Don'ts

`rooftop-escape-progress`는 Chapter 01 층별 옥상 탈출 진행도를 표시한다. `rooftop-escape-control`은 키보드와 같은 좌우 이동을 제공하는 캔버스 화면 조작 영역이며, `feedback`은 진행 방향, `danger`는 추격과 피격 상태에만 사용한다.

### Do

- UI를 변경하기 전에 이 파일의 토큰과 적용 원칙을 확인한다.
- 새 토큰에는 값뿐 아니라 의미와 사용 조건을 기록한다.
- hover, focus, active, disabled 상태를 구분하고 키보드 focus를 보이게 한다.
- 시각적으로 판단하기 어려운 변경은 구현 전에 사용자에게 방향 검증을 요청한다.

### Don't

- 기능 내부에 새로운 색상, 간격, radius 값을 이유 없이 직접 추가하지 않는다.
- 코드와 `DESIGN.md`에 같은 토큰을 서로 다른 원본처럼 수동 관리하지 않는다.
- 장식 때문에 게임 정보의 가독성이나 입력 피드백을 약화하지 않는다.
- 아직 정해지지 않은 게임 장르나 분위기를 에이전트가 임의로 확정하지 않는다.
