import { advanceDialogue } from '../shared/dialogue';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { renderDialogueBox, type DialogueLine } from '../shared/dialogueBox';

export type { DialogueLine };

export class DialogueScene implements Scene {
  private index = 0;
  private finished: boolean;

  constructor(private readonly lines: DialogueLine[]) {
    this.finished = lines.length === 0;
  }

  isComplete(): boolean {
    return this.finished;
  }

  update(input: InputState, _deltaSeconds: number, _bounds: Bounds): void {
    if (this.finished || !input.wasConfirmJustPressed()) return;

    const result = advanceDialogue(this.index, this.lines.length);
    this.index = result.index;
    this.finished = result.finished;
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (this.finished) {
      this.renderEndState(context, canvas);
      return;
    }

    renderDialogueBox(context, canvas, this.lines[this.index], 'Z ▶ 다음');
  }

  private renderEndState(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.textAlign = 'center';
    context.fillStyle = '#C7D2FE';
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('(대화 종료)', canvas.width / 2, canvas.height / 2);
  }
}
