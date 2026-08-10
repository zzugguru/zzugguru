import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputState } from './input';
import { MapScene } from './MapScene';

type Listener = (event: KeyboardEvent) => void;

function installWindowStub(): Map<string, Listener> {
  const listeners = new Map<string, Listener>();
  vi.stubGlobal('window', {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    removeEventListener: vi.fn(),
  });
  return listeners;
}

function keyEvent(key: string, code: string): KeyboardEvent {
  return { key, code, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

afterEach(() => vi.unstubAllGlobals());

describe('Chapter 2 input', () => {
  it('recognizes the physical E key while the Korean IME reports ㄷ', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const event = keyEvent('ㄷ', 'KeyE');

    listeners.get('keydown')?.(event);

    expect(input.wasConfirmJustPressed()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('fires confirm once per press and rearms after keyup', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const event = keyEvent('e', 'KeyE');

    listeners.get('keydown')?.(event);
    input.clearFrame();
    listeners.get('keydown')?.(event);
    expect(input.wasConfirmJustPressed()).toBe(false);

    listeners.get('keyup')?.(event);
    listeners.get('keydown')?.(event);
    expect(input.wasConfirmJustPressed()).toBe(true);
  });

  it('accepts Enter and rejects the former Z confirm key', () => {
    const listeners = installWindowStub();
    const input = new InputState();

    listeners.get('keydown')?.(keyEvent('z', 'KeyZ'));
    expect(input.wasConfirmJustPressed()).toBe(false);

    listeners.get('keydown')?.(keyEvent('Enter', 'Enter'));
    expect(input.wasConfirmJustPressed()).toBe(true);
  });

  it('completes a nearby map interaction from the Korean-layout E key', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const scene = new MapScene(
      [{ id: 'console', position: { x: 480, y: 320 }, interactionRadius: 48, required: true, label: '확인' }],
      { x: 480, y: 320 },
    );

    listeners.get('keydown')?.(keyEvent('ㄷ', 'KeyE'));
    scene.update(input, 0.016, { width: 960, height: 540 });

    expect(scene.getInteractedIds().has('console')).toBe(true);
    expect(scene.isComplete()).toBe(true);
  });

  it('keeps mouse click as a confirm input', () => {
    const listeners = installWindowStub();
    const input = new InputState();

    listeners.get('click')?.({} as KeyboardEvent);

    expect(input.wasConfirmJustPressed()).toBe(true);
  });

  it('keeps X cancel and arrow movement with one-shot left/right presses', () => {
    const listeners = installWindowStub();
    const input = new InputState();

    listeners.get('keydown')?.(keyEvent('x', 'KeyX'));
    expect(input.wasCancelJustPressed()).toBe(true);

    listeners.get('keydown')?.(keyEvent('ArrowLeft', 'ArrowLeft'));
    expect(input.direction.left).toBe(true);
    expect(input.wasLeftJustPressed()).toBe(true);
    input.clearFrame();
    expect(input.wasLeftJustPressed()).toBe(false);
    listeners.get('keyup')?.(keyEvent('ArrowLeft', 'ArrowLeft'));
    expect(input.direction.left).toBe(false);

    listeners.get('keydown')?.(keyEvent('ArrowRight', 'ArrowRight'));
    expect(input.direction.right).toBe(true);
    expect(input.wasRightJustPressed()).toBe(true);
  });
});
