import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chapter1StoryGame } from './Chapter1StoryGame';

interface StoryGameControls {
  currentIndex: number;
  complete: boolean;
  advance(): void;
}

interface ListenerEvent {
  code?: string;
  repeat?: boolean;
  preventDefault?: () => void;
}

function setup() {
  const windowListeners = new Map<string, (event: ListenerEvent) => void>();
  const canvasListeners = new Map<string, () => void>();
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
    drawImage: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 12 })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    roundRect: vi.fn(),
  };
  const canvas = {
    width: 960,
    height: 540,
    tabIndex: -1,
    getContext: vi.fn(() => context),
    addEventListener: vi.fn((type: string, listener: () => void) => canvasListeners.set(type, listener)),
    removeEventListener: vi.fn((type: string) => canvasListeners.delete(type)),
    setAttribute: vi.fn(),
    focus: vi.fn(),
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
    src = '';
  });

  const game = new Chapter1StoryGame(canvas, liveRegion, onComplete);
  return {
    game,
    canvas,
    context,
    liveRegion,
    keydown: (event: ListenerEvent) => windowListeners.get('keydown')?.(event),
    click: () => canvasListeners.get('pointerdown')?.(),
    renderFrame: () => animationCallback?.(0),
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
    setupResult.keydown({ code: 'Enter', repeat: false, preventDefault });
    setupResult.click();

    expect(controls.currentIndex).toBe(3);
    expect(setupResult.liveRegion.textContent).toContain('가족사진');
    expect(preventDefault).toHaveBeenCalledTimes(2);
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

  it('마지막 확인 후 끝 상태를 알리고 렌더 루프와 입력을 정리한다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();

    for (let index = 0; index < 100; index += 1) setupResult.click();

    expect(controls.complete).toBe(true);
    expect(setupResult.liveRegion.textContent).toContain('Chapter 01 끝');
    expect(setupResult.windowListeners.has('keydown')).toBe(false);
    expect(setupResult.canvasListeners.has('pointerdown')).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(setupResult.onComplete).toHaveBeenCalledOnce();
  });
});
