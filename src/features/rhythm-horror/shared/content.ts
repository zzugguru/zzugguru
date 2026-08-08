import type { Note } from './gameLogic';

export const DURATION_MS = 112_000;
export const LEAD_IN_MS = 2_500;

export interface StoryCue {
  timeMs: number;
  chapter: string;
  message: string;
  camera: string;
  threat: number;
}

export const STORY_CUES: StoryCue[] = [
  { timeMs: 0, chapter: '야간 근무', message: '화면을 지켜보는 것. 그것으로 충분했다.', camera: '정문', threat: 0 },
  { timeMs: 18_000, chapter: '첫째 날', message: '오전 3시 33분. 17번 기둥 옆에 누군가 서 있다.', camera: '지하주차장', threat: 1 },
  { timeMs: 38_000, chapter: '셋째 날', message: '여자는 걸어온 적이 없었다. 그런데 더 가까워졌다.', camera: '1층 로비', threat: 2 },
  { timeMs: 58_000, chapter: '다섯째 날', message: '박 씨에게는 보이지 않는다.', camera: '경비실 앞', threat: 3 },
  { timeMs: 78_000, chapter: '여섯째 날', message: '3:32. 오늘은 오지 않는 모양이다.', camera: 'CCTV 12', threat: 4 },
  { timeMs: 91_000, chapter: '오전 3시 33분', message: '의자 바로 뒤에 여자가 서 있었다.', camera: '경비실 내부', threat: 5 },
  { timeMs: 104_000, chapter: '치직', message: '그 얼굴은 아내가 아니었다.', camera: '신호 없음', threat: 6 },
];

function buildChart(): Note[] {
  const notes: Note[] = [];
  let id = 0;
  for (let timeMs = LEAD_IN_MS; timeMs < DURATION_MS - 1_500; timeMs += timeMs < 58_000 ? 750 : 600) {
    const beat = id;
    notes.push({ id: id++, timeMs, lane: (beat * 3 + Math.floor(beat / 4)) % 4 });
    if (timeMs > 38_000 && beat % 4 === 2) notes.push({ id: id++, timeMs, lane: (beat + 2) % 4 });
    if (timeMs > 91_000 && beat % 3 === 0) notes.push({ id: id++, timeMs: timeMs + 300, lane: (beat + 1) % 4 });
  }
  return notes.sort((a, b) => a.timeMs - b.timeMs || a.lane - b.lane);
}

export const CHART = buildChart();

export function cueAt(timeMs: number): StoryCue {
  let current = STORY_CUES[0];
  for (const cue of STORY_CUES) {
    if (cue.timeMs > timeMs) break;
    current = cue;
  }
  return current;
}
