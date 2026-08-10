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
  cctvAnomalyImage: HTMLImageElement;
  guardRoomHauntingImage: HTMLImageElement;
  whiteoutApparitionImage: HTMLImageElement;
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
  it('fills screen 01 with the square Yeongsu artwork at a covered 1:1 size', () => {
    const setupResult = setup();
    setupResult.game.mount();
    setupResult.renderFrame();

    expect(setupResult.context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, -105, 960, 960);
    expect((setupResult.context as unknown as { imageSmoothingEnabled: boolean }).imageSmoothingEnabled).toBe(true);
  });

  it('uses generated scene plates on eligible pages and preserves excluded page 3', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();

    controls.currentIndex = 7;
    setupResult.renderFrame();
    expect(setupResult.context.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('chapter01-story-cctv-anomaly') }),
      0,
      0,
      960,
      540,
    );

    setupResult.context.drawImage.mockClear();
    controls.currentIndex = 2;
    setupResult.renderFrame(16);
    expect(setupResult.context.drawImage.mock.calls.some(
      ([image]) => String((image as { src?: string }).src).includes('chapter01-story-'),
    )).toBe(false);
  });

  it('falls back to the existing renderer when generated scene plates are unavailable', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();

    for (const image of [controls.cctvAnomalyImage, controls.guardRoomHauntingImage, controls.whiteoutApparitionImage]) {
      Object.defineProperties(image, {
        complete: { value: false, configurable: true },
        naturalWidth: { value: 0, configurable: true },
      });
    }

    controls.currentIndex = 7;
    setupResult.renderFrame();
    expect(setupResult.context.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('chapter01-cctv-wall') }),
      0,
      0,
      960,
      540,
    );

    setupResult.context.drawImage.mockClear();
    controls.currentIndex = 38;
    setupResult.renderFrame(16);
    expect(setupResult.context.drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('chapter01-topview-guard-room') }),
      0,
      0,
      960,
      540,
    );

    setupResult.context.drawImage.mockClear();
    controls.currentIndex = 39;
    setupResult.renderFrame(32);
    expect(setupResult.context.drawImage.mock.calls.some(
      ([image]) => String((image as { src?: string }).src).includes('chapter01-yeongsu-guard-sprites'),
    )).toBe(true);
    expect(setupResult.context.drawImage.mock.calls.some(
      ([image]) => String((image as { src?: string }).src).includes('chapter01-story-'),
    )).toBe(false);
  });

  it('마운트 후 E, Enter, 클릭 입력으로 진행하고 현재 내용을 알린다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    const preventDefault = vi.fn();
    setupResult.game.mount();

    expect(setupResult.liveRegion.textContent).toContain('새벽 3시 33분');
    setupResult.keydown({ code: 'KeyZ', repeat: false, preventDefault });
    expect(controls.currentIndex).toBe(0);
    setupResult.keydown({ code: 'KeyE', repeat: false, preventDefault });
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
    setupResult.keydown({ code: 'KeyE', repeat: true, preventDefault: vi.fn() });

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
    expect(exploration.target).toEqual({ x: 480, y: 316 });
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
    expect(setupResult.liveRegion.textContent).toContain('E, Enter 또는 클릭');
  });

  it('41·42번 지지직 효과는 캐릭터를 고정하고 대사 패널보다 먼저 상단에만 그린다', () => {
    const setupResult = setup();
    const controls = setupResult.game as unknown as StoryGameControls;
    setupResult.game.mount();
    controls.currentIndex = 40;

    setupResult.renderFrame(0);
    const firstSpriteCall = setupResult.context.drawImage.mock.calls.find(
      ([image]) => (image as { naturalWidth?: number }).naturalWidth === 256,
    );
    const interferenceCalls = setupResult.context.fillRect.mock.calls.filter(
      ([, , , height]) => Number(height) <= 11,
    );
    const panelCallOrder = setupResult.context.roundRect.mock.invocationCallOrder.at(-1)!;

    expect(firstSpriteCall?.slice(5, 7)).toEqual([448, 136]);
    expect(interferenceCalls.length).toBeGreaterThan(0);
    for (const [, y, , height] of interferenceCalls) {
      expect(Number(y) + Number(height)).toBeLessThanOrEqual(372);
    }
    expect(setupResult.context.fillRect.mock.invocationCallOrder.at(-1)).toBeLessThan(panelCallOrder);

    setupResult.context.drawImage.mockClear();
    setupResult.renderFrame(100);
    const laterSpriteCall = setupResult.context.drawImage.mock.calls.find(
      ([image]) => (image as { naturalWidth?: number }).naturalWidth === 256,
    );
    expect(laterSpriteCall?.slice(5, 7)).toEqual(firstSpriteCall?.slice(5, 7));
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
