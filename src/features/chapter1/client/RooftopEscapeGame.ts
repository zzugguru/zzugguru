import apartmentStairwellUrl from '../assets/chapter01-apartment-stairwell.png';
import rooftopBackgroundUrl from '../assets/chapter01-rooftop.png';
import monsterSpriteUrl from '../assets/cctv-monster-sprite.png';
import yeongsuSpriteUrl from '../assets/yeongsu-guard-sprite.png';
import {
  CHAPTER01_SPRITES,
  getSpriteDrawGeometry,
  type Chapter01SpriteMetadata,
} from '../shared/chapter01Assets';
import {
  ESCAPE_FLOORS,
  createRooftopEscapeState,
  exitXForFloor,
  stepRooftopEscape,
  type RooftopEscapeState,
} from '../shared/rooftopEscapeLogic';

type EscapeScreen = 'intro' | 'playing' | 'caught' | 'escaped';

const COLORS = {
  background: '#030712',
  surface: '#111827',
  primary: '#312e81',
  feedback: '#818cf8',
  danger: '#fb7185',
  text: '#f9fafb',
  muted: '#c7d2fe',
  border: '#374151',
} as const;

export class RooftopEscapeGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly backgroundImage: HTMLImageElement | null;
  private readonly rooftopImage: HTMLImageElement | null;
  private readonly playerImage: HTMLImageElement | null;
  private readonly monsterImage: HTMLImageElement | null;
  private state: RooftopEscapeState = createRooftopEscapeState();
  private screen: EscapeScreen = 'intro';
  private animationId: number | null = null;
  private lastTimestamp: number | null = null;
  private leftPressed = false;
  private rightPressed = false;
  private pointerDirection: -1 | 0 | 1 = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly liveRegion: HTMLElement,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;

    this.backgroundImage = this.createImage(apartmentStairwellUrl);
    this.rooftopImage = this.createImage(rooftopBackgroundUrl);
    this.playerImage = this.createImage(yeongsuSpriteUrl);
    this.monsterImage = this.createImage(monsterSpriteUrl);
  }

  mount(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.releaseInput);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Chapter 01 옥상 탈출 추격 게임');
    this.announceIntro();

    if (this.animationId === null) this.animationId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.releaseInput);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.releaseInput();
  }

  private createImage(url: string): HTMLImageElement | null {
    if (typeof Image === 'undefined') return null;
    const image = new Image();
    image.src = url;
    return image;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.code === 'Enter' || event.code === 'Space') && this.screen !== 'playing') {
      event.preventDefault();
      if (!event.repeat) this.startEscape();
      return;
    }

    if (this.screen !== 'playing') return;
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault();
      this.leftPressed = true;
    }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault();
      this.rightPressed = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.leftPressed = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.rightPressed = false;
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.canvas.focus();
    if (this.screen !== 'playing') {
      this.startEscape();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    this.pointerDirection = canvasX < this.canvas.width / 2 ? -1 : 1;
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerUp = (): void => {
    this.pointerDirection = 0;
  };

  private readonly releaseInput = (): void => {
    this.leftPressed = false;
    this.rightPressed = false;
    this.pointerDirection = 0;
  };

  private startEscape(): void {
    this.state = createRooftopEscapeState();
    this.screen = 'playing';
    this.lastTimestamp = null;
    this.releaseInput();
    this.announceFloor();
  }

  private readonly loop = (timestamp: number): void => {
    const deltaSeconds = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.update(deltaSeconds);
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void {
    if (this.screen !== 'playing') return;

    const previousFloor = this.state.floorIndex;
    this.state = stepRooftopEscape(this.state, this.direction, deltaSeconds);
    if (this.state.floorIndex !== previousFloor) this.announceFloor();

    if (this.state.result === 'caught') {
      this.screen = 'caught';
      this.releaseInput();
      this.liveRegion.textContent = '괴물에게 붙잡혔습니다. Enter 또는 화면 클릭으로 다시 도망치세요.';
    } else if (this.state.result === 'escaped') {
      this.screen = 'escaped';
      this.releaseInput();
      this.liveRegion.textContent = '옥상 문이 열렸습니다. 영수가 괴물에게서 탈출했습니다.';
    }
  }

  private get direction(): -1 | 0 | 1 {
    if (this.pointerDirection !== 0) return this.pointerDirection;
    if (this.leftPressed === this.rightPressed) return 0;
    return this.leftPressed ? -1 : 1;
  }

  private announceIntro(): void {
    this.liveRegion.textContent = '영수가 주위를 둘러보자 멀리 여자의 형체가 보였습니다. 사람처럼 보이지 않습니다. 옥상까지 도망치세요.';
  }

  private announceFloor(): void {
    const floor = ESCAPE_FLOORS[this.state.floorIndex];
    const direction = exitXForFloor(this.state.floorIndex) > this.state.playerX ? '오른쪽' : '왼쪽';
    this.liveRegion.textContent = `${floor}. ${direction} 계단까지 이동하세요. 괴물이 뒤에서 쫓아옵니다.`;
  }

  private render(): void {
    if (this.screen === 'escaped') this.drawRooftop();
    else this.drawCorridor();

    if (this.screen === 'intro') this.drawIntro();
    else if (this.screen === 'playing') this.drawHud();
    else if (this.screen === 'caught') this.drawResult(false);
    else this.drawResult(true);
  }

  private drawCorridor(): void {
    const context = this.context;
    const backgroundLoaded = Boolean(this.backgroundImage?.complete && this.backgroundImage.naturalWidth > 0);
    if (backgroundLoaded && this.backgroundImage) {
      context.imageSmoothingEnabled = true;
      context.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      const gradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, COLORS.primary);
      gradient.addColorStop(1, COLORS.background);
      context.fillStyle = gradient;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.fillStyle = COLORS.background;
      context.fillRect(0, 390, this.canvas.width, 150);
    }

    context.fillStyle = `rgb(3 7 18 / ${42 + this.state.floorIndex * 6}%)`;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawStairDoor(exitXForFloor(this.state.floorIndex));
    this.drawCharacter(this.playerImage, this.state.playerX, 402, CHAPTER01_SPRITES.yeongsu, false);
    this.drawCharacter(this.monsterImage, this.state.monsterX, 406, CHAPTER01_SPRITES.monster, true);
  }

  private drawStairDoor(x: number): void {
    const context = this.context;
    context.fillStyle = 'rgb(17 24 39 / 34%)';
    context.fillRect(x - 48, 218, 96, 174);
    context.strokeStyle = COLORS.feedback;
    context.lineWidth = 3;
    context.strokeRect(x - 48, 218, 96, 174);
    context.fillStyle = 'rgb(251 113 133 / 90%)';
    context.fillRect(x - 35, 232, 70, 24);
    context.textAlign = 'center';
    context.fillStyle = COLORS.text;
    context.font = '700 12px monospace';
    context.fillText('STAIRS ↑', x, 249);
    context.fillStyle = COLORS.feedback;
    context.beginPath();
    context.arc(x + 27, 310, 4, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = 1;
  }

  private drawCharacter(
    image: HTMLImageElement | null,
    x: number,
    floorY: number,
    metadata: Chapter01SpriteMetadata,
    monster: boolean,
  ): void {
    const context = this.context;
    const geometry = getSpriteDrawGeometry(metadata, x, floorY);
    context.save();
    if (monster) {
      context.shadowColor = COLORS.danger;
      context.shadowBlur = 18;
    }

    if (image?.complete && image.naturalWidth > 0) {
      context.imageSmoothingEnabled = true;
      context.drawImage(image, geometry.x, geometry.y, geometry.width, geometry.height);
    } else {
      context.fillStyle = monster ? COLORS.background : COLORS.primary;
      context.beginPath();
      context.ellipse(
        x,
        floorY - metadata.renderHeight / 2,
        monster ? 28 : 19,
        metadata.renderHeight / 2,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  }

  private drawHud(): void {
    const context = this.context;
    context.fillStyle = 'rgb(3 7 18 / 90%)';
    context.fillRect(0, 0, this.canvas.width, 72);
    context.textAlign = 'left';
    context.fillStyle = COLORS.text;
    context.font = '700 20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(`${ESCAPE_FLOORS[this.state.floorIndex]} → ROOFTOP`, 24, 30);
    context.fillStyle = COLORS.danger;
    context.font = '14px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('뒤를 보지 말고 계단까지 달려라', 24, 54);

    context.textAlign = 'right';
    context.fillStyle = COLORS.muted;
    context.font = '13px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('A / D · ← / → · 화면 좌우', 936, 30);
    context.fillStyle = COLORS.border;
    context.fillRect(720, 44, 216, 8);
    context.fillStyle = COLORS.feedback;
    context.fillRect(720, 44, 216 * ((this.state.floorIndex + 1) / ESCAPE_FLOORS.length), 8);

    this.drawTouchControl(18, 468, 220, '◀', '왼쪽으로 달리기');
    this.drawTouchControl(722, 468, 220, '▶', '오른쪽으로 달리기');
  }

  private drawTouchControl(x: number, y: number, width: number, key: string, label: string): void {
    const context = this.context;
    context.fillStyle = 'rgb(17 24 39 / 94%)';
    context.fillRect(x, y, width, 52);
    context.strokeStyle = COLORS.border;
    context.strokeRect(x, y, width, 52);
    context.textAlign = 'center';
    context.fillStyle = COLORS.feedback;
    context.font = '700 18px monospace';
    context.fillText(key, x + 28, y + 32);
    context.fillStyle = COLORS.text;
    context.font = '13px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(label, x + 126, y + 32);
  }

  private drawIntro(): void {
    const context = this.context;
    context.fillStyle = 'rgb(3 7 18 / 82%)';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.save();
    context.globalAlpha = 0.72;
    this.drawCharacter(this.monsterImage, 820, 420, CHAPTER01_SPRITES.monster, true);
    context.restore();
    context.textAlign = 'center';
    context.fillStyle = COLORS.muted;
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('영수가 주위를 둘러보았다.', 480, 142);
    context.fillText('저 멀리 여자의 형체가 보였다.', 480, 182);
    context.fillStyle = COLORS.danger;
    context.font = '700 26px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('하지만 저건 사람이 아니다.', 480, 236);
    context.fillStyle = COLORS.text;
    context.font = '700 42px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('옥상까지 도망쳐라', 480, 302);
    context.fillStyle = COLORS.primary;
    context.fillRect(306, 346, 348, 58);
    context.strokeStyle = COLORS.feedback;
    context.strokeRect(306, 346, 348, 58);
    context.fillStyle = COLORS.text;
    context.font = '700 16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('ENTER 또는 클릭하여 도망치기', 480, 381);
  }

  private drawRooftop(): void {
    const context = this.context;
    if (this.rooftopImage?.complete && this.rooftopImage.naturalWidth > 0) {
      context.imageSmoothingEnabled = true;
      context.drawImage(this.rooftopImage, 0, 0, this.canvas.width, this.canvas.height);
      context.fillStyle = 'rgb(3 7 18 / 28%)';
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      const gradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, COLORS.surface);
      gradient.addColorStop(0.6, COLORS.primary);
      gradient.addColorStop(1, COLORS.background);
      context.fillStyle = gradient;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.fillStyle = COLORS.surface;
      context.fillRect(0, 376, this.canvas.width, 164);
    }
    this.drawCharacter(this.playerImage, 480, 407, CHAPTER01_SPRITES.yeongsu, false);
  }

  private drawResult(escaped: boolean): void {
    const context = this.context;
    context.fillStyle = 'rgb(3 7 18 / 88%)';
    context.fillRect(150, 144, 660, 252);
    context.strokeStyle = escaped ? COLORS.feedback : COLORS.danger;
    context.strokeRect(150, 144, 660, 252);
    context.textAlign = 'center';
    context.fillStyle = escaped ? COLORS.feedback : COLORS.danger;
    context.font = '700 34px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(escaped ? '옥상 문이 열렸다' : '괴물에게 붙잡혔다', 480, 215);
    context.fillStyle = COLORS.text;
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(
      escaped ? '차가운 새벽 공기가 영수의 얼굴을 스쳤다.' : '멈추면 따라잡힌다. 계단까지 계속 달려야 한다.',
      480,
      272,
    );
    context.fillStyle = COLORS.muted;
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('ENTER 또는 클릭 · 처음부터 다시', 480, 337);
  }
}
