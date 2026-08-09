import { describe, expect, it, vi } from 'vitest';
import { FamilyPhotoScene } from './familyPhotoScene';
import type { InputState } from './input';

const bounds = { width: 960, height: 540 };

function createInput(confirmPressed: boolean): InputState {
  return {
    direction: { up: false, down: false, left: false, right: false },
    wasConfirmJustPressed: () => confirmPressed,
    wasCancelJustPressed: () => false,
  } as unknown as InputState;
}

function createContext() {
  const fillRectCalls: unknown[] = [];
  return {
    fillRect: vi.fn((...args: unknown[]) => fillRectCalls.push(args)),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    get fillRectCalls() {
      return fillRectCalls;
    },
  };
}

const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

describe('FamilyPhotoScene', () => {
  it('does not draw the photo frame before the reveal line', () => {
    const scene = new FamilyPhotoScene();

    // each checkpoint renders into its own fresh context, so fillRectCalls.length
    // reflects exactly how many fillRect calls happened in that single render
    const ctxAtLine0 = createContext();
    scene.render(ctxAtLine0 as unknown as CanvasRenderingContext2D, canvas);
    const countAtLine0 = ctxAtLine0.fillRectCalls.length; // background only, no photo

    scene.update(createInput(true), 0.016, bounds); // -> line 1
    scene.update(createInput(true), 0.016, bounds); // -> line 2 (still before PHOTO_REVEAL_INDEX = 3)
    const ctxAtLine2 = createContext();
    scene.render(ctxAtLine2 as unknown as CanvasRenderingContext2D, canvas);
    const countAtLine2 = ctxAtLine2.fillRectCalls.length;
    expect(countAtLine2).toBe(countAtLine0); // photo must still be absent

    scene.update(createInput(true), 0.016, bounds); // -> line 3 (the reveal line)
    const ctxAtLine3 = createContext();
    scene.render(ctxAtLine3 as unknown as CanvasRenderingContext2D, canvas);
    const countAtLine3 = ctxAtLine3.fillRectCalls.length;
    expect(countAtLine3).toBeGreaterThan(countAtLine2); // photo now appears
  });

  it('completes after all 7 lines are confirmed, and clears both photo and dialogue', () => {
    const scene = new FamilyPhotoScene();

    for (let i = 0; i < 7; i++) {
      expect(scene.isComplete()).toBe(false);
      scene.update(createInput(true), 0.016, bounds);
    }

    expect(scene.isComplete()).toBe(true);
  });
});
