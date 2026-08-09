import { describe, expect, it, vi } from 'vitest';
import { MapScene, type MapObjectDefinition } from './MapScene';
import type { Direction } from '../shared/movement';
import type { InputState } from './input';

const bounds = { width: 960, height: 540 };
const noDirection: Direction = { up: false, down: false, left: false, right: false };

function createInput(direction: Direction, confirmPressed: boolean): InputState {
  return {
    direction,
    wasConfirmJustPressed: () => confirmPressed,
    wasCancelJustPressed: () => false,
  } as unknown as InputState;
}

function createContext(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

function windowObject(overrides: Partial<MapObjectDefinition> = {}): MapObjectDefinition {
  return {
    id: 'window',
    position: { x: 100, y: 100 },
    interactionRadius: 40,
    required: true,
    label: '조사하기',
    ...overrides,
  };
}

describe('MapScene', () => {
  it('is not complete until the player interacts with a nearby required object', () => {
    const onInteract = vi.fn();
    const scene = new MapScene([windowObject({ onInteract })], { x: 100, y: 100 });

    expect(scene.isComplete()).toBe(false);

    scene.update(createInput(noDirection, true), 0.016, bounds);

    expect(onInteract).toHaveBeenCalledTimes(1);
    expect(scene.getInteractedIds().has('window')).toBe(true);
    expect(scene.isComplete()).toBe(true);
  });

  it('does not trigger interaction when the player is out of range', () => {
    const onInteract = vi.fn();
    const scene = new MapScene([windowObject({ onInteract })], { x: 900, y: 500 });

    scene.update(createInput(noDirection, true), 0.016, bounds);

    expect(onInteract).not.toHaveBeenCalled();
    expect(scene.isComplete()).toBe(false);
  });

  it('does not re-fire onInteract for an object already interacted with', () => {
    const onInteract = vi.fn();
    const scene = new MapScene([windowObject({ onInteract })], { x: 100, y: 100 });

    scene.update(createInput(noDirection, true), 0.016, bounds);
    scene.update(createInput(noDirection, true), 0.016, bounds);

    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it('completes once the only required object is interacted with, ignoring optional ones', () => {
    const scene = new MapScene(
      [windowObject({ id: 'a', required: true }), windowObject({ id: 'b', required: false })],
      { x: 100, y: 100 },
    );

    scene.update(createInput(noDirection, true), 0.016, bounds);

    expect(scene.getInteractedIds().has('a')).toBe(true);
    expect(scene.isComplete()).toBe(true);
  });

  it('moves the player toward a distant object, only allowing interaction once in range', () => {
    const onInteract = vi.fn();
    const scene = new MapScene(
      [windowObject({ id: 'far', position: { x: 400, y: 0 }, interactionRadius: 20, onInteract })],
      { x: 0, y: 0 },
    );
    const right: Direction = { ...noDirection, right: true };

    scene.update(createInput(right, true), 0.016, bounds); // too far away yet
    expect(onInteract).not.toHaveBeenCalled();

    for (let i = 0; i < 25; i++) {
      scene.update(createInput(right, false), 0.1, bounds); // 25 * 0.1s * 160px/s = 400px, exactly at the object
    }

    scene.update(createInput(noDirection, true), 0.016, bounds);
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it('render does not mutate scene state (idempotent)', () => {
    const onInteract = vi.fn();
    const scene = new MapScene([windowObject({ onInteract })], { x: 100, y: 100 });
    const context = createContext();

    scene.render(context, canvas);
    scene.render(context, canvas);

    expect(scene.isComplete()).toBe(false);
    expect(onInteract).not.toHaveBeenCalled();
  });

  describe('interaction messages', () => {
    it('stays incomplete while a message is showing, even if it was the only required object', () => {
      const scene = new MapScene([windowObject({ message: '누군가 서 있다.' })], { x: 100, y: 100 });

      scene.update(createInput(noDirection, true), 0.016, bounds);

      expect(scene.getInteractedIds().has('window')).toBe(true);
      expect(scene.isComplete()).toBe(false);
    });

    it('freezes movement and ignores other objects while a message is showing', () => {
      const other = vi.fn();
      const scene = new MapScene(
        [
          windowObject({ id: 'a', message: '메시지', position: { x: 100, y: 100 } }),
          windowObject({ id: 'b', required: false, position: { x: 100, y: 100 }, onInteract: other }),
        ],
        { x: 100, y: 100 },
      );
      const right: Direction = { ...noDirection, right: true };

      scene.update(createInput(right, true), 0.016, bounds); // interacts with 'a', message appears

      // while the message is showing (not yet dismissed), movement/other objects must be ignored
      scene.update(createInput(right, false), 1, bounds);

      expect(other).not.toHaveBeenCalled();
      expect(scene.getInteractedIds().has('b')).toBe(false);
    });

    it('dismisses the message on the next confirm press and completes afterward', () => {
      const scene = new MapScene([windowObject({ message: '누군가 서 있다.' })], { x: 100, y: 100 });

      scene.update(createInput(noDirection, true), 0.016, bounds); // show message
      expect(scene.isComplete()).toBe(false);

      scene.update(createInput(noDirection, true), 0.016, bounds); // dismiss message
      expect(scene.isComplete()).toBe(true);
    });

    it('completes immediately for objects without a message', () => {
      const scene = new MapScene([windowObject()], { x: 100, y: 100 });

      scene.update(createInput(noDirection, true), 0.016, bounds);

      expect(scene.isComplete()).toBe(true);
    });
  });

  describe('unlockedBy prerequisites', () => {
    it('is not interactable until at least one prerequisite has been interacted with', () => {
      const exitInteract = vi.fn();
      const scene = new MapScene(
        [windowObject({ id: 'exit', required: true, unlockedBy: ['memory-a'], onInteract: exitInteract })],
        { x: 100, y: 100 },
      );

      scene.update(createInput(noDirection, true), 0.016, bounds);

      expect(exitInteract).not.toHaveBeenCalled();
      expect(scene.getInteractedIds().has('exit')).toBe(false);
      expect(scene.isComplete()).toBe(false);
    });

    it('becomes interactable once a prerequisite has been interacted with', () => {
      const exitInteract = vi.fn();
      const scene = new MapScene(
        [
          windowObject({ id: 'memory-a', required: false }),
          windowObject({ id: 'exit', required: true, unlockedBy: ['memory-a'], onInteract: exitInteract }),
        ],
        { x: 100, y: 100 },
      );

      scene.update(createInput(noDirection, true), 0.016, bounds); // picks memory-a; exit still locked
      expect(scene.getInteractedIds().has('memory-a')).toBe(true);
      expect(exitInteract).not.toHaveBeenCalled();

      scene.update(createInput(noDirection, true), 0.016, bounds); // exit now unlocked
      expect(exitInteract).toHaveBeenCalledTimes(1);
      expect(scene.isComplete()).toBe(true);
    });

    it('unlocks once ANY one of several prerequisites is satisfied, not requiring all of them', () => {
      const exitInteract = vi.fn();
      const scene = new MapScene(
        [
          windowObject({ id: 'memory-a', required: false }),
          windowObject({
            id: 'exit',
            required: true,
            unlockedBy: ['memory-a', 'memory-b'],
            onInteract: exitInteract,
          }),
          windowObject({ id: 'memory-b', required: false }),
        ],
        { x: 100, y: 100 },
      );

      scene.update(createInput(noDirection, true), 0.016, bounds); // memory-a
      scene.update(createInput(noDirection, true), 0.016, bounds); // exit unlocked by memory-a alone, picked before memory-b (array order)

      expect(exitInteract).toHaveBeenCalledTimes(1);
      expect(scene.getInteractedIds().has('memory-b')).toBe(false);
    });

    it('leaves objects without unlockedBy unaffected', () => {
      const scene = new MapScene([windowObject()], { x: 100, y: 100 });

      scene.update(createInput(noDirection, true), 0.016, bounds);

      expect(scene.isComplete()).toBe(true);
    });
  });
});
