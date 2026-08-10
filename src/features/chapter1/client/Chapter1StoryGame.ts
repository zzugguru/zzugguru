import yeongsuIdentityUrl from '../../../assets/yeongsu-guard.png';
import apartmentStairwellUrl from '../assets/chapter01-apartment-stairwell.png';
import cctvWallBackgroundUrl from '../assets/chapter01-cctv-wall.png';
import guardRoomBackgroundUrl from '../assets/chapter01-guard-room.png';
import cctvAnomalyBackgroundUrl from '../assets/chapter01-story-cctv-anomaly.png';
import guardRoomHauntingBackgroundUrl from '../assets/chapter01-story-guard-room-haunting.png';
import whiteoutApparitionBackgroundUrl from '../assets/chapter01-story-whiteout-apparition.png';
import topViewBasementUrl from '../assets/chapter01-topview-basement.png';
import topViewGuardRoomUrl from '../assets/chapter01-topview-guard-room.png';
import topViewGuardSpriteUrl from '../../../assets/chapter01-yeongsu-guard-sprites.png';
import {
  CHAPTER01_STORY_PLAYFIELDS,
  clampExplorationPoint,
  explorationForBeat,
  facingForDirection,
  isExplorationTargetReached,
  moveExplorationPlayer,
  moveExplorationPlayerToward,
  type Chapter01Direction,
  type Chapter01ExplorationDefinition,
  type Chapter01Facing,
  type Chapter01Point,
} from '../shared/chapter01Exploration';
import {
  CHAPTER01_STORY,
  advanceChapter01Story,
  type Chapter01Backdrop,
  type Chapter01StoryBeat,
} from '../shared/chapter01Story';
import { getCoverRasterGeometry } from '../shared/chapter01Assets';
import {
  chapter01StorySceneFor,
  type Chapter01StoryPlate,
  type Chapter01StoryScene,
} from '../shared/chapter01StoryScenes';
import { drawChapter01TopViewSprite } from './chapter01TopViewSprite';
import { getChapter01WhiteoutPresentation } from './chapter01Whiteout';

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
const INPUT_FEEDBACK_DURATION = 0.24;

type StoryInputFeedbackKind = 'advance' | 'blocked' | 'move';

interface StoryInputFeedback {
  x: number;
  y: number;
  kind: StoryInputFeedbackKind;
  remainingSeconds: number;
}

