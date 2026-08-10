import { describe, expect, it } from 'vitest';
import { advanceEpilogue, ARCHIVE_RECORDS, ARCHIVE_ROOM_DOOR, ARCHIVE_SPAWN, ARCHIVE_VISIBLE_FLOOR, createEpilogue, enterArchive, EPILOGUE_MOVE_BOUNDS, JOURNAL_LINES, MONTAGE, moveEpiloguePlayer, placeArchiveRecord, QUARTERS_SPAWN, startEpilogue, type EpilogueState } from './epilogueLogic';
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
      const reachableRecord = moveEpiloguePlayer({ x: record.x - 13, y: record.y - 13 }, 0, 0, 'archive');
      expect(Math.hypot(reachableRecord.x + 13 - record.x, reachableRecord.y + 13 - record.y)).toBeLessThanOrEqual(72);
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
    expect(moveEpiloguePlayer({ x: 794, y: 425 }, 20, 20, 'archive')).toEqual({ x: 794, y: 425 });
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
      .toEqual({ left: 115, top: 120, right: 151, bottom: 188 });
    expect(visibleFootprint({ x: EPILOGUE_MOVE_BOUNDS.archive.maxX, y: EPILOGUE_MOVE_BOUNDS.archive.maxY }))
      .toEqual({ left: 789, top: 383, right: 825, bottom: 451 });
    expect(ARCHIVE_VISIBLE_FLOOR).toEqual({ left: 115, top: 120, right: 825, bottom: 451 });
  });

  it('aligns every archive object with an in-bounds reachable background pad', () => {
    expect(ARCHIVE_RECORDS.map(({ id, x, y }) => [id, x, y])).toEqual([
      ['photo', 230, 170],
      ['voice', 307, 375],
      ['tool', 463, 170],
      ['star', 632, 375],
      ['table', 712, 170],
    ]);
    const objectRects = ARCHIVE_RECORDS.map((record) => ({
      left: record.x - 29,
      top: record.y - 32,
      right: record.x + 29,
      bottom: record.y + 42,
    }));
    for (const [index, rect] of objectRects.entries()) {
      expect(rect.left).toBeGreaterThanOrEqual(48);
      expect(rect.top).toBeGreaterThanOrEqual(90);
      expect(rect.right).toBeLessThanOrEqual(912);
      expect(rect.bottom).toBeLessThanOrEqual(489);
      const reachable = moveEpiloguePlayer({ x: ARCHIVE_RECORDS[index].x - 13, y: ARCHIVE_RECORDS[index].y - 13 }, 0, 0, 'archive');
      expect(Math.hypot(reachable.x + 13 - ARCHIVE_RECORDS[index].x, reachable.y + 13 - ARCHIVE_RECORDS[index].y))
        .toBeLessThanOrEqual(72);
    }
    expect(ARCHIVE_ROOM_DOOR).toEqual({ x: 850, y: 270 });
    expect({
      left: ARCHIVE_ROOM_DOOR.x - 31,
      top: ARCHIVE_ROOM_DOOR.y - 38,
      right: ARCHIVE_ROOM_DOOR.x + 31,
      bottom: ARCHIVE_ROOM_DOOR.y + 38,
    }).toEqual({ left: 819, top: 232, right: 881, bottom: 308 });
  });

  it('keeps a connected safe floor route from archive spawn to every record and the door', () => {
    const step = 13;
    const key = (x: number, y: number) => `${x},${y}`;
    const queue = [{ ...ARCHIVE_SPAWN }];
    const visited = new Set([key(ARCHIVE_SPAWN.x, ARCHIVE_SPAWN.y)]);
    for (let index = 0; index < queue.length; index += 1) {
      const point = queue[index];
      for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
        const moved = moveEpiloguePlayer(point, dx, dy, 'archive');
        const movedKey = key(moved.x, moved.y);
        if (visited.has(movedKey)) continue;
        visited.add(movedKey); queue.push(moved);
      }
    }
    const reaches = (target: { x: number; y: number }) => queue.some((point) => (
      Math.hypot(point.x + 13 - target.x, point.y + 13 - target.y) <= 72
    ));

    expect(ARCHIVE_SPAWN).toEqual({ x: 140, y: 270 });
    for (const record of ARCHIVE_RECORDS) expect(reaches(record)).toBe(true);
    expect(reaches(ARCHIVE_ROOM_DOOR)).toBe(true);
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
