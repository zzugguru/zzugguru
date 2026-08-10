import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./Sequence', () => ({
  Sequence: class {
    update(): void {}
    render(): void {}
    isComplete(): boolean { return true; }
  },
}));

import { Chapter2Game } from './Chapter2Game';

afterEach(() => vi.unstubAllGlobals());

describe('Chapter2Game lifecycle', () => {
  it('completes once, cancels RAF, and disposes its input listeners', () => {
    const listeners = new Map<string, Set<EventListener>>();
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        const set = listeners.get(type) ?? new Set<EventListener>();
        set.add(listener);
        listeners.set(type, set);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => listeners.get(type)?.delete(listener)),
    });
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 27; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockReturnValue(1_000);
    const canvas = {
      width: 960,
      height: 540,
      getContext: vi.fn(() => ({} as CanvasRenderingContext2D)),
    } as unknown as HTMLCanvasElement;
    const onComplete = vi.fn();
    const game = new Chapter2Game(canvas, onComplete);

    game.mount();
    frame?.(1_000);
    frame?.(1_016);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(27);
    expect([...listeners.values()].every((set) => set.size === 0)).toBe(true);
  });
});
