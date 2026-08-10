import { describe, expect, it, vi } from 'vitest';
import { renderDialogueBox } from './dialogueBox';

function createContext() {
  return {
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: 'left',
  } as unknown as CanvasRenderingContext2D;
}

describe('Chapter03 dialogue box (Chapter02 형식 일치)', () => {
  it('draws the box at the same geometry as Chapter02 (bottom-anchored, 24px margin, radius 8)', () => {
    const context = createContext();
    const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

    renderDialogueBox(context, canvas, { speaker: '누나', text: '대사' }, '다음');

    expect(context.roundRect).toHaveBeenCalledWith(24, 396, 912, 120, 8);
  });

  it('draws speaker and line text when a speaker is present', () => {
    const context = createContext();
    const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

    renderDialogueBox(context, canvas, { speaker: '누나', text: '대사' }, '다음');

    expect(context.fillText).toHaveBeenCalledWith('누나', 44, 430);
    expect(context.fillText).toHaveBeenCalledWith('대사', 44, 466);
    expect(context.fillText).toHaveBeenCalledWith('다음', 916, 500);
  });

  it('falls back to italic narration styling when speaker is empty', () => {
    const context = createContext();
    const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

    renderDialogueBox(context, canvas, { speaker: '', text: '내레이션' }, '다음');

    expect(context.fillText).toHaveBeenCalledWith('내레이션', 44, 451);
    expect(context.fillText).toHaveBeenCalledTimes(2);
  });
});
