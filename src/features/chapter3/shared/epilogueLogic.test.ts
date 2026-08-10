import { describe, expect, it } from 'vitest';
import { advanceEpilogue, ARCHIVE_RECORDS, createEpilogue, enterArchive, EPILOGUE_MOVE_BOUNDS, JOURNAL_LINES, MONTAGE, moveEpiloguePlayer, placeArchiveRecord, QUARTERS_SPAWN, startEpilogue, type EpilogueState } from './epilogueLogic';
import { createLettingGo } from './lettingGoLogic';

describe('playable Chapter03 epilogue', () => {
  const reachableArchiveDoor = { x: 786, y: 227 };

  it('starts only after the letting-go puzzle completes', () => {
    const initial = createEpilogue();
    expect(startEpilogue(initial, createLettingGo())).toBe(initial);
    expect(startEpilogue(initial, { ...createLettingGo(), completed: true }).phase).toBe('silence');
  });

  it('places records in any order once and gates the montage', () => {
    let state = advanceEpilogue(startEpilogue(createEpilogue(), { ...createLettingGo(), completed: true }));
    expect(state.phase).toBe('corridor');
    expect(moveEpiloguePlayer(reachableArchiveDoor, 20, 0, 'corridor')).toEqual(reachableArchiveDoor);
    state = enterArchive(state, reachableArchiveDoor);
    expect(state.phase).toBe('archive');
    for (const record of [...ARCHIVE_RECORDS].reverse()) {
      const reachableRecord = { x: record.x - 13, y: record.y - 13 };
      expect(moveEpiloguePlayer(reachableRecord, 0, 0, 'archive')).toEqual(reachableRecord);
      state = placeArchiveRecord(state, reachableRecord);
    }
    expect(state.phase).toBe('archive-complete');
    expect(state.placed).toHaveLength(5);
    expect(placeArchiveRecord(state, { x: 0, y: 0 })).toBe(state);
    expect(advanceEpilogue(state).phase).toBe('montage');
  });

  it('rejects distant and duplicate archive placement', () => {
    let state = advanceEpilogue(startEpilogue(createEpilogue(), { ...createLettingGo(), completed: true }));
    expect(enterArchive(state, { x: 80, y: 260 })).toBe(state);
    state = enterArchive(state, reachableArchiveDoor);
    expect(placeArchiveRecord(state, { x: 400, y: 250 })).toBe(state);
    const record = ARCHIVE_RECORDS[0];
    state = placeArchiveRecord(state, { x: record.x - 13, y: record.y - 13 });
    expect(state.placed).toEqual(['photo']);
    expect(placeArchiveRecord(state, { x: record.x - 13, y: record.y - 13 })).toBe(state);
  });

  it('moves through the corridor with visible-map bounds', () => {
    expect(QUARTERS_SPAWN).toEqual({ x: 480, y: 300 });
    expect(moveEpiloguePlayer({ x: 155, y: 132 }, -20, -20, 'corridor')).toEqual({ x: 155, y: 132 });
    expect(moveEpiloguePlayer({ x: 786, y: 463 }, 20, 20, 'corridor')).toEqual({ x: 786, y: 463 });
    expect(moveEpiloguePlayer({ x: 100, y: 132 }, 20, 30)).toEqual({ x: 120, y: 162 });
    expect(moveEpiloguePlayer({ x: 881, y: 463 }, 20, 20, 'archive')).toEqual({ x: 881, y: 463 });
  });

  it('keeps the alpha-derived sprite footprint inside quarters and archive floors', () => {
    const visibleFootprint = (position: { x: number; y: number }) => ({
      left: position.x - 5,
      top: position.y - 42,
      right: position.x + 31,
      bottom: position.y + 26,
    });
    expect(visibleFootprint({ x: EPILOGUE_MOVE_BOUNDS.corridor.minX, y: EPILOGUE_MOVE_BOUNDS.corridor.minY }))
      .toEqual({ left: 150, top: 90, right: 186, bottom: 158 });
    expect(visibleFootprint({ x: EPILOGUE_MOVE_BOUNDS.corridor.maxX, y: EPILOGUE_MOVE_BOUNDS.corridor.maxY }))
      .toEqual({ left: 781, top: 421, right: 817, bottom: 489 });
    expect(visibleFootprint({ x: EPILOGUE_MOVE_BOUNDS.archive.minX, y: EPILOGUE_MOVE_BOUNDS.archive.minY }))
      .toEqual({ left: 48, top: 90, right: 84, bottom: 158 });
    expect(visibleFootprint({ x: EPILOGUE_MOVE_BOUNDS.archive.maxX, y: EPILOGUE_MOVE_BOUNDS.archive.maxY }))
      .toEqual({ left: 876, top: 421, right: 912, bottom: 489 });
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
