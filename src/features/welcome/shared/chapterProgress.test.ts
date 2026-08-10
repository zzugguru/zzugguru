import { describe, expect, it, vi } from 'vitest';
import {
  CHAPTER_PROGRESS_KEY, isChapterUnlocked, readChapterProgress, unlockAfterCompletion,
  type ProgressStorage,
} from './chapterProgress';

function memoryStorage(initial: string | null = null): ProgressStorage & { value: string | null } {
  return {
    value: initial,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; },
  };
}

describe('persistent chapter progress', () => {
  it('starts with only Chapter 1 unlocked', () => {
    expect(readChapterProgress(memoryStorage())).toBe(1);
    expect(isChapterUnlocked('chapter1', 1)).toBe(true);
    expect(isChapterUnlocked('chapter2', 1)).toBe(false);
    expect(isChapterUnlocked('chapter3', 1)).toBe(false);
  });

  it('persists Chapter 2 after Chapter 1 and Chapter 3 after Chapter 2', () => {
    const storage = memoryStorage();
    const chapter2 = unlockAfterCompletion(storage, 1, 'chapter1');
    expect(chapter2).toBe(2);
    expect(readChapterProgress(storage)).toBe(2);
    expect(storage.value).toBe(JSON.stringify({ version: 1, highestUnlocked: 2 }));
    const chapter3 = unlockAfterCompletion(storage, chapter2, 'chapter2');
    expect(chapter3).toBe(3);
    expect(readChapterProgress(storage)).toBe(3);
  });

  it('never relocks progress when an earlier chapter is replayed', () => {
    const storage = memoryStorage(JSON.stringify({ version: 1, highestUnlocked: 3 }));
    expect(unlockAfterCompletion(storage, 3, 'chapter1')).toBe(3);
    expect(readChapterProgress(storage)).toBe(3);
  });

  it('does not overwrite newer progress from another tab with stale in-memory progress', () => {
    const storage = memoryStorage(JSON.stringify({ version: 1, highestUnlocked: 3 }));
    expect(unlockAfterCompletion(storage, 2, 'chapter1')).toBe(3);
    expect(storage.value).toBe(JSON.stringify({ version: 1, highestUnlocked: 3 }));
  });

  it.each(['not-json', '{}', '{"version":2,"highestUnlocked":3}', '{"version":1,"highestUnlocked":9}'])
  ('falls back safely for malformed or unsupported storage: %s', (raw) => {
    expect(readChapterProgress(memoryStorage(raw))).toBe(1);
  });

  it('keeps in-memory progress when storage access fails', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('denied'); }),
      setItem: vi.fn(() => { throw new Error('full'); }),
    };
    expect(readChapterProgress(storage)).toBe(1);
    expect(unlockAfterCompletion(storage, 1, 'chapter1')).toBe(2);
    expect(storage.setItem).toHaveBeenCalledWith(
      CHAPTER_PROGRESS_KEY,
      JSON.stringify({ version: 1, highestUnlocked: 2 }),
    );
  });
});
