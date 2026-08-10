import {
  isChapterUnlocked,
  type ChapterId,
  type HighestUnlockedChapter,
} from '../shared/chapterProgress';

export type ChapterMenuButton = Pick<
  HTMLButtonElement,
  'dataset' | 'disabled' | 'textContent' | 'title' | 'setAttribute' | 'querySelector'
>;

const chapterRank: Readonly<Record<ChapterId, HighestUnlockedChapter>> = {
  chapter1: 1,
  chapter2: 2,
  chapter3: 3,
};

export function chapterIdForButton(button: ChapterMenuButton): ChapterId {
  return button.dataset.game === 'memory' ? 'chapter3' : button.dataset.game as ChapterId;
}

export function renderChapterLocks(
  buttons: readonly ChapterMenuButton[],
  highestUnlocked: HighestUnlockedChapter,
): void {
  buttons.forEach((button) => {
    const chapter = chapterIdForButton(button);
    const unlocked = isChapterUnlocked(chapter, highestUnlocked);
    const originalLabel = button.dataset.unlockedLabel ?? button.textContent ?? '';
    const current = unlocked && chapterRank[chapter] === highestUnlocked;
    const status = button.querySelector<HTMLElement>('[data-chapter-status]');
    const action = button.querySelector<HTMLElement>('[data-chapter-action]');
    button.dataset.unlockedLabel = originalLabel;
    button.dataset.current = String(current);
    button.dataset.locked = String(!unlocked);
    button.disabled = !unlocked;
    const prerequisite = chapter === 'chapter2' ? 'Chapter 1 완료 필요' : 'Chapter 2 완료 필요';
    const stateLabel = current ? '이어서 플레이' : unlocked ? '완료, 다시 보기' : `잠김. ${prerequisite}`;
    if (status) status.textContent = current ? '이어서 플레이' : unlocked ? '완료' : '잠김';
    if (action) action.textContent = current ? '이야기 시작 →' : unlocked ? '다시 플레이 →' : prerequisite;
    button.title = unlocked ? '' : prerequisite;
    button.setAttribute('aria-current', current ? 'step' : 'false');
    button.setAttribute('aria-label', `${originalLabel}, ${stateLabel}`);
  });
}

export function activateChapter(
  chapter: ChapterId,
  highestUnlocked: HighestUnlockedChapter,
  start: () => void,
  reject: () => void,
): boolean {
  if (!isChapterUnlocked(chapter, highestUnlocked)) {
    reject();
    return false;
  }
  start();
  return true;
}
