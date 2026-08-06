export const LANES = 4;
export const PERFECT_WINDOW_MS = 75;
export const GOOD_WINDOW_MS = 145;
export const MISS_WINDOW_MS = 180;

export type Judgement = 'perfect' | 'good' | 'miss';

export interface Note {
  id: number;
  timeMs: number;
  lane: number;
}

export interface NoteResult {
  judgement: Judgement;
  note: Note | null;
  deltaMs: number | null;
}

export function judgeLane(notes: readonly Note[], hitIds: ReadonlySet<number>, lane: number, timeMs: number): NoteResult {
  let closest: Note | null = null;
  let closestDelta = Number.POSITIVE_INFINITY;

  for (const note of notes) {
    if (note.lane !== lane || hitIds.has(note.id)) continue;
    const delta = Math.abs(note.timeMs - timeMs);
    if (delta < closestDelta) {
      closest = note;
      closestDelta = delta;
    }
  }

  if (!closest || closestDelta > GOOD_WINDOW_MS) return { judgement: 'miss', note: null, deltaMs: null };
  return {
    judgement: closestDelta <= PERFECT_WINDOW_MS ? 'perfect' : 'good',
    note: closest,
    deltaMs: closestDelta,
  };
}

export function overdueNotes(notes: readonly Note[], resolvedIds: ReadonlySet<number>, timeMs: number): Note[] {
  return notes.filter((note) => !resolvedIds.has(note.id) && timeMs - note.timeMs > MISS_WINDOW_MS);
}

export function scoreFor(judgement: Judgement, combo: number): number {
  if (judgement === 'miss') return 0;
  const base = judgement === 'perfect' ? 1000 : 550;
  return base + Math.min(combo, 50) * 10;
}
