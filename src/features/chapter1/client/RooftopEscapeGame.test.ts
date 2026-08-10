import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RooftopEscapeState } from '../shared/rooftopEscapeLogic';
import { RooftopEscapeGame } from './RooftopEscapeGame';

interface EscapeGameControls {
  screen: string;
  state: RooftopEscapeState;
  leftPressed: boolean;
  rightPressed: boolean;
  update(deltaSeconds: number): void;
}

interface ListenerEvent {
  code?: string;
  repeat?: boolean;
  preventDefault?: () => void;
}

function setup() {
  const windowListeners = new Map<string, (event: ListenerEvent) => void>();
  const canvasListeners = new Map<string, (event: { clientX: number; pointerId: number }) => void>();
  const context = {} as CanvasRenderingContext2D;
  const canvas = {
    width: 960,
    height: 540,
    tabIndex: -1,
    getContext: vi.fn(() => context),
    addEventListener: vi.fn((type: string, listener: (event: { clientX: number; pointerId: number }) => void) => canvasListeners.set(type, listener)),
    removeEventListener: vi.fn((type: string) => canvasListeners.delete(type)),
    setAttribute: vi.fn(),
    focus: vi.fn(),
    setPointerCapture: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, width: 960 })),
  } as unknown as HTMLCanvasElement;
  const liveRegion = { textContent: '' } as HTMLElement;

  vi.stubGlobal('window', {
    addEventListener: vi.fn((type: string, listener: (event: ListenerEvent) => void) => windowListeners.set(type, listener)),
    removeEventListener: vi.fn((type: string) => windowListeners.delete(type)),
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 9));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  const game = new RooftopEscapeGame(canvas, liveRegion);
  game.mount();
  return {
    game,
    controls: game as unknown as EscapeGameControls,
    canvas,
    liveRegion,
    keydown: (event: ListenerEvent) => windowListeners.get('keydown')?.(event),
    keyup: (event: ListenerEvent) => windowListeners.get('keyup')?.(event),
    pointerdown: (clientX: number) => canvasListeners.get('pointerdown')?.({ clientX, pointerId: 1 }),
    windowListeners,
    canvasListeners,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('RooftopEscapeGame', () => {
  it('도입 화면에서 Enter를 누르면 B1 추격을 시작한다', () => {
    const setupResult = setup();

    expect(setupResult.liveRegion.textContent).toContain('사람처럼 보이지 않습니다');
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });

    expect(setupResult.controls.screen).toBe('playing');
    expect(setupResult.liveRegion.textContent).toContain('B1');
  });

  it('키보드와 화면 좌우 입력을 이동 상태로 바꾼다', () => {
    const setupResult = setup();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });

    setupResult.keydown({ code: 'KeyD', preventDefault: vi.fn() });
    expect(setupResult.controls.rightPressed).toBe(true);
    setupResult.keyup({ code: 'KeyD' });
    expect(setupResult.controls.rightPressed).toBe(false);

    setupResult.pointerdown(100);
    expect(setupResult.canvas.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('피격과 옥상 탈출 결과를 안내한다', () => {
    const setupResult = setup();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    setupResult.controls.state = {
      ...setupResult.controls.state,
      playerX: 300,
      monsterX: 320,
      floorGraceSeconds: 0,
    };
    setupResult.controls.update(0.01);

    expect(setupResult.controls.screen).toBe('caught');
    expect(setupResult.liveRegion.textContent).toContain('붙잡혔습니다');

    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    setupResult.controls.state = {
      ...setupResult.controls.state,
      floorIndex: 3,
      playerX: 110,
      monsterX: 900,
    };
    setupResult.controls.update(0);

    expect(setupResult.controls.screen).toBe('escaped');
    expect(setupResult.liveRegion.textContent).toContain('옥상 문');
  });

  it('중지할 때 전역 입력과 캔버스 입력을 모두 정리한다', () => {
    const setupResult = setup();
    setupResult.game.stop();

    expect(setupResult.windowListeners.size).toBe(0);
    expect(setupResult.canvasListeners.size).toBe(0);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(9);
  });
});
