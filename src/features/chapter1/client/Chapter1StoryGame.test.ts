import { afterEach, describe, expect, it, vi } from 'vitest';
import { explorationForBeat, type Chapter01Point } from '../shared/chapter01Exploration';
import { Chapter1StoryGame } from './Chapter1StoryGame';

interface StoryGameControls {
  currentIndex: number;
  complete: boolean;
  playerPosition: Chapter01Point;
  completedExplorations: Set<number>;
  pointerTarget: Chapter01Point | null;
  inputFeedback: { kind: 'advance' | 'blocked' | 'move'; remainingSeconds: number } | null;
  advance(): void;
}

interface ListenerEvent {
  code?: string;
  repeat?: boolean;
  preventDefault?: () => void;
  clientX?: number;
  clientY?: number;
}

function setup() {
  const windowListeners = new Map<string, (event: ListenerEvent) => void>();
  const canvasListeners = new Map<string, (event: ListenerEvent) => void>();
  const context = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 12 })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    roundRect: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  };
  const canvas = {
    width: 960,
    height: 540,
    tabIndex: -1,
    getContext: vi.fn(() => context),
    addEventListener: vi.fn((type: string, listener: (event: ListenerEvent) => void) => canvasListeners.set(type, listener)),
    removeEventListener: vi.fn((type: string) => canvasListeners.delete(type)),
    setAttribute: vi.fn(),
    focus: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 960, height: 540 })),
  } as unknown as HTMLCanvasElement;
  const liveRegion = { textContent: '' } as HTMLElement;
  const onComplete = vi.fn();
  const fakeWindow = {
    addEventListener: vi.fn((type: string, listener: (event: ListenerEvent) => void) => windowListeners.set(type, listener)),
    removeEventListener: vi.fn((type: string) => windowListeners.delete(type)),
  };
  let animationCallback: FrameRequestCallback | null = null;

  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    animationCallback = callback;
    return 7;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('Image', class LoadedImage {
    complete = true;
    naturalWidth = 1024;
    naturalHeight = 1024;
    private source = '';

    set src(value: string) {
      this.source = value;
      if (value.includes('chapter01-yeongsu-guard-sprites')) {
        this.naturalWidth = 256;
        this.naturalHeight = 80;
      } else if (value.includes('chapter01-topview-')) {
        this.naturalWidth = 960;
        this.naturalHeight = 540;
      }
    }

    get src(): string {
      return this.source;
    }
  });

  const game = new Chapter1StoryGame(canvas, liveRegion, onComplete);
  return {
    game,
    canvas,
    context,
    liveRegion,
    keydown: (event: ListenerEvent) => windowListeners.get('keydown')?.(event),
    keyup: (event: ListenerEvent) => windowListeners.get('keyup')?.(event),
    click: (clientX = 480, clientY = 400) => canvasListeners.get('pointerdown')?.({ clientX, clientY }),
    renderFrame: (timestamp = 0) => animationCallback?.(timestamp),
    windowListeners,
    canvasListeners,
    onComplete,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Chapter1StoryGame', () => {
  it('renders the square Yeongsu title source at a contained 1:1 size', () => {
    const setupResult = setup();
    setupResult.game.mount();
    setupResult.renderFrame();

    expect(setupResult.context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 540, 540);
    expect((setupResult.context as unknown as { imageSmoothingEnabled: boolean }).imageSmoothingEnabled).toBe(true);
  });

  it('마운트 후 Z, Enter, 클릭 입력으로 진행하고 현재 내용을 알린다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    const preventDefault = vi.fn();
    setupResult.game.mount();

    expect(setupResult.liveRegion.textContent).toContain('새벽 3시 33분');
    setupResult.keydown({ code: 'KeyZ', repeat: false, preventDefault });
    expect(controls.currentIndex).toBe(1);
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault });
    expect(controls.currentIndex).toBe(1);
    const exploration = explorationForBeat(controls.currentIndex);
    expect(exploration).toBeDefined();
    controls.playerPosition = { ...exploration!.target };
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault });
    expect(controls.completedExplorations.has(1)).toBe(true);
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault });
    setupResult.click();

    expect(controls.currentIndex).toBe(3);
    expect(setupResult.liveRegion.textContent).toContain('가족사진');
    expect(preventDefault).toHaveBeenCalledTimes(4);
    expect(setupResult.canvas.focus).toHaveBeenCalledOnce();
  });

  it('반복 키를 무시하고 제목과 본문을 캔버스에 렌더링한다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();
    setupResult.renderFrame();
    setupResult.keydown({ code: 'KeyZ', repeat: true, preventDefault: vi.fn() });

    expect(controls.currentIndex).toBe(0);
    expect(setupResult.context.fillText).toHaveBeenCalledWith('새벽 3시 33분', 480, 242);

    setupResult.click();
    setupResult.renderFrame();
    expect(setupResult.context.fillText).toHaveBeenCalledWith(
      expect.stringContaining('김영수는 매일 밤'),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('Enter와 클릭에 즉시 확산 링을 표시하고 진행 불가 입력은 danger 피드백으로 구분한다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();

    setupResult.click(333, 250);
    expect(controls.inputFeedback?.kind).toBe('advance');
    expect(setupResult.context.arc).toHaveBeenCalledWith(333, 250, expect.any(Number), 0, Math.PI * 2);

    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    expect(controls.inputFeedback?.kind).toBe('blocked');
    expect(setupResult.context.arc).toHaveBeenCalledWith(872, 488, expect.any(Number), 0, Math.PI * 2);

    setupResult.renderFrame(0);
    setupResult.renderFrame(300);
    expect(controls.inputFeedback).toBeNull();
  });

  it('화면 밖 클릭 이동 좌표를 안전 범위로 보정하고 캐릭터 렌더를 플레이 영역으로 자른다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    const exploration = explorationForBeat(controls.currentIndex)!;

    setupResult.click(-500, -500);

    expect(controls.pointerTarget).toEqual({ x: 154, y: 172 });
    expect(controls.inputFeedback?.kind).toBe('move');
    expect(setupResult.context.rect).toHaveBeenCalledWith(136, 104, 764, 260);
    expect(setupResult.context.clip).toHaveBeenCalled();
    expect(exploration.target).toEqual({ x: 480, y: 204 });
  });

  it.each([
    ['키보드', (setupResult: ReturnType<typeof setup>) => {
      setupResult.keydown({ code: 'ArrowLeft', repeat: false, preventDefault: vi.fn() });
      setupResult.renderFrame(0);
      setupResult.renderFrame(100);
      setupResult.keyup({ code: 'ArrowLeft' });
    }],
    ['화면 클릭', (setupResult: ReturnType<typeof setup>, exploration: NonNullable<ReturnType<typeof explorationForBeat>>) => {
      setupResult.click(exploration.target.x, exploration.target.y);
      setupResult.renderFrame(0);
      setupResult.renderFrame(100);
    }],
  ])('%s 이동으로 목표에 도착하면 확인 입력을 live region에 한 번 안내한다', (_input, move) => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
    const exploration = explorationForBeat(controls.currentIndex)!;
    controls.playerPosition = { x: exploration.target.x + exploration.targetRadius + 5, y: exploration.target.y };

    move(setupResult, exploration);

    expect(setupResult.liveRegion.textContent).toContain('목표에 도착했습니다');
    expect(setupResult.liveRegion.textContent).toContain('Z, Enter 또는 클릭');
  });

  it.each([
    ['Enter', (setupResult: ReturnType<typeof setup>) => setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() })],
    ['클릭', (setupResult: ReturnType<typeof setup>) => setupResult.click()],
  ])('마지막 %s 확인도 피드백을 표시한 뒤 옥상 전환과 입력 정리를 한 번만 실행한다', (_input, finish) => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();

    while (controls.currentIndex < 48) {
      const exploration = explorationForBeat(controls.currentIndex);
      if (exploration && !controls.completedExplorations.has(controls.currentIndex)) {
        controls.playerPosition = { ...exploration.target };
        setupResult.keydown({ code: 'Enter', repeat: false, preventDefault: vi.fn() });
      } else {
        setupResult.click();
      }
    }

    finish(setupResult);

    expect(controls.complete).toBe(true);
    expect(setupResult.liveRegion.textContent).toContain('Chapter 01 끝');
    expect(controls.inputFeedback?.kind).toBe('advance');
    expect(setupResult.onComplete).not.toHaveBeenCalled();
    expect(setupResult.windowListeners.has('keydown')).toBe(true);

    setupResult.renderFrame(0);
    setupResult.renderFrame(300);

    expect(setupResult.windowListeners.has('keydown')).toBe(false);
    expect(setupResult.canvasListeners.has('pointerdown')).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(setupResult.onComplete).toHaveBeenCalledOnce();
  });
});
