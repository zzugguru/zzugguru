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
  it('recognizes the physical Z key while the Korean IME reports ㅋ', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const event = keyEvent('ㅋ', 'KeyZ');

    listeners.get('keydown')?.(event);

    expect(input.wasConfirmJustPressed()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('fires confirm once per press and rearms after keyup', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const event = keyEvent('z', 'KeyZ');

    listeners.get('keydown')?.(event);
    input.clearFrame();
    listeners.get('keydown')?.(event);
    expect(input.wasConfirmJustPressed()).toBe(false);

    listeners.get('keyup')?.(event);
    listeners.get('keydown')?.(event);
    expect(input.wasConfirmJustPressed()).toBe(true);
  });

  it('completes a nearby map interaction from the Korean-layout Z key', () => {
    const listeners = installWindowStub();
    const input = new InputState();
    const scene = new MapScene(
      [{ id: 'console', position: { x: 480, y: 320 }, interactionRadius: 48, required: true, label: '확인' }],
      { x: 480, y: 320 },
    );

    listeners.get('keydown')?.(keyEvent('ㅋ', 'KeyZ'));
    scene.update(input, 0.016, { width: 960, height: 540 });

    expect(scene.getInteractedIds().has('console')).toBe(true);
    expect(scene.isComplete()).toBe(true);
  });
});
