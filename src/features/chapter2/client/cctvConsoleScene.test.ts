import { describe, expect, it, vi } from 'vitest';
import { CCTV_CHANNEL_ASSET_PATHS, clampCctvChannel, CctvConsoleScene, drawCctvMemoryImage } from './cctvConsoleScene';
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

function createContext(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
  } as unknown as CanvasRenderingContext2D;
}

const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

describe('CctvConsoleScene', () => {
  it('maps the three memory images to parking, lobby and guard-door channels', () => {
    expect(CCTV_CHANNEL_ASSET_PATHS).toEqual([
      expect.stringContaining('cctv-parking-memory.png'),
      expect.stringContaining('cctv-lobby-memory.png'),
      expect.stringContaining('cctv-guard-door-memory.png'),
    ]);
  });

  it('draws an exact-size loaded memory image at native screen geometry', () => {
    const context = createContext();
    const image = { complete: true, naturalWidth: 600, naturalHeight: 340 } as HTMLImageElement;
    expect(drawCctvMemoryImage(context, image)).toBe(true);
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.drawImage).toHaveBeenCalledWith(image, 180, 80, 600, 340);
  });

  it.each([
    null,
    { complete: false, naturalWidth: 600, naturalHeight: 340 },
    { complete: true, naturalWidth: 599, naturalHeight: 340 },
    { complete: true, naturalWidth: 600, naturalHeight: 339 },
  ])('keeps the fallback screen when the channel image is unavailable or malformed: %o', (image) => {
    const context = createContext();
    expect(drawCctvMemoryImage(context, image as HTMLImageElement | null)).toBe(false);
    expect(context.drawImage).not.toHaveBeenCalled();
  });

  it('renders channel, time, signal and scanline HUD with Canvas primitives', () => {
    const scene = new CctvConsoleScene();
    const context = createContext();
    scene.render(context, canvas);
    expect(context.fillText).toHaveBeenCalledWith('CH 1 · 지하주차장', 202, 113);
    expect(context.fillText).toHaveBeenCalledWith('04:13 · 신호 미약', 758, 113);
    expect(context.fillRect).toHaveBeenCalledWith(180, 82, 600, 1);
  });

  it('clamps channel movement at 1/3 and 3/3 instead of wrapping', () => {
    expect(clampCctvChannel(0, -1)).toBe(0);
    expect(clampCctvChannel(0, 1)).toBe(1);
    expect(clampCctvChannel(2, 1)).toBe(2);
    expect(clampCctvChannel(2, -1)).toBe(1);
  });

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

    const context = createContext();
    scene.render(context, canvas);
    expect(context.fillText).toHaveBeenCalledWith(
      '2 / 3 · 1층 로비',
      480,
      460,
    );
    expect(context.fillText).toHaveBeenCalledWith(
      '확인 단계 2 / 3 · 다음 CCTV 화면으로 이동했습니다: 1층 로비',
      480,
      52,
    );

    // dismissing round 0 automatically moves to round 1's target channel.
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false);
  });

  it('shows a direction hint after confirming the wrong channel', () => {
    const scene = new CctvConsoleScene();
    scene.update(createInput({ right: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);

    const context = createContext();
    scene.render(context, canvas);
    expect(context.fillText).toHaveBeenCalledWith(
      '확인 단계 1 / 3 · 이 화면에는 신호가 없습니다. 지하주차장 화면을 확인하세요.',
      480,
      52,
    );
  });

  it('completes only after every round has been confirmed and dismissed', () => {
    const scene = new CctvConsoleScene();

    // round 0 (channel 0)
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss

    // round 1 (channel 1)
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss

    // round 2 (channel 2)
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false);
    scene.update(createInput({ confirm: true }), 0.016, bounds); // dismiss final message

    expect(scene.isComplete()).toBe(true);
  });

  it('does not wrap left from the first channel', () => {
    const scene = new CctvConsoleScene();
    // left from channel 0 remains on channel 0, so confirm still finds round 0.
    scene.update(createInput({ left: true }), 0.016, bounds);
    scene.update(createInput({ confirm: true }), 0.016, bounds);
    expect(scene.isComplete()).toBe(false); // correct channel message is showing
  });
});
