export const CHAPTER_PROGRESS_KEY = 'zzugguru.chapter-progress';

export type ChapterId = 'chapter1' | 'chapter2' | 'chapter3';
export type HighestUnlockedChapter = 1 | 2 | 3;
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

type StoredChapterProgress = {
  version: 1;
  highestUnlocked: HighestUnlockedChapter;
};

const chapterNumber: Readonly<Record<ChapterId, HighestUnlockedChapter>> = {
  chapter1: 1,
  chapter2: 2,
  chapter3: 3,
};

export function readChapterProgress(storage: ProgressStorage | null): HighestUnlockedChapter {
  if (!storage) return 1;
  try {
    const raw = storage.getItem(CHAPTER_PROGRESS_KEY);
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as Partial<StoredChapterProgress>;
    return parsed.version === 1 && [1, 2, 3].includes(parsed.highestUnlocked ?? 0)
      ? parsed.highestUnlocked as HighestUnlockedChapter
      : 1;
  } catch {
    return 1;
  }
}

export function isChapterUnlocked(chapter: ChapterId, highestUnlocked: HighestUnlockedChapter): boolean {
  return chapterNumber[chapter] <= highestUnlocked;
}

export function unlockAfterCompletion(
  storage: ProgressStorage | null,
  highestUnlocked: HighestUnlockedChapter,
  completedChapter: ChapterId,
): HighestUnlockedChapter {
  const unlockedByCompletion: HighestUnlockedChapter = completedChapter === 'chapter1'
    ? 2
    : 3;
  const persisted = readChapterProgress(storage);
  const next = Math.max(highestUnlocked, persisted, unlockedByCompletion) as HighestUnlockedChapter;
  if (storage) {
    try {
      storage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify({ version: 1, highestUnlocked: next }));
    } catch {
      // Storage can be denied or full; keep the in-memory unlock for this playthrough.
    }
  }
  return next;
}
