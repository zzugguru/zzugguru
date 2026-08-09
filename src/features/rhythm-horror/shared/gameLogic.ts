export const BPM = 120;
export const BEAT_MS = 60_000 / BPM;
export const INPUT_WINDOW_MS = 185;
export const LEAD_IN_BEATS = 4;
export const DURATION_BEATS = 120;

export type RhythmAction = 'hide' | 'move';
export type RhythmPhase = 'light' | 'dark';
export type Judgement = 'perfect' | 'good' | 'wrong' | 'miss';

export interface BeatNote {
  id: number;
  timeMs: number;
  beatInBar: 1 | 2 | 3 | 4;
  phase: RhythmPhase;
  expectedAction: RhythmAction;
  hidden: boolean;
}

export interface ActionResult {
  judgement: Judgement;
  note: BeatNote | null;
  deltaMs: number | null;
}

export function phaseForBeat(beatInBar: number): RhythmPhase {
  return beatInBar === 1 || beatInBar === 2 ? 'light' : 'dark';
}

export function isHiddenBeat(id: number): boolean {
  if (id < 48) return false;
  if (id < 88) return id % 8 === 5;
  return id % 8 === 1 || id % 8 === 5;
}

export function buildBeatChart(): BeatNote[] {
  return Array.from({ length: DURATION_BEATS }, (_, id) => {
    const beatInBar = ((id % 4) + 1) as 1 | 2 | 3 | 4;
    const phase = phaseForBeat(beatInBar);
    return {
      id,
      timeMs: (id + LEAD_IN_BEATS) * BEAT_MS,
      beatInBar,
      phase,
      expectedAction: phase === 'light' ? 'hide' : 'move',
      hidden: isHiddenBeat(id),
    };
  });
}

export function judgeAction(
  notes: readonly BeatNote[],
  resolvedIds: ReadonlySet<number>,
  action: RhythmAction,
  timeMs: number,
): ActionResult {
  let closest: BeatNote | null = null;
  let closestDelta = Number.POSITIVE_INFINITY;

  for (const note of notes) {
    if (resolvedIds.has(note.id)) continue;
    const delta = Math.abs(note.timeMs - timeMs);
    if (delta < closestDelta) {
      closest = note;
      closestDelta = delta;
    }
  }

  if (!closest || closestDelta > INPUT_WINDOW_MS) {
    return { judgement: 'miss', note: null, deltaMs: null };
  }

  if (closest.expectedAction !== action) {
    return { judgement: 'wrong', note: closest, deltaMs: closestDelta };
  }

  return {
    judgement: closestDelta <= 85 ? 'perfect' : 'good',
    note: closest,
    deltaMs: closestDelta,
  };
}

export function overdueNotes(
  notes: readonly BeatNote[],
  resolvedIds: ReadonlySet<number>,
  timeMs: number,
): BeatNote[] {
  return notes.filter((note) => !resolvedIds.has(note.id) && timeMs - note.timeMs > INPUT_WINDOW_MS);
}

export function scoreFor(judgement: Judgement, combo: number): number {
  if (judgement === 'miss' || judgement === 'wrong') return 0;
  const base = judgement === 'perfect' ? 900 : 520;
  return base + Math.min(combo, 40) * 12;
}
