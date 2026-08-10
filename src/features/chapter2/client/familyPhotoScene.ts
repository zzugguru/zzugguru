import { advanceDialogue } from '../shared/dialogue';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { renderDialogueBox, type DialogueLine } from '../shared/dialogueBox';
import { renderPhotoFrame } from '../shared/photoFrame';

const LINES: DialogueLine[] = [
  { speaker: '외계 누나', text: '이제 우리와 함께 갈 시간이야.' },
  { speaker: '영수', text: '내가 있어야 할 곳이 거기라고?' },
  { speaker: '외계 아버지', text: '그들과 너는 애초에 다른 존재야.' },
  { speaker: '', text: '영수가 품속에서 낡은 사진 한 장을 꺼낸다.' },
  { speaker: '영수', text: '이 사람들이 내 진짜 가족이야.' },
  { speaker: '외계 아버지', text: '그들은 이제 이 세상에 없다.' },
  { speaker: '영수', text: '떠났다고 가족이 아닌 건 아니잖아.' },
];

/** 사진을 꺼내 보여주는 순간(4번째 줄)부터 화면에 사진이 남아있고, 대화가 끝나면 사진도 함께 사라진다. */
const PHOTO_REVEAL_INDEX = 3;

export class FamilyPhotoScene implements Scene {
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

    if (this.index >= PHOTO_REVEAL_INDEX) {
      renderPhotoFrame(context, canvas);
    }
    renderDialogueBox(context, canvas, LINES[this.index], 'E/Enter ▶ 다음');
  }
}