export class Chapter1StoryGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly titleImage: HTMLImageElement | null;
  private readonly guardRoomImage: HTMLImageElement | null;
  private readonly cctvWallImage: HTMLImageElement | null;
  private readonly cctvAnomalyImage: HTMLImageElement | null;
  private readonly guardRoomHauntingImage: HTMLImageElement | null;
  private readonly whiteoutApparitionImage: HTMLImageElement | null;
  private readonly basementImage: HTMLImageElement | null;
  private readonly topViewGuardRoomImage: HTMLImageElement | null;
  private readonly topViewBasementImage: HTMLImageElement | null;
  private readonly topViewGuardSpriteImage: HTMLImageElement | null;
  private animationId: number | null = null;
  private lastTimestamp: number | null = null;
  private animationSeconds = 0;
  private currentIndex = 0;
  private complete = false;
  private readonly pressedDirections = new Set<Chapter01Direction>();
  private readonly completedExplorations = new Set<number>();
  private readonly explorationsAtTarget = new Set<number>();
  private playerPosition: Chapter01Point = { x: 820, y: 326 };
  private playerFacing: Chapter01Facing = 'up';
  private pointerTarget: Chapter01Point | null = null;
  private inputFeedback: StoryInputFeedback | null = null;

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
    this.cctvAnomalyImage = this.createImage(cctvAnomalyBackgroundUrl);
    this.guardRoomHauntingImage = this.createImage(guardRoomHauntingBackgroundUrl);
    this.whiteoutApparitionImage = this.createImage(whiteoutApparitionBackgroundUrl);
    this.basementImage = this.createImage(apartmentStairwellUrl);
    this.topViewGuardRoomImage = this.createImage(topViewGuardRoomUrl);
    this.topViewBasementImage = this.createImage(topViewBasementUrl);
    this.topViewGuardSpriteImage = this.createImage(topViewGuardSpriteUrl);
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
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.releaseMovement);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Chapter 01 새벽 3시 33분 스토리');
    this.announceCurrentBeat();

    if (this.animationId === null) this.animationId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.releaseMovement);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.lastTimestamp = null;
    this.releaseMovement();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const direction = this.directionForCode(event.code);
    const exploration = this.activeExploration;
    if (direction && exploration && !this.explorationComplete) {
      event.preventDefault();
      this.pressedDirections.add(direction);
      this.pointerTarget = null;
      return;
    }
    if (!['KeyE', 'Enter'].includes(event.code) || event.repeat) return;
    event.preventDefault();
    if (this.complete) return;
    const advanced = this.advance();
    this.triggerInputFeedback(
      { x: PANEL.x + PANEL.width - 64, y: PANEL.y + PANEL.height - 28 },
      advanced ? 'advance' : 'blocked',
    );
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const direction = this.directionForCode(event.code);
    if (direction) this.pressedDirections.delete(direction);
  };

  private readonly releaseMovement = (): void => {
    this.pressedDirections.clear();
    this.pointerTarget = null;
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.canvas.focus();
    if (this.complete) return;
    const rect = this.canvas.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
    const exploration = this.activeExploration;
    if (exploration && !this.explorationComplete) {
      if (isExplorationTargetReached(this.playerPosition, exploration)) {
        this.completeExploration(exploration);
        this.triggerInputFeedback(point, 'advance');
      } else if (point.y < PANEL.y) {
        this.pointerTarget = clampExplorationPoint(point, exploration);
        this.triggerInputFeedback(point, 'move');
      } else {
        this.triggerInputFeedback(point, 'blocked');
      }
      return;
    }
    const advanced = this.advance();
    this.triggerInputFeedback(point, advanced ? 'advance' : 'blocked');
  };

  private advance(): boolean {
    const exploration = this.activeExploration;
    if (exploration && !this.explorationComplete) {
      if (isExplorationTargetReached(this.playerPosition, exploration)) {
        this.completeExploration(exploration);
        return true;
      } else {
        this.liveRegion.textContent = exploration.objective;
        return false;
      }
    }

    const progress = advanceChapter01Story(this.currentIndex, CHAPTER01_STORY.length);
    this.currentIndex = progress.index;
    this.complete = progress.complete;
    this.prepareExploration();
    this.announceCurrentBeat();

    return true;
  }

  private triggerInputFeedback(point: Chapter01Point, kind: StoryInputFeedbackKind): void {
    this.inputFeedback = {
      x: Math.max(0, Math.min(this.canvas.width, point.x)),
      y: Math.max(0, Math.min(this.canvas.height, point.y)),
      kind,
      remainingSeconds: INPUT_FEEDBACK_DURATION,
    };
    this.render();
  }

  private announceCurrentBeat(): void {
    const beat = CHAPTER01_STORY[this.currentIndex];
    const content = beat.speaker ? `${beat.speaker}. ${beat.text}` : beat.text;
    const exploration = this.activeExploration;
    if (exploration && !this.complete) {
      this.liveRegion.textContent = this.explorationComplete
        ? `${content} 목표 완료. E 또는 Enter로 계속하세요.`
        : `${content} ${exploration.objective} 방향키, WASD 또는 화면 클릭으로 이동합니다.`;
      return;
    }
    this.liveRegion.textContent = this.complete
      ? `${content} Chapter 01 끝.`
      : `${content} ${this.currentIndex + 1} / ${CHAPTER01_STORY.length}.`;
  }

  private readonly loop = (timestamp: number): void => {
    const deltaSeconds = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.animationSeconds += deltaSeconds;
    this.updateExploration(deltaSeconds);
    if (this.inputFeedback) {
      this.inputFeedback.remainingSeconds = Math.max(0, this.inputFeedback.remainingSeconds - deltaSeconds);
      if (this.inputFeedback.remainingSeconds === 0) this.inputFeedback = null;
    }
    this.render();
    if (this.complete && !this.inputFeedback) {
      this.stop();
      this.onComplete();
      return;
    }
    this.animationId = requestAnimationFrame(this.loop);
  };

  private get activeExploration(): Chapter01ExplorationDefinition | undefined {
    return explorationForBeat(this.currentIndex);
  }

  private get explorationComplete(): boolean {
    return this.completedExplorations.has(this.currentIndex);
  }

  private prepareExploration(): void {
    const exploration = this.activeExploration;
    this.releaseMovement();
    if (!exploration || this.explorationComplete) return;
    this.explorationsAtTarget.delete(exploration.beatIndex);
    this.playerPosition = { ...exploration.start };
    this.playerFacing = exploration.scene === 'guard-room' ? 'up' : exploration.scene === 'basement' ? 'right' : 'up';
  }

  private completeExploration(exploration: Chapter01ExplorationDefinition): void {
    this.completedExplorations.add(exploration.beatIndex);
    this.releaseMovement();
    this.announceCurrentBeat();
  }

  private updateExploration(deltaSeconds: number): void {
    const exploration = this.activeExploration;
    if (!exploration || this.explorationComplete) return;

    const direction = this.activeDirection;
    if (direction) {
      this.playerFacing = facingForDirection(direction, this.playerFacing);
      this.playerPosition = moveExplorationPlayer(this.playerPosition, direction, deltaSeconds, exploration);
      this.announceExplorationTargetTransition(exploration);
      return;
    }
    if (!this.pointerTarget) return;

    const movement = moveExplorationPlayerToward(
      this.playerPosition,
      this.pointerTarget,
      deltaSeconds,
      exploration,
    );
    this.playerPosition = movement.position;
    this.playerFacing = movement.facing;
    if (movement.reached) this.pointerTarget = null;
    this.announceExplorationTargetTransition(exploration);
  }

  private announceExplorationTargetTransition(exploration: Chapter01ExplorationDefinition): void {
    const reached = isExplorationTargetReached(this.playerPosition, exploration);
    const wasReached = this.explorationsAtTarget.has(exploration.beatIndex);
    if (reached === wasReached) return;

    if (reached) {
      this.explorationsAtTarget.add(exploration.beatIndex);
      this.liveRegion.textContent = `목표에 도착했습니다. ${exploration.interactLabel}: E, Enter 또는 클릭으로 상호작용하세요.`;
      return;
    }

    this.explorationsAtTarget.delete(exploration.beatIndex);
    this.liveRegion.textContent = `목표 범위를 벗어났습니다. ${exploration.objective}`;
  }

  private get activeDirection(): Chapter01Direction | null {
    for (const direction of ['up', 'down', 'left', 'right'] as const) {
      if (this.pressedDirections.has(direction)) return direction;
    }
    return null;
  }

  private directionForCode(code: string): Chapter01Direction | null {
    if (code === 'ArrowUp' || code === 'KeyW') return 'up';
    if (code === 'ArrowDown' || code === 'KeyS') return 'down';
    if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
    if (code === 'ArrowRight' || code === 'KeyD') return 'right';
    return null;
  }

  private render(): void {
    const beat = CHAPTER01_STORY[this.currentIndex];
    const scene = chapter01StorySceneFor(this.currentIndex, beat.backdrop);
    this.drawBackdrop(beat, scene);
    if (scene) this.drawStorySceneTreatment(scene);
    this.drawHeader(beat);
    if (beat.backdrop === 'whiteout' && this.currentIndex >= 40) this.drawWhiteoutInterference();

    if (beat.backdrop === 'title') this.drawTitle();
    else this.drawStoryPanel(beat);
    this.drawInputFeedback();
  }

  private drawInputFeedback(): void {
    const feedback = this.inputFeedback;
    if (!feedback) return;
    const progress = feedback.remainingSeconds / INPUT_FEEDBACK_DURATION;
    const color = feedback.kind === 'blocked' ? COLORS.danger : COLORS.feedback;
    const radius = 10 + (1 - progress) * 42;

    this.context.save();
    this.context.globalAlpha = 0.06 * progress;
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.globalAlpha = 0.35 + progress * 0.55;
    this.context.strokeStyle = color;
    this.context.lineWidth = 2 + progress * 2;
    this.context.beginPath();
    this.context.arc(feedback.x, feedback.y, radius, 0, Math.PI * 2);
    this.context.stroke();
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(feedback.x, feedback.y, 3 + progress * 2, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  private drawBackdrop(beat: Chapter01StoryBeat, scene: Chapter01StoryScene | null): void {
    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (scene && this.drawStoryPlate(scene.plate)) return;

    if (beat.backdrop === 'basement') this.drawTopViewBasement();
    else if (beat.backdrop === 'cctv' || beat.backdrop === 'epilogue') this.drawCctvWall(beat.backdrop);
    else if (beat.backdrop === 'whiteout') this.drawWhiteout();
    else if (beat.backdrop === 'morning') this.drawGuardRoom(true);
    else if (beat.backdrop === 'guard-room') this.drawTopViewGuardRoom();
    else this.drawTitleBackdrop();
  }

  private drawStoryPlate(plate: Chapter01StoryPlate): boolean {
    if (plate === 'current') return false;
    if (plate === 'guard-room') {
      this.drawGuardRoom(false);
      return true;
    }
    if (plate === 'basement') {
      this.drawBasement();
      return true;
    }
    const image = plate === 'cctv-anomaly'
      ? this.cctvAnomalyImage
      : plate === 'guard-room-haunting'
        ? this.guardRoomHauntingImage
        : this.whiteoutApparitionImage;
    if (!this.drawLoadedBackground(image)) return false;
    if (plate === 'whiteout-apparition') this.drawWhiteoutForeground();
    return true;
  }

  private drawStorySceneTreatment(scene: Chapter01StoryScene): void {
    const context = this.context;
    context.save();
    context.beginPath();
    context.rect(0, 0, this.canvas.width, PANEL.y);
    context.clip();

    context.globalAlpha = scene.tintAlpha;
    context.fillStyle = scene.page % 2 === 0 ? COLORS.surfaceAccent : COLORS.danger;
    context.fillRect(0, 0, this.canvas.width, PANEL.y);

    context.globalAlpha = scene.scanlineAlpha;
    context.fillStyle = COLORS.text;
    for (let y = scene.page % 7; y < PANEL.y; y += 11) context.fillRect(0, y, this.canvas.width, 1);

    context.globalAlpha = 0.2 + (scene.page % 4) * 0.05;
    context.strokeStyle = scene.page % 2 === 0 ? COLORS.feedback : COLORS.danger;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(scene.focusX, scene.focusY, 18 + (scene.page % 5) * 7, 0, Math.PI * 2);
    context.stroke();

    if (scene.scanlineAlpha >= 0.06) {
      context.globalAlpha = 0.12 + (scene.page % 3) * 0.04;
      context.fillStyle = COLORS.text;
      context.fillRect((scene.page * 41) % 180 - 60, scene.signalTearY, 840, 3 + (scene.page % 4));
    }

    if (scene.silhouette) {
      const x = 140 + ((scene.page * 97) % 650);
      context.globalAlpha = 0.22 + (scene.page % 3) * 0.08;
      context.fillStyle = COLORS.background;
      context.beginPath();
      context.ellipse(x, 250, 15, 48, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(x, 190, 14, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private drawTopViewGuardRoom(): void {
    if (this.topViewGuardRoomImage?.complete && this.topViewGuardRoomImage.naturalWidth > 0) {
      this.context.imageSmoothingEnabled = false;
      this.context.drawImage(this.topViewGuardRoomImage, 0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = 'rgb(3 7 18 / 14%)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.drawGuardRoom(false);
    }
    this.drawTopViewExplorationLayer('guard-room');
  }

  private drawTopViewBasement(): void {
    if (this.topViewBasementImage?.complete && this.topViewBasementImage.naturalWidth > 0) {
      this.context.imageSmoothingEnabled = false;
      this.context.drawImage(this.topViewBasementImage, 0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = 'rgb(3 7 18 / 22%)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.drawBasement();
    }
    this.drawTopViewExplorationLayer('basement');
  }

  private drawTopViewExplorationLayer(scene: 'guard-room' | 'basement'): void {
    const exploration = this.activeExploration;
    if (exploration?.scene === scene) this.drawExplorationTarget(exploration);

    this.drawBoundedTopViewSprite(this.playerPosition, this.playerFacing, COLORS.feedback, scene);
  }

  private drawBoundedTopViewSprite(
    position: Chapter01Point,
    facing: Chapter01Facing,
    fallbackColor: string,
    scene: 'guard-room' | 'basement' | 'whiteout',
  ): void {
    const playfield = CHAPTER01_STORY_PLAYFIELDS[scene];
    this.context.save();
    this.context.beginPath();
    this.context.rect(
      playfield.left,
      playfield.top,
      playfield.right - playfield.left,
      playfield.bottom - playfield.top,
    );
    this.context.clip();
    if (!drawChapter01TopViewSprite(this.context, this.topViewGuardSpriteImage, position, facing)) {
      this.context.fillStyle = fallbackColor;
      this.context.fillRect(position.x - 13, position.y - 26, 26, 26);
    }
    this.context.restore();
  }

  private drawExplorationTarget(exploration: Chapter01ExplorationDefinition): void {
    const pulse = 0.5 + (Math.sin(this.animationSeconds * 5) + 1) * 0.25;
    this.context.save();
    this.context.globalAlpha = this.explorationComplete ? 0.45 : pulse;
    this.context.strokeStyle = exploration.scene === 'whiteout' ? COLORS.danger : COLORS.feedback;
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(
      exploration.target.x,
      exploration.target.y,
      exploration.targetRadius - 6 + pulse * 8,
      0,
      Math.PI * 2,
    );
    this.context.stroke();
    this.context.restore();
  }

  private drawTitleBackdrop(): void {
    const gradient = this.context.createRadialGradient(480, 240, 20, 480, 240, 430);
    gradient.addColorStop(0, '#20204c');
    gradient.addColorStop(0.55, COLORS.surface);
    gradient.addColorStop(1, COLORS.background);
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.titleImage?.complete && this.titleImage.naturalWidth > 0) {
      const geometry = getCoverRasterGeometry(
        this.titleImage.naturalWidth,
        this.titleImage.naturalHeight,
        this.canvas.width,
        this.canvas.height,
        0.5,
        0.25,
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
    const presentation = getChapter01WhiteoutPresentation(this.currentIndex, this.animationSeconds);
    const phase = presentation.phase;
    const pulse = 0.5 + (Math.sin(this.animationSeconds * 4) + 1) * 0.25;
    const centerY = 142 + phase * 18;
    const gradient = this.context.createRadialGradient(480, centerY, 8, 480, centerY, 520);
    gradient.addColorStop(0, '#f9fafb');
    gradient.addColorStop(0.18 + pulse * 0.12, '#c7d2fe');
    gradient.addColorStop(1, '#312e81');
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (phase === 0) {
      this.context.save();
      this.context.globalAlpha = 0.16;
      this.context.fillStyle = COLORS.text;
      for (let index = 0; index < 12; index += 1) {
        const width = 80 + ((index * 97) % 260);
        const x = (index * 173 + Math.floor(this.animationSeconds * 90)) % (this.canvas.width + width) - width;
        const y = 42 + index * 25;
        this.context.fillRect(x, y, width, 2 + (index % 3));
      }
      this.context.restore();
    }

    this.drawWhiteoutForeground();
  }

  private drawWhiteoutForeground(): void {
    const presentation = getChapter01WhiteoutPresentation(this.currentIndex, this.animationSeconds);
    const phase = presentation.phase;
    const exploration = this.activeExploration;
    if (exploration?.scene === 'whiteout') this.drawExplorationTarget(exploration);

    const renderPosition = presentation.character ?? this.playerPosition;
    this.context.save();
    this.context.globalAlpha = presentation.character?.opacity ?? 0.9;
    this.drawBoundedTopViewSprite(renderPosition, phase === 0 ? this.playerFacing : 'up', COLORS.background, 'whiteout');
    this.context.restore();
  }

  private drawWhiteoutInterference(): void {
    const presentation = getChapter01WhiteoutPresentation(this.currentIndex, this.animationSeconds);
    if (presentation.glitchIntensity === 0) return;

    const context = this.context;
    context.save();
    context.globalAlpha = presentation.glitchIntensity * 0.22;
    context.fillStyle = COLORS.background;
    for (let y = presentation.scanlineOffset; y < PANEL.y; y += 6) {
      context.fillRect(0, y, this.canvas.width, 2);
    }

    for (let index = 0; index < 9; index += 1) {
      const y = (index * 61 + presentation.scanlineOffset * 13) % PANEL.y;
      const height = Math.min(2 + (index % 4) * 3, PANEL.y - y);
      const inset = (index * 83) % 190;
      context.globalAlpha = presentation.glitchIntensity * (index % 3 === 0 ? 0.36 : 0.2);
      context.fillStyle = index % 3 === 0 ? COLORS.danger : index % 2 === 0 ? COLORS.feedback : COLORS.text;
      context.fillRect(
        inset + presentation.tearOffset,
        y,
        this.canvas.width - inset * 2,
        height,
      );
    }
    context.restore();
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
    context.fillText('E · Enter · 화면 클릭으로 시작', 480, 304);
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
    const exploration = this.activeExploration;
    const footer = exploration
      ? this.explorationComplete
        ? '목표 완료 · E / Enter / 클릭  ▶ 다음'
        : isExplorationTargetReached(this.playerPosition, exploration)
          ? `E / Enter / 아래 패널 클릭 · ${exploration.interactLabel}`
          : `방향키 / WASD / 화면 클릭 · ${exploration.objective}`
      : this.complete
        ? 'CHAPTER 01 · 끝'
        : 'E · Enter · 클릭  ▶ 다음';
    context.fillStyle = exploration && !this.explorationComplete ? COLORS.feedback : this.complete ? COLORS.danger : COLORS.muted;
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(footer, PANEL.x + PANEL.width - 20, PANEL.y + PANEL.height - 16);
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
