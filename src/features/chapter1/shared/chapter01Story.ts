export type Chapter01Backdrop =
  | 'title'
  | 'guard-room'
  | 'cctv'
  | 'basement'
  | 'whiteout'
  | 'morning'
  | 'epilogue';

export interface Chapter01StoryBeat {
  backdrop: Chapter01Backdrop;
  speaker: string;
  text: string;
  timestamp?: string;
}

/** Story/Chapter01.md의 사건 순서를 캔버스 진행용 장면으로 구성한 데이터. */
export const CHAPTER01_STORY: readonly Chapter01StoryBeat[] = [
  { backdrop: 'title', speaker: '', text: '새벽 3시 33분' },
  { backdrop: 'guard-room', speaker: '', text: '김영수는 매일 밤 열한 시가 되기 전에 낡은 아파트 경비실에 도착했다.' },
  { backdrop: 'guard-room', speaker: '', text: '작은 책상과 전기포트, 오래된 선풍기. 벽 한쪽에는 열두 개의 CCTV 화면이 빼곡했다.' },
  { backdrop: 'guard-room', speaker: '', text: '영수는 책상 위에 젊은 아내와 두 아이가 웃고 있는 낡은 가족사진을 세웠다.' },
  { backdrop: 'guard-room', speaker: '영수', text: '나 왔어.' },
  { backdrop: 'guard-room', speaker: '', text: '아내와 두 아이를 먼저 떠나보낸 뒤, 영수에게 야간 근무는 혼자가 아닌 유일한 시간이었다.' },
  { backdrop: 'guard-room', speaker: '', text: '새벽 한 시. 그는 경비일지에 “특이 사항 없음”이라고 적고 식어가는 커피를 들었다.' },
  { backdrop: 'cctv', speaker: '', text: '지하주차장 화면이 한 차례 흔들렸다. 치직.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '', text: '잡음이 사라진 화면 속, 긴 머리의 여자가 기둥 옆에서 카메라를 등지고 서 있었다.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '영수', text: '이 시간에 웬 아가씨야?', timestamp: '03:33' },
  { backdrop: 'basement', speaker: '', text: '영수는 무전기와 손전등을 챙겨 어두운 지하주차장으로 내려갔다.' },
  { backdrop: 'basement', speaker: '', text: '자동 센서등이 그의 걸음에 맞춰 하나씩 켜졌다. 탁. 탁. 탁.' },
  { backdrop: 'basement', speaker: '영수', text: '학생?' },
  { backdrop: 'basement', speaker: '', text: '기둥 옆에는 아무도 없었다. 발자국도, 떨어진 물건도 남아 있지 않았다.' },
  { backdrop: 'basement', speaker: '영수', text: '아이고, 깜짝이야.' },
  { backdrop: 'cctv', speaker: '', text: '녹화 영상 속 여자는 영수가 나간 지 정확히 삼십 초 뒤, 잡음과 함께 사라졌다.', timestamp: '03:33' },
  { backdrop: 'guard-room', speaker: '영수', text: '기계가 오래돼서 그래.' },
  { backdrop: 'guard-room', speaker: '', text: '경비일지에는 “신원 미상의 여성 발견. 현장 확인 결과 이상 없음.”이 추가되었다.' },
  { backdrop: 'cctv', speaker: '', text: '둘째 날에는 지하 엘리베이터 앞. 셋째 날에는 1층 로비.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '', text: '넷째 날에는 정문 안쪽 복도. 다섯째 날에는 경비실 앞 출입문.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '', text: '여자는 걷지 않았다. 매일 잡음이 사라진 자리에 나타나 조금씩 경비실에 가까워졌다.', timestamp: '03:33' },
  { backdrop: 'guard-room', speaker: '영수', text: '요 며칠 이상한 아가씨가 계속 돌아다녀.' },
  { backdrop: 'guard-room', speaker: '박 씨', text: '어디요? 아무도 없는데?' },
  { backdrop: 'guard-room', speaker: '박 씨', text: '김 선생님, 요즘 잠을 못 주무신 것 아니에요?' },
  { backdrop: 'guard-room', speaker: '영수', text: '내가 헛것 볼 나이는 아직 아니야.' },
  { backdrop: 'guard-room', speaker: '', text: '그날부터 영수는 여자가 나타난 장소와 시간을 경비일지에 빠짐없이 기록했다.' },
  { backdrop: 'guard-room', speaker: '', text: '여섯째 날 밤. 새벽 세 시가 가까워질수록 영수의 마음은 불편해졌다.', timestamp: '03:32' },
  { backdrop: 'guard-room', speaker: '영수', text: '오늘도 오려나 보다.' },
  { backdrop: 'guard-room', speaker: '영수', text: '이상하게 낯설지가 않아.' },
  { backdrop: 'cctv', speaker: '', text: '3시 33분. 모든 화면이 동시에 흔들렸다. 치직.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '', text: '주차장에도, 엘리베이터에도, 로비와 정문에도 여자는 없었다.', timestamp: '03:33' },
  { backdrop: 'guard-room', speaker: '영수', text: '오늘은 안 왔네.' },
  { backdrop: 'cctv', speaker: '', text: '그때 경비실 내부를 비추는 가장 작은 화면에서 무언가 움직였다.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '', text: '모니터 앞에 앉은 영수의 바로 뒤에 여자가 서 있었다.', timestamp: '03:33' },
  { backdrop: 'guard-room', speaker: '', text: '종이컵과 커피 방울이 바닥에 닿지 않은 채 공중에 멈췄다.' },
  { backdrop: 'guard-room', speaker: '', text: '형광등이 깜빡이고, 천장 너머에서 낮고 무거운 진동음이 울렸다.' },
  { backdrop: 'cctv', speaker: '', text: '긴 머리 사이로 보인 미소는 젊은 시절 아내의 표정과 닮아 있었다.', timestamp: '03:33' },
  { backdrop: 'cctv', speaker: '영수', text: '당신이야?', timestamp: '03:33' },
  { backdrop: 'guard-room', speaker: '영수', text: '나를 데리러 온 거야?' },
  { backdrop: 'whiteout', speaker: '', text: '모든 CCTV가 하얗게 변했다. 영수의 몸이 의자에서 천천히 떠올랐다.' },
  { backdrop: 'whiteout', speaker: '', text: '여자의 피부가 화면 오류처럼 갈라지고, 그 안에서 길고 가느다란 회색 형체가 드러났다.' },
  { backdrop: 'whiteout', speaker: '', text: '영수가 무언가를 말하려는 순간, 경비실의 모든 불이 꺼졌다.' },
  { backdrop: 'morning', speaker: '', text: '다음 날 아침. 안에서 잠긴 경비실을 열었지만 김영수는 어디에도 없었다.' },
  { backdrop: 'morning', speaker: '', text: '바닥에는 식은 커피가 흘러 있었고, 책상에는 금이 간 가족사진과 경비일지만 남아 있었다.' },
  { backdrop: 'morning', speaker: '', text: '마지막 장에는 “오늘은 여자가 보이지 않는다. 아마 이제 오지 않는 모양이다.”라고 적혀 있었다.' },
  { backdrop: 'morning', speaker: '', text: 'CCTV는 오전 3시 33분부터 정확히 7분 동안 녹화되지 않았다.' },
  { backdrop: 'epilogue', speaker: '', text: '그날 밤, 아무도 없는 경비실에서 CCTV가 저절로 켜졌다.', timestamp: '03:33' },
  { backdrop: 'epilogue', speaker: '', text: '지하주차장 화면 가운데 낡은 경비복을 입은 김영수가 카메라를 등지고 서 있었다.', timestamp: '03:33' },
  { backdrop: 'epilogue', speaker: '영수', text: '여기가…… 어디야.', timestamp: '03:33' },
] as const;

export interface StoryProgress {
  index: number;
  complete: boolean;
}

export function advanceChapter01Story(currentIndex: number, total: number): StoryProgress {
  if (total <= 0 || currentIndex >= total - 1) {
    return { index: Math.max(0, total - 1), complete: true };
  }

  return { index: currentIndex + 1, complete: false };
}
