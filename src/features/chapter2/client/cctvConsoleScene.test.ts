import { describe, expect, it } from 'vitest';
import { CctvConsoleScene } from './cctvConsoleScene';
import type { InputState } from './input';

const bounds = { width: 960, height: 540 };
const noDirection = { up: false, down: false, left: false, right: false };

interface FakeInputOptions {
  confirm?: boolean;
  left?: boolean;
  right?: boolean;
}

function createInput(options: FakeInputOptions = {}): InputState {
  return {
    direction: noDirection,
    wasConfirmJustPressed: () => options.confirm ?? false,
    wasCancelJustPressed: () => false,
    wasLeftJustPressed: () => options.left ?? false,
    wasRightJustPressed: () => options.right ?? false,
  } as unknown as InputState;
}

describe('CctvConsoleScene', () => {
  it('starts on channel 0, not complete', () => {
    const scene = new CctvConsoleScene();
    expect(scene.isComplete()).toBe(false);
  });

  it('confirming on the wrong channel does nothing', () => {
    const scene = new CctvConsoleScene();
    // channel 0 is correct for round 0, so move to channel 1 (wrong) first
    scene.update(createInput({ right: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);

    expect(scene.isComplete()).toBe(false);
  });

  it('confirming on the correct channel shows a message and does not complete yet', () => {
    const scene = new CctvConsoleScene();
    // round 0's target channel is 0, already selected by default
    scene.update(createInput({ confirm: true }), 0.016, bounds);

    expect(scene.isComplete()).toBe(false); // message must be dismissed first
  });

  it('advances to the next round only after the message is dismissed', () => {
    const scene = new CctvConsoleScene();
    scene.update(createInput({ confirm: true }), 0.016, bounds); // round 0 correct -> message shown
    scene.update(createInput({ left: true, right: true }), 0.016, bounds); // ignored while message shows
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss -> round 1

    // round 1's target channel is 1; still on channel 0, so confirming now should do nothing
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false);

    // move to channel 1 and confirm
    scene.update(createInput({ right: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false); // message showing again
  });

  it('completes only after every round has been confirmed and dismissed', () => {
    const scene = new CctvConsoleScene();

    // round 0 (channel 0)
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss

    // round 1 (channel 1)
    scene.update(createInput({ right: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss

    // round 2 (channel 2)
    scene.update(createInput({ right: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss final message

    expect(scene.isComplete()).toBe(true);
  });

  it('wraps the channel selection around both ends', () => {
    const scene = new CctvConsoleScene();
    // go left from channel 0 -> should wrap to the last channel (index 2), which is round 0's wrong channel
    scene.update(createInput({ left: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false); // wrong channel for round 0, no message/progress
  });
});
