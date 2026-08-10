import { advanceDialogue } from '../shared/dialogue';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { renderDialogueBox, type DialogueLine } from '../shared/dialogueBox';
import { renderPhotoFrame } from '../shared/photoFrame';

/** 화자 없이(독백) 한 줄씩 — 경비일지를 발견한 이의 내면 목소리로 읽는다. */
const LINES: DialogueLine[] = [
  { speaker: '', text: '마지막 장에는 그가 쓰지 않은 문장이 적혀 있다.' },
  { speaker: '', text: '3시 33분. 특이 사항 있음.' },
  { speaker: '', text: '오래전에 잃어버린 가족이 찾아왔다.' },
  { speaker: '', text: '금일부로 야간 근무를 종료함.' },
];

/** 경비일지를 사진처럼 화면에 띄운 채, 그 위로 독백이 한 줄씩 겹쳐 진행된다. */
export class DutyLogReadingScene implements Scene {
  private index = 0;
  private finished = false;

  isComplete(): boolean {
    return this.finished;
  }

  update(input: InputState, _deltaSeconds: number, _bounds: Bounds): void {
    if (this.finished || !input.wasConfirmJustPressed()) return;

    const result = advanceDialogue(this.index, LINES.length);
    this.index = result.index;
    this.finished = result.finished;
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (this.finished) return;

    renderPhotoFrame(context, canvas);
    renderDialogueBox(context, canvas, LINES[this.index], 'E/Enter ▶ 다음');
  }
}
