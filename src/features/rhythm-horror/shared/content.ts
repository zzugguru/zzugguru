import { BEAT_MS, DURATION_BEATS, buildBeatChart } from './gameLogic';

export const CHART = buildBeatChart();
export const DURATION_MS = (DURATION_BEATS + 4) * BEAT_MS;

export interface StoryCue {
  timeMs: number;
  label: string;
  message: string;
  danger: boolean;
}

export const STORY_CUES: StoryCue[] = [
  { timeMs: 0, label: 'B1 · 지하 복도', message: '빛에서는 멈추고, 어둠에서는 움직여라.', danger: false },
  { timeMs: 10_000, label: '접근 신호', message: '발소리는 보이지 않는 거리까지 알려준다.', danger: false },
  { timeMs: 20_000, label: '창고 구역', message: '철제 상자는 천천히 몸을 낮춰 지나가라.', danger: false },
  { timeMs: 30_000, label: '신호 결손', message: '하나의 박자가 사라졌다. 간격은 그대로다.', danger: true },
  { timeMs: 42_000, label: '기계실', message: '화면보다 몸이 기억한 박자를 믿어라.', danger: true },
  { timeMs: 50_000, label: '규칙 붕괴', message: '놈이 빛 속에서도 움직인다. 비상문까지 달려!', danger: true },
];

export function cueAt(timeMs: number): StoryCue {
  let current = STORY_CUES[0];
  for (const cue of STORY_CUES) {
    if (cue.timeMs > timeMs) break;
    current = cue;
  }
  return current;
}
