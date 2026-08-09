import { advanceDialogue } from '../shared/dialogue';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { renderDialogueBox, type DialogueLine } from '../shared/dialogueBox';
import { renderPhotoFrame } from '../shared/photoFrame';

const LINES: DialogueLine[] = [
  { speaker: '영수', text: '따라가면…… 지구에서의 기억은 어떻게 되는 거지?' },
  { speaker: '외계 누나', text: '전부 그대로 남아. 잊게 만들지 않을게.' },
  { speaker: '영수', text: '그들의 흔적이라도…… 가지고 갈 수 있을까?' },
  { speaker: '외계 어머니', text: '네게 가족이 되어준 이들이라면, 우리에게도 소중한 사람들이야.' },
  { speaker: '', text: '영수가 사진을 가슴에 꼭 끌어안는다.' },
];

/** 떠나기 전 마지막으로, 지구의 흔적을 가져갈 수 있는지 묻고 사진을 품에 안으며 마무리한다. */
export class MemoryPreservationScene implements Scene {
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
    renderDialogueBox(context, canvas, LINES[this.index], 'Z ▶ 다음');
  }
}
