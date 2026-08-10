import yeongsuIdentityUrl from '../../../assets/yeongsu-guard.png';
import apartmentStairwellUrl from '../assets/chapter01-apartment-stairwell.png';
import cctvWallBackgroundUrl from '../assets/chapter01-cctv-wall.png';
import guardRoomBackgroundUrl from '../assets/chapter01-guard-room.png';
import {
  CHAPTER01_STORY,
  advanceChapter01Story,
  type Chapter01Backdrop,
  type Chapter01StoryBeat,
} from '../shared/chapter01Story';
import { getContainedRasterGeometry } from '../shared/chapter01Assets';

const COLORS = {
  background: '#030712',
  surface: '#111827',
  surfaceAccent: '#312e81',
  border: '#374151',
  text: '#f9fafb',
  muted: '#c7d2fe',
  feedback: '#818cf8',
  danger: '#fb7185',
} as const;

const PANEL = { x: 24, y: 372, width: 912, height: 144, radius: 8 } as const;

export class Chapter1StoryGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly titleImage: HTMLImageElement | null;
  private readonly guardRoomImage: HTMLImageElement | null;
  private readonly cctvWallImage: HTMLImageElement | null;
  private readonly basementImage: HTMLImageElement | null;
  private animationId: number | null = null;
  private currentIndex = 0;
  private complete = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly liveRegion: HTMLElement,
    private readonly onComplete: () => void = () => undefined,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;

    this.titleImage = this.createImage(yeongsuIdentityUrl);
    this.guardRoomImage = this.createImage(guardRoomBackgroundUrl);
    this.cctvWallImage = this.createImage(cctvWallBackgroundUrl);
    this.basementImage = this.createImage(apartmentStairwellUrl);
  }

  private createImage(url: string): HTMLImageElement | null {
    if (typeof Image === 'undefined') return null;
    const image = new Image();
    image.src = url;
    return image;
  }

  private drawLoadedBackground(image: HTMLImageElement | null): boolean {
    if (!image?.complete || image.naturalWidth <= 0) return false;
    this.context.imageSmoothingEnabled = true;
    this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
    return true;
  }

  mount(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Chapter 01 새벽 3시 33분 스토리');
    this.announceCurrentBeat();

    if (this.animationId === null) this.animationId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.animationId = null;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!['KeyZ', 'Enter'].includes(event.code) || event.repeat) return;
    event.preventDefault();
    this.advance();
  };

  private readonly handlePointerDown = (): void => {
    this.canvas.focus();
    this.advance();
  };

  private advance(): void {
    const progress = advanceChapter01Story(this.currentIndex, CHAPTER01_STORY.length);
    this.currentIndex = progress.index;
    this.complete = progress.complete;
    this.announceCurrentBeat();

    if (this.complete) {
      this.render();
      this.stop();
      this.onComplete();
    }
  }

  private announceCurrentBeat(): void {
    const beat = CHAPTER01_STORY[this.currentIndex];
    const content = beat.speaker ? `${beat.speaker}. ${beat.text}` : beat.text;
    this.liveRegion.textContent = this.complete
      ? `${content} Chapter 01 끝.`
      : `${content} ${this.currentIndex + 1} / ${CHAPTER01_STORY.length}.`;
  }

  private readonly loop = (): void => {
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private render(): void {
    const beat = CHAPTER01_STORY[this.currentIndex];
    this.drawBackdrop(beat);
    this.drawHeader(beat);

    if (beat.backdrop === 'title') this.drawTitle();
    else this.drawStoryPanel(beat);
  }

  private drawBackdrop(beat: Chapter01StoryBeat): void {
    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (beat.backdrop === 'basement') this.drawBasement();
    else if (beat.backdrop === 'cctv' || beat.backdrop === 'epilogue') this.drawCctvWall(beat.backdrop);
    else if (beat.backdrop === 'whiteout') this.drawWhiteout();
    else if (beat.backdrop === 'morning') this.drawGuardRoom(true);
    else if (beat.backdrop === 'guard-room') this.drawGuardRoom(false);
    else this.drawTitleBackdrop();
  }

  private drawTitleBackdrop(): void {
    const gradient = this.context.createRadialGradient(480, 240, 20, 480, 240, 430);
    gradient.addColorStop(0, '#20204c');
    gradient.addColorStop(0.55, COLORS.surface);
    gradient.addColorStop(1, COLORS.background);
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.titleImage?.complete && this.titleImage.naturalWidth > 0) {
      const geometry = getContainedRasterGeometry(
        this.titleImage.naturalWidth,
        this.titleImage.naturalHeight,
        this.canvas.width,
        this.canvas.height,
        0,
      );
      this.context.imageSmoothingEnabled = true;
      this.context.drawImage(this.titleImage, geometry.x, geometry.y, geometry.width, geometry.height);
      this.context.fillStyle = 'rgb(3 7 18 / 68%)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.context.strokeStyle = 'rgb(129 140 248 / 18%)';
    for (let y = 0; y < this.canvas.height; y += 8) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.canvas.width, y);
      this.context.stroke();
    }
  }

  private drawGuardRoom(abandoned: boolean): void {
    const context = this.context;
    if (this.drawLoadedBackground(this.guardRoomImage)) {
      context.fillStyle = abandoned ? 'rgb(3 7 18 / 70%)' : 'rgb(3 7 18 / 20%)';
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    context.fillStyle = abandoned ? '#0b1018' : '#151b25';
    context.fillRect(0, 0, this.canvas.width, 372);
    context.fillStyle = '#090d14';
    context.fillRect(0, 292, this.canvas.width, 80);

    for (let index = 0; index < 12; index += 1) {
      const column = index % 6;
      const row = Math.floor(index / 6);
      const x = 40 + column * 119;
      const y = 48 + row * 92;
      context.fillStyle = abandoned ? '#07090d' : index === 8 ? '#172e2d' : '#0c1420';
      context.fillRect(x, y, 103, 72);
      context.strokeStyle = COLORS.border;
      context.strokeRect(x, y, 103, 72);
    }

    context.fillStyle = '#34251d';
    context.fillRect(148, 262, 664, 25);
    context.fillStyle = COLORS.surface;
    context.fillRect(690, 232, 62, 39);
    context.strokeStyle = abandoned ? COLORS.danger : COLORS.muted;
    context.strokeRect(698, 238, 46, 29);
    context.fillStyle = abandoned ? '#1a1014' : '#d4b39a';
    context.fillRect(702, 242, 38, 21);

    if (abandoned) {
      context.strokeStyle = COLORS.danger;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(705, 243);
      context.lineTo(738, 262);
      context.moveTo(735, 242);
      context.lineTo(711, 264);
      context.stroke();
      context.lineWidth = 1;
    }
  }

  private drawCctvWall(backdrop: Chapter01Backdrop): void {
    const context = this.context;
    if (this.drawLoadedBackground(this.cctvWallImage)) {
      context.fillStyle = 'rgb(3 7 18 / 38%)';
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      context.fillStyle = '#05080d';
      context.fillRect(0, 0, this.canvas.width, 372);

      for (let index = 0; index < 12; index += 1) {
        const column = index % 4;
        const row = Math.floor(index / 4);
        const x = 22 + column * 232;
        const y = 28 + row * 108;
        context.fillStyle = index === 9 ? '#101c22' : '#0b111a';
        context.fillRect(x, y, 216, 94);
        context.strokeStyle = index === 9 ? COLORS.feedback : COLORS.border;
        context.strokeRect(x, y, 216, 94);

        context.strokeStyle = 'rgb(199 210 254 / 8%)';
        for (let scanY = y + 7; scanY < y + 94; scanY += 9) {
          context.beginPath();
          context.moveTo(x, scanY);
          context.lineTo(x + 216, scanY);
          context.stroke();
        }
      }
    }

    const figureX = backdrop === 'epilogue' ? 561 : 690;
    context.fillStyle = '#090a0e';
    context.beginPath();
    context.ellipse(figureX, 269, 16, 34, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(figureX, 224, 14, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = COLORS.danger;
    context.font = '700 13px monospace';
    context.textAlign = 'right';
    context.fillText('03:33:00', 924, 354);
  }

  private drawBasement(): void {
    if (!this.drawLoadedBackground(this.basementImage)) {
      const gradient = this.context.createLinearGradient(0, 0, 0, 372);
      gradient.addColorStop(0, '#17262d');
      gradient.addColorStop(1, '#070b11');
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, this.canvas.width, 372);
    }

    this.context.fillStyle = 'rgb(3 7 18 / 44%)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawWhiteout(): void {
    const gradient = this.context.createRadialGradient(480, 180, 10, 480, 180, 520);
    gradient.addColorStop(0, '#f9fafb');
    gradient.addColorStop(0.28, '#c7d2fe');
    gradient.addColorStop(1, '#312e81');
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, 372);
  }

  private drawHeader(beat: Chapter01StoryBeat): void {
    const context = this.context;
    context.textAlign = 'left';
    context.fillStyle = COLORS.muted;
    context.font = '700 13px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('CHAPTER 01 · 새벽 3시 33분', 24, 24);

    context.textAlign = 'right';
    context.fillStyle = beat.timestamp === '03:33' ? COLORS.danger : COLORS.muted;
    context.font = '700 13px monospace';
    context.fillText(
      beat.timestamp ?? `${String(this.currentIndex + 1).padStart(2, '0')} / ${CHAPTER01_STORY.length}`,
      this.canvas.width - 24,
      24,
    );
  }

  private drawTitle(): void {
    const context = this.context;
    context.textAlign = 'center';
    context.fillStyle = COLORS.feedback;
    context.font = '700 15px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('김영수의 마지막 야간 근무', 480, 180);
    context.fillStyle = COLORS.text;
    context.font = '700 48px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('새벽 3시 33분', 480, 242);
    context.fillStyle = COLORS.muted;
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('Z · Enter · 화면 클릭으로 시작', 480, 304);
  }

  private drawStoryPanel(beat: Chapter01StoryBeat): void {
    const context = this.context;
    context.fillStyle = 'rgb(17 24 39 / 96%)';
    context.beginPath();
    context.roundRect(PANEL.x, PANEL.y, PANEL.width, PANEL.height, PANEL.radius);
    context.fill();
    context.strokeStyle = beat.backdrop === 'epilogue' ? COLORS.danger : COLORS.border;
    context.stroke();

    context.textAlign = 'left';
    let textY = PANEL.y + 40;
    if (beat.speaker) {
      context.fillStyle = COLORS.feedback;
      context.font = '700 16px Inter, Pretendard, system-ui, sans-serif';
      context.fillText(beat.speaker, PANEL.x + 20, textY);
      textY += 30;
    }

    context.fillStyle = COLORS.text;
    context.font = `${beat.speaker ? '' : 'italic '}20px Inter, Pretendard, system-ui, sans-serif`;
    this.drawWrappedText(beat.text, PANEL.x + 20, textY, PANEL.width - 40, 29);

    context.textAlign = 'right';
    context.fillStyle = this.complete ? COLORS.danger : COLORS.muted;
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(
      this.complete ? 'CHAPTER 01 · 끝' : 'Z · Enter · 클릭  ▶ 다음',
      PANEL.x + PANEL.width - 20,
      PANEL.y + PANEL.height - 16,
    );
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = [...text];
    let line = '';
    let lineIndex = 0;

    for (const character of words) {
      const candidate = line + character;
      if (line && this.context.measureText(candidate).width > maxWidth) {
        this.context.fillText(line, x, y + lineIndex * lineHeight);
        line = character;
        lineIndex += 1;
      } else {
        line = candidate;
      }
    }

    if (line) this.context.fillText(line, x, y + lineIndex * lineHeight);
  }
}
