import { describe, expect, it } from 'vitest';
import { advanceEpilogue, ARCHIVE_DOOR, ARCHIVE_RECORDS, createEpilogue, enterArchive, JOURNAL_LINES, MONTAGE, moveEpiloguePlayer, placeArchiveRecord, startEpilogue, type EpilogueState } from './epilogueLogic';
import { createLettingGo } from './lettingGoLogic';

describe('playable Chapter03 epilogue', () => {
  it('starts only after the letting-go puzzle completes', () => {
    const initial = createEpilogue();
    expect(startEpilogue(initial, createLettingGo())).toBe(initial);
    expect(startEpilogue(initial, { ...createLettingGo(), completed: true }).phase).toBe('silence');
  });

  it('places records in any order once and gates the montage', () => {
    let state = advanceEpilogue(startEpilogue(createEpilogue(), { ...createLettingGo(), completed: true }));
    expect(state.phase).toBe('corridor');
    state = enterArchive(state, { x: ARCHIVE_DOOR.x - 13, y: ARCHIVE_DOOR.y - 13 });
    expect(state.phase).toBe('archive');
    for (const record of [...ARCHIVE_RECORDS].reverse()) state = placeArchiveRecord(state, { x: record.x - 13, y: record.y - 13 });
    expect(state.phase).toBe('archive-complete');
    expect(state.placed).toHaveLength(5);
    expect(placeArchiveRecord(state, { x: 0, y: 0 })).toBe(state);
    expect(advanceEpilogue(state).phase).toBe('montage');
  });

  it('rejects distant and duplicate archive placement', () => {
    let state = advanceEpilogue(startEpilogue(createEpilogue(), { ...createLettingGo(), completed: true }));
    expect(enterArchive(state, { x: 80, y: 260 })).toBe(state);
    state = enterArchive(state, { x: ARCHIVE_DOOR.x - 13, y: ARCHIVE_DOOR.y - 13 });
    expect(placeArchiveRecord(state, { x: 400, y: 250 })).toBe(state);
    const record = ARCHIVE_RECORDS[0];
    state = placeArchiveRecord(state, { x: record.x - 13, y: record.y - 13 });
    expect(state.placed).toEqual(['photo']);
    expect(placeArchiveRecord(state, { x: record.x - 13, y: record.y - 13 })).toBe(state);
  });

  it('moves through the corridor with visible-map bounds', () => {
    expect(moveEpiloguePlayer({ x: 48, y: 100 }, -20, -20)).toEqual({ x: 48, y: 100 });
    expect(moveEpiloguePlayer({ x: 886, y: 466 }, 20, 20)).toEqual({ x: 886, y: 466 });
    expect(moveEpiloguePlayer({ x: 100, y: 100 }, 20, 30)).toEqual({ x: 120, y: 130 });
  });

  it('advances exactly through montage, homeworld, journal, credits and postcredits', () => {
    let state: EpilogueState = { ...createEpilogue(), phase: 'montage', message: MONTAGE[0] };
    for (let i = 0; i < MONTAGE.length; i += 1) state = advanceEpilogue(state);
    expect(state.phase).toBe('homeworld');
    state = advanceEpilogue(state);
    expect(state.phase).toBe('journal');
    for (let i = 0; i < JOURNAL_LINES.length; i += 1) state = advanceEpilogue(state);
    expect(state.phase).toBe('credits');
    state = advanceEpilogue(state);
    expect(state.phase).toBe('postcredits');
    state = advanceEpilogue(state); state = advanceEpilogue(state); state = advanceEpilogue(state);
    expect(state.phase).toBe('complete');
    expect(state.message).toBe('영수: “지금 가.”');
  });
});
