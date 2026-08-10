import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RooftopEscapeState } from '../shared/rooftopEscapeLogic';
import { RooftopEscapeGame } from './RooftopEscapeGame';

interface EscapeGameControls {
  screen: string;
  state: RooftopEscapeState;
  leftPressed: boolean;
  rightPressed: boolean;
  crawlPressed: boolean;
  jumpSeconds: number;
  playerFacing: -1 | 1;
  monsterFacing: -1 | 1;
  update(deltaSeconds: number): void;
  render(): void;
}

interface ListenerEvent {
  code?: string;
  repeat?: boolean;
  preventDefault?: () => void;
}

function setup() {
  const windowListeners = new Map<string, (event: ListenerEvent) => void>();
  const canvasListeners = new Map<string, (event: { clientX: number; pointerId: number }) => void>();
  const smoothingValues: boolean[] = [];
  const context = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(context, 'imageSmoothingEnabled', {
    get: () => smoothingValues.at(-1) ?? true,
    set: (value: boolean) => smoothingValues.push(value),
  });
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
  vi.stubGlobal('Image', class LoadedImage {
    complete = true;
    naturalWidth = 1254;
    naturalHeight = 1254;
    src = '';
  });

  const game = new RooftopEscapeGame(canvas, liveRegion);
  game.mount();
  return {
    game,
    controls: game as unknown as EscapeGameControls,
    context,
    smoothingValues,
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
  it('도입 화면에서 Chapter 3 방식의 E 또는 Enter로 1F 추격을 시작한다', () => {
    const setupResult = setup();

    expect(setupResult.liveRegion.textContent).toContain('사람처럼 보이지 않습니다');
    setupResult.keydown({ code: 'KeyE', repeat: false, preventDefault: vi.fn() });

    expect(setupResult.controls.screen).toBe('playing');
    expect(setupResult.liveRegion.textContent).toContain('1F');
  });

  it('A/D 이동과 W 점프, S 포복을 처리하고 플레이 중 포인터 이동은 사용하지 않는다', () => {
    const setupResult = setup();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });

    setupResult.keydown({ code: 'KeyD', preventDefault: vi.fn() });
    expect(setupResult.controls.rightPressed).toBe(true);
    setupResult.keyup({ code: 'KeyD' });
    expect(setupResult.controls.rightPressed).toBe(false);

    setupResult.keydown({ code: 'KeyW', repeat: false, preventDefault: vi.fn() });
    expect(setupResult.controls.jumpSeconds).toBeGreaterThan(0);
    setupResult.keydown({ code: 'KeyS', preventDefault: vi.fn() });
    expect(setupResult.controls.crawlPressed).toBe(true);
    setupResult.keydown({ code: 'ShiftLeft', preventDefault: vi.fn() });
    setupResult.keyup({ code: 'KeyS' });
    expect(setupResult.controls.crawlPressed).toBe(true);
    setupResult.keyup({ code: 'ShiftLeft' });
    expect(setupResult.controls.crawlPressed).toBe(false);

    setupResult.pointerdown(100);
    expect(setupResult.canvas.setPointerCapture).not.toHaveBeenCalled();
  });

  it('영수와 귀신이 이동·추격 방향을 바라보고 정지 중에는 마지막 방향을 유지한다', () => {
    const setupResult = setup();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });

    expect(setupResult.controls.playerFacing).toBe(1);
    setupResult.keydown({ code: 'KeyA', preventDefault: vi.fn() });
    setupResult.controls.update(0.01);
    expect(setupResult.controls.playerFacing).toBe(-1);
    setupResult.keyup({ code: 'KeyA' });
    setupResult.controls.update(0.01);
    expect(setupResult.controls.playerFacing).toBe(-1);

    setupResult.controls.state = {
      ...setupResult.controls.state,
      playerX: 200,
      monsterX: 700,
      floorGraceSeconds: 0,
    };
    setupResult.controls.update(0.01);
    expect(setupResult.controls.monsterFacing).toBe(-1);

    setupResult.controls.state = {
      ...setupResult.controls.state,
      floorIndex: 0,
      playerX: 850,
      monsterX: -80,
      floorGraceSeconds: 1,
    };
    setupResult.keydown({ code: 'KeyD', preventDefault: vi.fn() });
    setupResult.controls.update(0);
    expect(setupResult.controls.state.floorIndex).toBe(1);
    expect(setupResult.controls.rightPressed).toBe(false);
    setupResult.keydown({ code: 'KeyD', repeat: true, preventDefault: vi.fn() });
    setupResult.controls.update(0.05);
    expect(setupResult.controls.state.playerX).toBe(850);
    setupResult.keyup({ code: 'KeyD' });
    setupResult.keydown({ code: 'KeyA', repeat: false, preventDefault: vi.fn() });
    setupResult.controls.update(0.05);
    expect(setupResult.controls.state.playerX).toBeLessThan(850);
    expect(setupResult.controls.playerFacing).toBe(-1);
    expect(setupResult.controls.monsterFacing).toBe(-1);
  });

  it('탈출 게임 영수는 새 4방향 시트의 측면 프레임을 픽셀 보간 없이 반전 렌더링한다', () => {
    const setupResult = setup();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    setupResult.keydown({ code: 'KeyA', preventDefault: vi.fn() });
    setupResult.controls.update(0.01);
    setupResult.controls.render();

    expect(setupResult.context.translate).toHaveBeenCalledWith(expect.any(Number), 402);
    expect(setupResult.context.scale).toHaveBeenNthCalledWith(1, -1, 1);
    expect(setupResult.context.scale).toHaveBeenNthCalledWith(2, 1, 1);
    expect(setupResult.context.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('chapter01-yeongsu-guard-sprites') }),
      128,
      0,
      64,
      80,
      -64,
      -152,
      128,
      160,
    );
    expect(setupResult.smoothingValues).toContain(false);

    vi.mocked(setupResult.context.scale).mockClear();
    setupResult.controls.state = {
      ...setupResult.controls.state,
      playerX: 200,
      monsterX: 700,
      floorGraceSeconds: 0,
    };
    setupResult.controls.update(0.01);
    setupResult.controls.render();
    expect(setupResult.context.scale).toHaveBeenNthCalledWith(2, -1, 1);
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
    expect(setupResult.liveRegion.textContent).toContain('E, Enter');

    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    setupResult.controls.state = {
      ...setupResult.controls.state,
      floorIndex: 2,
      playerX: 850,
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
