import { afterEach, describe, expect, it, vi } from 'vitest';
import { BLACKOUT_LINES } from '../shared/blackoutLogic';
import { MEMORY_OBJECTS } from '../shared/collectionLogic';
import { DINNER_LINES } from '../shared/dinnerIllusionLogic';
import { canActivateDevice, isMapPositionAllowed, transitionFlow, type Point } from '../shared/mapLogic';
import { SPACESHIP_MAP } from '../shared/mapAssetManifest';
import { RESCUE_TARGETS } from '../shared/rescueLogic';
import { WARNING_LINES } from '../shared/wardenWarningLogic';
import { MemoryReconstructionGame } from './MemoryReconstructionGame';

class FakeImage {
  src = '';
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
}

function fakeButton(dataset: Record<string, string> = {}) {
  return {
    dataset,
    disabled: false,
    hidden: false,
    textContent: '',
    addEventListener: vi.fn(),
    focus: vi.fn(),
  };
}

function deviceInteractionPosition(): Point {
  for (let y = SPACESHIP_MAP.bounds.y; y <= SPACESHIP_MAP.bounds.y + SPACESHIP_MAP.bounds.height; y += 4) {
    for (let x = SPACESHIP_MAP.bounds.x; x <= SPACESHIP_MAP.bounds.x + SPACESHIP_MAP.bounds.width; x += 4) {
      const position = { x, y };
      if (isMapPositionAllowed(position, SPACESHIP_MAP)
        && canActivateDevice(position, false, SPACESHIP_MAP)) return position;
    }
  }
  throw new Error('No device interaction position found.');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('MemoryReconstructionGame narrative sequence', () => {
  it('executes warning, blackout, all rescues and dinner before letting-go', () => {
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(performance, 'now').mockReturnValue(1_000);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      if (callback.length === 0) callback(1_000);
      return 1;
    }));

    const context = new Proxy({}, {
      get: () => vi.fn(),
      set: () => true,
    }) as CanvasRenderingContext2D;
    const canvas = {
      width: 960,
      height: 540,
      getContext: vi.fn(() => context),
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 960, height: 540 })),
      addEventListener: vi.fn(),
      focus: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const controls = {
      map: { hidden: false },
      directions: [fakeButton({ direction: 'up' }), fakeButton({ direction: 'down' }), fakeButton({ direction: 'left' }), fakeButton({ direction: 'right' })],
      interact: fakeButton(),
      choices: { hidden: false },
      choiceButtons: [fakeButton(), fakeButton(), fakeButton()],
      returnButton: fakeButton(),
      retryButton: fakeButton(),
      lettingChoices: { hidden: false },
      lettingButtons: [fakeButton({ choice: 'hold' }), fakeButton({ choice: 'record' }), fakeButton({ choice: 'release' })],
      epilogueNext: fakeButton(),
      liveRegion: { textContent: '' },
    };
    const game = new MemoryReconstructionGame(canvas, controls as never) as unknown as {
      screen: string;
      player: Point;
      flow: ReturnType<typeof transitionFlow>;
      collection: { collected: readonly string[]; message: string; completed: boolean };
      rescue: { rescued: readonly string[]; completed: boolean };
      rescueOutro: string;
      interact: () => void;
      returnToMap: () => void;
      loop: (time: number) => void;
    };

    game.player = deviceInteractionPosition();
    game.interact();
    expect(game.screen).toBe('warning');
    for (let index = 0; index < WARNING_LINES.length; index += 1) game.interact();
    game.loop(1_421);
    expect(game.screen).toBe('playing');

    game.flow = transitionFlow(game.flow, { type: 'puzzle-success' });
    game.screen = 'result';
    game.returnToMap();
    expect(game.screen).toBe('map');
    expect(game.flow.deviceComplete).toBe(true);

    const lastMemory = MEMORY_OBJECTS.at(-1)!;
    game.collection = {
      collected: MEMORY_OBJECTS.slice(0, -1).map((memory) => memory.id),
      message: 'four collected',
      completed: false,
    };
    game.player = { x: lastMemory.x - 13, y: lastMemory.y - 13 };
    game.interact();
    expect(game.screen).toBe('blackout');
    for (let index = 0; index < BLACKOUT_LINES.length; index += 1) game.interact();
    game.loop(1_421);
    expect(game.screen).toBe('map');

    for (const [targetIndex, target] of RESCUE_TARGETS.entries()) {
      game.player = { x: target.x - 13, y: target.y - 13 };
      game.interact();
      expect(game.screen).toBe('rescue');
      for (let index = 0; index < target.lines.length; index += 1) game.interact();
      game.loop(1_421);
      expect(game.rescue.rescued).toContain(target.id);
      if (targetIndex < RESCUE_TARGETS.length - 1) expect(game.screen).toBe('map');
    }

    expect(game.rescue.completed).toBe(true);
    expect(game.rescueOutro).toBe('line');
    game.interact();
    game.loop(1_421);
    expect(game.screen).toBe('dinner');

    for (let index = 0; index < DINNER_LINES.length; index += 1) game.interact();
    game.loop(1_421);
    expect(game.screen).toBe('letting-go');
    expect(controls.epilogueNext.focus).toHaveBeenCalled();
    expect(controls.directions[0].focus).toHaveBeenCalled();
    expect(controls.lettingButtons[0].focus).toHaveBeenCalled();
    expect(controls.liveRegion.textContent).toContain('기억을 지우지 않되');
  });
});
