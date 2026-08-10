import { describe, expect, it, vi } from 'vitest';
import { createCctvRoomScene } from './cctvRoomScene';
import { createDutyLogScene } from './dutyLogScene';
import { createEarthMemoryScene } from './earthMemoryScene';
import { createEncounterScene } from './encounterScene';
import { ToyInteractionScene } from './toyInteractionScene';
import { createWindowScene } from './windowScene';
import type { Direction } from '../shared/movement';
import type { InputState } from './input';

const canvas = { width: 960, height: 540 } as HTMLCanvasElement;

function createContext(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('Chapter 2 persistent object labels', () => {
  it('renders all ten names at their asset-relative coordinates even when images are unavailable', () => {
    const cases = [
      [createCctvRoomScene(), [['CCTV 감시 시스템', 480, 268], ['가족사진', 200, 386]]],
      [createEncounterScene(), [['낯선 존재', 480, 312]]],
      [new ToyInteractionScene(), [['어린 시절 장난감', 640, 237]]],
      [createEarthMemoryScene(), [
        ['등굣길 기록', 240, 242], ['시장 기록', 480, 242],
        ['저녁 식탁 기록', 720, 242], ['기록실 출구', 480, 472],
      ]],
      [createWindowScene(), [['전망창 제어장치', 480, 235]]],
      [createDutyLogScene(), [['경비일지', 480, 283]]],
    ] as const;

    for (const [scene, expectedLabels] of cases) {
      const context = createContext();
      scene.render(context, canvas);
      for (const expected of expectedLabels) expect(context.fillText).toHaveBeenCalledWith(...expected);
    }
  });

  it('keeps the locked archive exit named without showing its action prompt', () => {
    const context = createContext();
    createEarthMemoryScene().render(context, canvas);
    const renderedText = vi.mocked(context.fillText).mock.calls.map(([text]) => text);

    expect(renderedText).toContain('기록실 출구');
    expect(renderedText).not.toContain('E/Enter : 기록 그만 보기');
  });

  it('shows the toy completion name inside the opaque memory overlay', () => {
    const scene = new ToyInteractionScene();
    const stopped: Direction = { up: false, down: false, left: false, right: false };
    const input = (direction: Direction, confirm = false): InputState => ({
      direction,
      wasConfirmJustPressed: () => confirm,
      wasCancelJustPressed: () => false,
    }) as unknown as InputState;

    scene.update(input({ ...stopped, right: true }), 1.5, canvas);
    scene.update(input({ ...stopped, up: true }), 0.525, canvas);
    const promptContext = createContext();
    scene.render(promptContext, canvas);
    expect(promptContext.fillText).toHaveBeenCalledWith('E/Enter : 장난감 조사하기', 640, 180);
    scene.update(input(stopped, true), 0, canvas);

    const context = createContext();
    scene.render(context, canvas);
    expect(context.fillText).toHaveBeenCalledWith('어린 시절 장난감 · 완료', 480, 190);
  });
});
