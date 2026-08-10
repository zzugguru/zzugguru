import type { Bounds } from '../shared/movement';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { createLoadedImage } from './mapVisuals';

interface CctvChannel {
  label: string;
  assetUrl: string;
  observedAt: string;
  signal: string;
}

interface CctvRound {
  /** 이번 라운드에 귀신이 나타나는 채널의 인덱스. */
  channelIndex: number;
  /** 정답 채널에서 확인했을 때 보여줄 독백. 회차가 지날수록 감정이 고조된다. */
  monologue: string;
}

export const CCTV_CHANNEL_ASSET_PATHS = [
  new URL('../assets/cctv-parking-memory.png', import.meta.url).href,
  new URL('../assets/cctv-lobby-memory.png', import.meta.url).href,
  new URL('../assets/cctv-guard-door-memory.png', import.meta.url).href,
] as const;

const CHANNELS: CctvChannel[] = [
  { label: '지하주차장', assetUrl: CCTV_CHANNEL_ASSET_PATHS[0], observedAt: '04:13', signal: '신호 미약' },
  { label: '1층 로비', assetUrl: CCTV_CHANNEL_ASSET_PATHS[1], observedAt: '04:16', signal: '신호 불안정' },
  { label: '경비실 앞', assetUrl: CCTV_CHANNEL_ASSET_PATHS[2], observedAt: '04:19', signal: '신호 왜곡' },
];

const ROUNDS: CctvRound[] = [
  { channelIndex: 0, monologue: '왜 자꾸…… 눈이 가지.' },
  { channelIndex: 1, monologue: '가슴이 이상하게 저릿하다.' },
  { channelIndex: 2, monologue: '몸속 깊은 곳에서, 뭔가가 깨어나려 한다.' },
];

const SCREEN = { x: 180, y: 80, width: 600, height: 340 };

export function drawCctvMemoryImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
): boolean {
  if (!image?.complete || image.naturalWidth !== SCREEN.width || image.naturalHeight !== SCREEN.height) return false;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);
  return true;
}

export function clampCctvChannel(current: number, delta: number): number {
  return Math.max(0, Math.min(CHANNELS.length - 1, current + delta));
}

/** CCTV 콘솔 — 좌/우로 채널을 넘겨가며, 매 라운드 정답 채널에서 귀신을 확인해야 다음 라운드로 넘어간다. */
export class CctvConsoleScene implements Scene {
  private currentChannel = 0;
  private currentRound = 0;
  private activeMessage: string | null = null;
  private feedback = '첫 번째 CCTV 화면을 확인하세요.';
  private readonly channelImages = CHANNELS.map((channel) => createLoadedImage(channel.assetUrl));

  isComplete(): boolean {
    return this.activeMessage === null && this.currentRound >= ROUNDS.length;
  }

  update(input: InputState, _deltaSeconds: number, _bounds: Bounds): void {
    if (this.activeMessage !== null) {
      if (input.wasConfirmJustPressed()) {
        this.activeMessage = null;
        this.currentRound += 1;
        if (this.currentRound < ROUNDS.length) {
          this.currentChannel = ROUNDS[this.currentRound].channelIndex;
          this.feedback = `다음 CCTV 화면으로 이동했습니다: ${CHANNELS[this.currentChannel].label}`;
        }
      }
      return;
    }

    if (this.currentRound >= ROUNDS.length) return;

    if (input.wasLeftJustPressed()) {
      const next = clampCctvChannel(this.currentChannel, -1);
      this.feedback = next === this.currentChannel ? '첫 번째 CCTV 화면입니다.' : `${CHANNELS[next].label} 화면입니다.`;
      this.currentChannel = next;
    }
    if (input.wasRightJustPressed()) {
      const next = clampCctvChannel(this.currentChannel, 1);
      this.feedback = next === this.currentChannel ? '마지막 CCTV 화면입니다.' : `${CHANNELS[next].label} 화면입니다.`;
      this.currentChannel = next;
    }

    if (input.wasConfirmJustPressed() && this.currentChannel === ROUNDS[this.currentRound].channelIndex) {
      this.activeMessage = ROUNDS[this.currentRound].monologue;
      return;
    }
    if (input.wasConfirmJustPressed()) {
      const target = CHANNELS[ROUNDS[this.currentRound].channelIndex].label;
      this.feedback = `이 화면에는 신호가 없습니다. ${target} 화면을 확인하세요.`;
    }
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#111827';
    context.fillRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);
    drawCctvMemoryImage(context, this.channelImages[this.currentChannel]);
    context.strokeStyle = '#374151';
    context.lineWidth = 4;
    context.strokeRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);
    this.renderCctvHud(context);

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
    context.fillText('◀ ▶ 채널 전환 · E/Enter 확인', canvas.width / 2, SCREEN.y + SCREEN.height + 70);

    context.fillStyle = '#818CF8';
    context.font = '14px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(
      this.currentRound < ROUNDS.length ? `확인 단계 ${this.currentRound + 1} / ${ROUNDS.length} · ${this.feedback}` : 'CCTV 확인 완료',
      canvas.width / 2,
      52,
    );

    if (this.activeMessage !== null) {
      this.renderMessageOverlay(context, canvas, this.activeMessage);
    }
  }

  private renderCctvHud(context: CanvasRenderingContext2D): void {
    const channel = CHANNELS[this.currentChannel];
    context.fillStyle = 'rgb(3 7 18 / 10%)';
    for (let y = SCREEN.y + 2; y < SCREEN.y + SCREEN.height; y += 4) {
      context.fillRect(SCREEN.x, y, SCREEN.width, 1);
    }
    context.fillStyle = 'rgb(3 7 18 / 72%)';
    context.fillRect(SCREEN.x + 12, SCREEN.y + 12, 230, 30);
    context.fillRect(SCREEN.x + SCREEN.width - 210, SCREEN.y + 12, 198, 30);
    context.textAlign = 'left';
    context.fillStyle = '#F9FAFB';
    context.font = 'bold 14px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(`CH ${this.currentChannel + 1} · ${channel.label}`, SCREEN.x + 22, SCREEN.y + 33);
    context.textAlign = 'right';
    context.fillStyle = this.currentChannel === 2 ? '#FB7185' : '#C7D2FE';
    context.fillText(`${channel.observedAt} · ${channel.signal}`, SCREEN.x + SCREEN.width - 22, SCREEN.y + 33);
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
    context.fillText('E/Enter ▶ 계속', canvas.width / 2, canvas.height / 2 + 40);
  }
}
