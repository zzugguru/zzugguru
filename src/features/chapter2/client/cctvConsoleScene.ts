import { cycleIndex } from '../shared/selection';
import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';

interface CctvChannel {
  label: string;
}

interface CctvRound {
  /** 이번 라운드에 귀신이 나타나는 채널의 인덱스. */
  channelIndex: number;
  /** 정답 채널에서 확인했을 때 보여줄 독백. 회차가 지날수록 감정이 고조된다. */
  monologue: string;
}

const CHANNELS: CctvChannel[] = [{ label: '지하주차장' }, { label: '1층 로비' }, { label: '경비실 앞' }];

const ROUNDS: CctvRound[] = [
  { channelIndex: 0, monologue: '왜 자꾸…… 눈이 가지.' },
  { channelIndex: 1, monologue: '가슴이 이상하게 저릿하다.' },
  { channelIndex: 2, monologue: '몸속 깊은 곳에서, 뭔가가 깨어나려 한다.' },
];

const SCREEN = { x: 180, y: 80, width: 600, height: 340 };

/** CCTV 콘솔 — 좌/우로 채널을 넘겨가며, 매 라운드 정답 채널에서 귀신을 확인해야 다음 라운드로 넘어간다. */
export class CctvConsoleScene implements Scene {
  private currentChannel = 0;
  private currentRound = 0;
  private activeMessage: string | null = null;

  isComplete(): boolean {
    return this.activeMessage === null && this.currentRound >= ROUNDS.length;
  }

  update(input: InputState, _deltaSeconds: number, _bounds: Bounds): void {
    if (this.activeMessage !== null) {
      if (input.wasConfirmJustPressed()) {
        this.activeMessage = null;
        this.currentRound += 1;
      }
      return;
    }

    if (this.currentRound >= ROUNDS.length) return;

    if (input.wasLeftJustPressed()) {
      this.currentChannel = cycleIndex(this.currentChannel, -1, CHANNELS.length);
    }
    if (input.wasRightJustPressed()) {
      this.currentChannel = cycleIndex(this.currentChannel, 1, CHANNELS.length);
    }

    if (input.wasConfirmJustPressed() && this.currentChannel === ROUNDS[this.currentRound].channelIndex) {
      this.activeMessage = ROUNDS[this.currentRound].monologue;
    }
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#111827';
    context.fillRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);
    context.strokeStyle = '#374151';
    context.lineWidth = 4;
    context.strokeRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);

    context.textAlign = 'center';
    context.fillStyle = '#F9FAFB';
    context.font = 'bold 18px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(
      `${this.currentChannel + 1} / ${CHANNELS.length} · ${CHANNELS[this.currentChannel].label}`,
      canvas.width / 2,
      SCREEN.y + SCREEN.height + 40,
    );

    context.fillStyle = '#C7D2FE';
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('◀ ▶ 채널 전환 · Z 확인', canvas.width / 2, SCREEN.y + SCREEN.height + 70);

    if (this.activeMessage !== null) {
      this.renderMessageOverlay(context, canvas, this.activeMessage);
    }
  }

  private renderMessageOverlay(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    message: string,
  ): void {
    context.fillStyle = 'rgb(3 7 18 / 85%)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textAlign = 'center';
    context.fillStyle = '#F9FAFB';
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    context.fillStyle = '#C7D2FE';
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('Z ▶ 계속', canvas.width / 2, canvas.height / 2 + 40);
  }
}
