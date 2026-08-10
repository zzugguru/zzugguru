import apartmentStairwellUrl from '../assets/chapter01-apartment-stairwell.png';
import rooftopBackgroundUrl from '../assets/chapter01-rooftop.png';
import yeongsuGuardSpriteUrl from '../../../assets/chapter01-yeongsu-guard-sprites.png';
import monsterSpriteUrl from '../assets/cctv-monster-sprite.png';
import {
  CHAPTER01_SPRITES,
  getSpriteDrawGeometry,
} from '../shared/chapter01Assets';
import {
  ESCAPE_FLOORS,
  createRooftopEscapeState,
  exitXForFloor,
  obstaclesForFloor,
  stepRooftopEscape,
  type EscapeAction,
  type RooftopEscapeState,
} from '../shared/rooftopEscapeLogic';
import {
  getEscapeYeongsuGeometry,
  horizontalFacingForDirection,
  type HorizontalFacing,
} from './chapter01EscapeSprite';

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
  private crawlPressed = false;
  private readonly pressedCodes = new Set<string>();
  private readonly suppressedUntilKeyUp = new Set<string>();
  private jumpSeconds = 0;
  private playerFacing: HorizontalFacing = 1;
  private monsterFacing: HorizontalFacing = 1;
  private completionNotified = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly liveRegion: HTMLElement,
    private readonly onComplete: () => void = () => undefined,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;

    this.backgroundImage = this.createImage(apartmentStairwellUrl);
    this.rooftopImage = this.createImage(rooftopBackgroundUrl);
    this.playerImage = this.createImage(yeongsuGuardSpriteUrl);
    this.monsterImage = this.createImage(monsterSpriteUrl);
  }

  mount(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.releaseInput);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
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
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen !== 'playing') {
      event.preventDefault();
      if (!event.repeat) this.startEscape();
      return;
    }

    if (this.screen !== 'playing') return;
    if (this.suppressedUntilKeyUp.has(event.code)) {
      event.preventDefault();
      return;
    }
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault();
      this.pressedCodes.add(event.code);
    }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault();
      this.pressedCodes.add(event.code);
    }
    if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) this.jumpSeconds = 0.55;
    }
    if (event.code === 'ArrowDown' || event.code === 'KeyS' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
      this.pressedCodes.add(event.code);
    }
    this.syncHeldInput();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.suppressedUntilKeyUp.delete(event.code);
    this.pressedCodes.delete(event.code);
    this.syncHeldInput();
  };

  private syncHeldInput(): void {
    this.leftPressed = this.pressedCodes.has('ArrowLeft') || this.pressedCodes.has('KeyA');
    this.rightPressed = this.pressedCodes.has('ArrowRight') || this.pressedCodes.has('KeyD');
    this.crawlPressed = ['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight'].some((code) => this.pressedCodes.has(code));
  }

  private readonly handlePointerDown = (): void => {
    this.canvas.focus();
    if (this.screen !== 'playing') {
      this.startEscape();
    }
  };

  private readonly releaseInput = (): void => {
    this.leftPressed = false;
    this.rightPressed = false;
    this.crawlPressed = false;
    this.pressedCodes.clear();
    this.suppressedUntilKeyUp.clear();
    this.jumpSeconds = 0;
  };

  private suppressHeldInputUntilRelease(): void {
    this.pressedCodes.forEach((code) => this.suppressedUntilKeyUp.add(code));
    this.pressedCodes.clear();
    this.syncHeldInput();
    this.jumpSeconds = 0;
  }

  private startEscape(): void {
    this.state = createRooftopEscapeState();
    this.screen = 'playing';
    this.lastTimestamp = null;
    this.releaseInput();
    this.faceCurrentExit();
    this.announceFloor();
  }

  private readonly loop = (timestamp: number): void => {
    const deltaSeconds = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.update(deltaSeconds);
    this.render();
    if (this.screen === 'escaped' && !this.completionNotified) {
      this.completionNotified = true;
      this.stop();
      this.onComplete();
      return;
    }
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void {
    if (this.screen !== 'playing') return;

    const previousFloor = this.state.floorIndex;
    const direction = this.direction;
    this.jumpSeconds = Math.max(0, this.jumpSeconds - Math.max(0, Math.min(0.05, deltaSeconds)));
    this.playerFacing = horizontalFacingForDirection(direction, this.playerFacing);
    this.state = stepRooftopEscape(this.state, { direction, action: this.currentAction }, deltaSeconds);
    if (this.state.floorIndex !== previousFloor) {
      this.suppressHeldInputUntilRelease();
      this.faceCurrentExit();
      this.announceFloor();
    } else {
      this.monsterFacing = horizontalFacingForDirection(
        Math.sign(this.state.playerX - this.state.monsterX) as -1 | 0 | 1,
        this.monsterFacing,
      );
    }

    if (this.state.result === 'caught') {
      this.screen = 'caught';
      this.releaseInput();
      this.liveRegion.textContent = '괴물에게 붙잡혔습니다. E, Enter 또는 화면 클릭으로 다시 도망치세요.';
    } else if (this.state.result === 'escaped') {
      this.screen = 'escaped';
      this.releaseInput();
      this.liveRegion.textContent = '옥상 문이 열렸습니다. 영수가 괴물에게서 탈출했습니다.';
    }
  }

  private get direction(): -1 | 0 | 1 {
    if (this.leftPressed === this.rightPressed) return 0;
    return this.leftPressed ? -1 : 1;
  }

  private get currentAction(): EscapeAction {
    if (this.jumpSeconds > 0) return 'jump';
    if (this.crawlPressed) return 'crawl';
    return 'run';
  }

  private announceIntro(): void {
    this.liveRegion.textContent = '영수가 주위를 둘러보자 멀리 여자의 형체가 보였습니다. 사람처럼 보이지 않습니다. 옥상까지 도망치세요.';
  }

  private faceCurrentExit(): void {
    const exitDirection: HorizontalFacing = exitXForFloor(this.state.floorIndex) < this.state.playerX ? -1 : 1;
    this.playerFacing = exitDirection;
    this.monsterFacing = exitDirection;
  }

  private announceFloor(): void {
    const floor = ESCAPE_FLOORS[this.state.floorIndex];
    const direction = exitXForFloor(this.state.floorIndex) > this.state.playerX ? '오른쪽' : '왼쪽';
    const actionGuide = this.state.floorIndex === 0
      ? '계속 달리세요.'
      : this.state.floorIndex === 1
        ? '장애물은 W, 위쪽 방향키 또는 Space로 점프하세요.'
        : '낮은 장애물은 점프하고 붉은 배관은 S, 아래쪽 방향키 또는 Shift로 포복하세요.';
    this.liveRegion.textContent = `${floor}. ${direction} 계단까지 이동하세요. 괴물이 빠르게 쫓아옵니다. ${actionGuide}`;
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
    obstaclesForFloor(this.state.floorIndex).forEach((obstacle) => this.drawObstacle(obstacle.x, obstacle.kind));
    const playerFloorY = this.currentAction === 'jump' ? 346 : 402;
    this.drawYeongsu(this.state.playerX, playerFloorY, this.playerFacing, this.currentAction);
    this.drawMonster(this.state.monsterX, 406, this.monsterFacing);
  }

  private drawObstacle(x: number, kind: 'jump' | 'crawl'): void {
    const context = this.context;
    if (kind === 'jump') {
      context.fillStyle = 'rgb(55 65 81 / 96%)';
      context.fillRect(x - 26, 354, 52, 48);
      context.strokeStyle = COLORS.feedback;
      context.strokeRect(x - 26, 354, 52, 48);
      context.fillStyle = COLORS.text;
      context.textAlign = 'center';
      context.font = '700 12px monospace';
      context.fillText('JUMP', x, 382);
      return;
    }
    context.fillStyle = 'rgb(251 113 133 / 82%)';
    context.fillRect(x - 38, 278, 76, 18);
    context.fillRect(x - 34, 296, 8, 66);
    context.fillRect(x + 26, 296, 8, 66);
    context.fillStyle = COLORS.text;
    context.textAlign = 'center';
    context.font = '700 11px monospace';
    context.fillText('CRAWL', x, 324);
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

  private drawYeongsu(
    x: number,
    floorY: number,
    facing: HorizontalFacing,
    action: EscapeAction = 'run',
  ): void {
    const context = this.context;
    const geometry = getEscapeYeongsuGeometry(0);
    context.save();
    context.translate(x, floorY);
    context.scale(facing, action === 'crawl' ? 0.62 : 1);
    if (this.playerImage?.complete && this.playerImage.naturalWidth > 0) {
      context.imageSmoothingEnabled = false;
      context.drawImage(
        this.playerImage,
        geometry.sourceX,
        geometry.sourceY,
        geometry.sourceWidth,
        geometry.sourceHeight,
        geometry.destinationX,
        geometry.destinationY,
        geometry.destinationWidth,
        geometry.destinationHeight,
      );
    } else {
      context.fillStyle = COLORS.primary;
      context.beginPath();
      context.ellipse(0, -68, 28, 68, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private drawMonster(x: number, floorY: number, facing: HorizontalFacing): void {
    const context = this.context;
    const metadata = CHAPTER01_SPRITES.monster;
    const geometry = getSpriteDrawGeometry(metadata, 0, floorY);
    context.save();
    context.translate(x, 0);
    context.scale(facing, 1);
    context.shadowColor = COLORS.danger;
    context.shadowBlur = 18;
    if (this.monsterImage?.complete && this.monsterImage.naturalWidth > 0) {
      context.imageSmoothingEnabled = true;
      context.drawImage(this.monsterImage, geometry.x, geometry.y, geometry.width, geometry.height);
    } else {
      context.fillStyle = COLORS.background;
      context.beginPath();
      context.ellipse(0, floorY - metadata.renderHeight / 2, 28, metadata.renderHeight / 2, 0, 0, Math.PI * 2);
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
    context.fillText('A/D 이동 · W/↑/Space 점프 · S/↓/Shift 포복', 936, 30);
    context.fillStyle = COLORS.border;
    context.fillRect(720, 44, 216, 8);
    context.fillStyle = COLORS.feedback;
    context.fillRect(720, 44, 216 * ((this.state.floorIndex + 1) / ESCAPE_FLOORS.length), 8);

  }

  private drawIntro(): void {
    const context = this.context;
    context.fillStyle = 'rgb(3 7 18 / 82%)';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.save();
    context.globalAlpha = 0.72;
    this.drawMonster(820, 420, -1);
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
    context.fillText('E · ENTER 또는 클릭하여 도망치기', 480, 381);
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
    this.drawYeongsu(480, 407, this.playerFacing);
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
    context.fillText('E · ENTER 또는 클릭 · 처음부터 다시', 480, 337);
  }
}
