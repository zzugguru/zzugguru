import type { Bounds } from '../shared/movement';
import type { InputState } from './input';

export interface Scene {
  update(input: InputState, deltaSeconds: number, bounds: Bounds): void;
  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void;
  isComplete(): boolean;
}

/** 직전 씬을 인자로 받는다 — 선택지 결과처럼 다음 씬이 이전 씬의 결과를 참조해야 할 때만 사용한다. */
export type SceneFactory = (previous: Scene | null) => Scene;

/** 챕터의 이벤트 순서를 순차 재생한다. 현재 씬이 끝났다고 알리면(isComplete) 다음 단계로 넘어간다. */
export class Sequence {
  private currentIndex = 0;
  private current: Scene;

  constructor(private readonly steps: SceneFactory[]) {
    if (steps.length === 0) {
      throw new Error('Sequence에는 최소 1개의 단계가 필요합니다.');
    }
    this.current = steps[0](null);
  }

  update(input: InputState, deltaSeconds: number, bounds: Bounds): void {
    this.current.update(input, deltaSeconds, bounds);
    this.advanceIfComplete();
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.current.render(context, canvas);
  }

  isComplete(): boolean {
    return this.currentIndex === this.steps.length - 1 && this.current.isComplete();
  }

  private advanceIfComplete(): void {
    if (!this.current.isComplete()) return;

    const nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.steps.length) return; // 마지막 단계는 완료 상태로 그대로 둔다

    const previous = this.current;
    this.currentIndex = nextIndex;
    this.current = this.steps[nextIndex](previous);
  }
}
