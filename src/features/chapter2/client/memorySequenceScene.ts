import { advanceDialogue } from '../shared/dialogue';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';

const FRAME = { x: 280, y: 90, width: 400, height: 260 };

/**
 * 스스로 떠올리는 기억 조각을 한 번에 하나씩 순차로 보여준다. 말로 설명받는 게 아니라
 * 플레이어(영수)가 직접 하나씩 되짚어보는 구조 — 지금은 빈 프레임 + 짧은 텍스트로만 표현한다.
 */
export class MemorySequenceScene implements Scene {
  private index = 0;
  private finished: boolean;

  constructor(private readonly fragments: string[]) {
    this.finished = fragments.length === 0;
  }

  isComplete(): boolean {
    return this.finished;
  }

  update(input: InputState, _deltaSeconds: number, _bounds: Bounds): void {
    if (this.finished || !input.wasConfirmJustPressed()) return;

    const result = advanceDialogue(this.index, this.fragments.length);
    this.index = result.index;
    this.finished = result.finished;
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (this.finished) return;

    context.fillStyle = '#111827';
    context.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
    context.strokeStyle = '#374151';
    context.lineWidth = 4;
    context.strokeRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);

    context.textAlign = 'center';
    context.fillStyle = '#F9FAFB';
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(this.fragments[this.index], canvas.width / 2, FRAME.y + FRAME.height + 50);

    context.fillStyle = '#C7D2FE';
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(
      `Z ▶ 다음 기억 (${this.index + 1}/${this.fragments.length})`,
      canvas.width / 2,
      FRAME.y + FRAME.height + 80,
    );
  }
}
