export type RenderFrame = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
) => void;

/** 기능 코드를 실행하는 최소 브라우저 게임 루프입니다. */
export class Game {
  private readonly context: CanvasRenderingContext2D;
  private animationId: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderFrame: RenderFrame,
  ) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context를 만들 수 없습니다.');
    }

    this.context = context;
  }

  start(): void {
    if (this.animationId === null) {
      this.animationId = requestAnimationFrame(this.loop);
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private readonly loop = (): void => {
    this.renderFrame(this.context, this.canvas);
    this.animationId = requestAnimationFrame(this.loop);
  };
}
