import { BEAT_MS, buildBeatChart } from './gameLogic';

export const CHART = buildBeatChart();
export const DURATION_MS = (CHART.length + 4) * BEAT_MS;

export interface StoryCue {
  timeMs: number;
  chapter: string;
  message: string;
  location: string;
  threatLevel: number;
}

export const STORY_CUES: StoryCue[] = [
  { timeMs: 0, chapter: '야간 근무', message: '화면을 지켜보는 것. 그것으로 충분했다.', location: '경비실', threatLevel: 0 },
  { timeMs: 10_000, chapter: '오전 3시 33분', message: '지하주차장 17번 기둥 옆에 누군가 서 있다.', location: '지하 복도', threatLevel: 1 },
  { timeMs: 22_000, chapter: '조금씩 가까이', message: '여자는 걸어온 적이 없다. 그런데 매일 더 가까워졌다.', location: '1층 로비', threatLevel: 2 },
  { timeMs: 28_000, chapter: '가족사진', message: '영수는 가족사진을 품에 안았다. 아내의 미소와 닮아 있었다.', location: '경비실 CCTV', threatLevel: 2 },
  { timeMs: 34_000, chapter: '삭제된 박자', message: '소리가 비어도 발걸음의 간격을 기억해야 한다.', location: '기계실', threatLevel: 3 },
  { timeMs: 46_000, chapter: '의자 바로 뒤', message: '화면 속 영수의 뒤에 여자가 서 있었다.', location: '경비실 앞', threatLevel: 4 },
  { timeMs: 56_000, chapter: '그 얼굴은', message: '아내가 아니었다. 어둠이 복도 끝에서 달려온다.', location: 'B1 주차장', threatLevel: 5 },
];

export function cueAt(timeMs: number): StoryCue {
  let current = STORY_CUES[0];
  for (const cue of STORY_CUES) {
    if (cue.timeMs > timeMs) break;
    current = cue;
  }
  return current;
}
