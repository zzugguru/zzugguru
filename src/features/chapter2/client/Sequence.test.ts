import { describe, expect, it, vi } from 'vitest';
import { Sequence, type Scene } from './Sequence';

function createScene(isComplete: () => boolean): Scene {
  return {
    update: vi.fn(),
    render: vi.fn(),
    isComplete,
  };
}

const input = {} as Parameters<Scene['update']>[0];
const bounds = { width: 960, height: 540 };
const ctx = {} as Parameters<Scene['render']>[0];
const canvas = {} as Parameters<Scene['render']>[1];

describe('Sequence', () => {
  it('starts on the first step and does not advance before it completes', () => {
    const first = createScene(() => false);
    const second = createScene(() => false);
    const sequence = new Sequence([() => first, () => second]);

    sequence.update(input, 0.016, bounds);
    sequence.render(ctx, canvas);

    expect(first.update).toHaveBeenCalledTimes(1);
    expect(first.render).toHaveBeenCalledTimes(1);
    expect(second.update).not.toHaveBeenCalled();
  });

  it('advances to the next step exactly once when the current step completes, without updating the new step the same frame', () => {
    const first = createScene(() => true);
    const second = createScene(() => false);
    const sequence = new Sequence([() => first, () => second]);

    sequence.update(input, 0.016, bounds);
    sequence.render(ctx, canvas);

    expect(first.update).toHaveBeenCalledTimes(1);
    expect(second.update).not.toHaveBeenCalled();
    expect(second.render).toHaveBeenCalledTimes(1);
    expect(first.render).not.toHaveBeenCalled();
  });

  it('passes the previous scene instance to the next factory', () => {
    const first = createScene(() => true);
    const factorySpy = vi.fn(() => createScene(() => false));
    const sequence = new Sequence([() => first, factorySpy]);

    sequence.update(input, 0.016, bounds);

    expect(factorySpy).toHaveBeenCalledWith(first);
  });

  it('passes null to the first factory', () => {
    const factorySpy = vi.fn(() => createScene(() => false));
    new Sequence([factorySpy]);

    expect(factorySpy).toHaveBeenCalledWith(null);
  });

  it('stays on the final step and keeps delegating safely once it completes', () => {
    const only = createScene(() => true);
    const sequence = new Sequence([() => only]);

    sequence.update(input, 0.016, bounds);
    sequence.update(input, 0.016, bounds);
    sequence.render(ctx, canvas);

    expect(only.update).toHaveBeenCalledTimes(2);
    expect(only.render).toHaveBeenCalledTimes(1);
  });

  it('throws when constructed with an empty step list', () => {
    expect(() => new Sequence([])).toThrow();
  });
});
