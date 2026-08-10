import { describe, expect, it } from 'vitest';
import { activateChapter, chapterIdForButton, renderChapterLocks } from './chapterMenuProgress';

function button(game, label) {
  const attributes = new Map();
  const status = { textContent: '' };
  const action = { textContent: '' };
  return {
    dataset: { game, unlockedLabel: label },
    disabled: false,
    textContent: `${label} premise action`,
    title: '',
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    querySelector(selector) {
      if (selector === '[data-chapter-status]') return status;
      if (selector === '[data-chapter-action]') return action;
      return null;
    },
    status,
    action,
  };
}

describe('sequential chapter unlock integration', () => {
  it('renders initial lock state with accessible prerequisite labels', () => {
    const buttons = [button('chapter1', 'Chapter 01'), button('chapter2', 'Chapter 02'), button('memory', 'Chapter 03')];
    renderChapterLocks(buttons, 1);

    expect(buttons.map(({ disabled }) => disabled)).toEqual([false, true, true]);
    expect(buttons[0].status.textContent).toBe('이어서 플레이');
    expect(buttons[0].getAttribute('aria-current')).toBe('step');
    expect(buttons[1].status.textContent).toBe('잠김');
    expect(buttons[1].action.textContent).toBe('Chapter 1 완료 필요');
    expect(buttons[1].getAttribute('aria-label')).toBe('Chapter 02, 잠김. Chapter 1 완료 필요');
    expect(buttons[2].getAttribute('aria-label')).toBe('Chapter 03, 잠김. Chapter 2 완료 필요');
  });

  it('rejects locked activation without revealing the stage', () => {
    const locked = button('chapter2', 'Chapter 02');
    let menuHidden = false;
    let stageHidden = true;
    let rejection = '';

    const activated = activateChapter(chapterIdForButton(locked), 1, () => {
      menuHidden = true;
      stageHidden = false;
    }, () => { rejection = 'Chapter 1 완료 필요'; });

    expect(activated).toBe(false);
    expect({ menuHidden, stageHidden, rejection }).toEqual({
      menuHidden: false,
      stageHidden: true,
      rejection: 'Chapter 1 완료 필요',
    });
  });

  it('updates card state without destroying its structured content across rerenders', () => {
    const chapter2 = button('chapter2', 'Chapter 02');
    const structuredContent = chapter2.textContent;
    renderChapterLocks([chapter2], 1);
    renderChapterLocks([chapter2], 2);
    renderChapterLocks([chapter2], 1);

    expect(chapter2.textContent).toBe(structuredContent);
    expect(chapter2.status.textContent).toBe('잠김');
    expect(chapter2.action.textContent).toBe('Chapter 1 완료 필요');
    expect(chapter2.dataset.unlockedLabel).toBe('Chapter 02');
  });
});
