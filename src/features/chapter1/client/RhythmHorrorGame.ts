import backgroundMusicUrl from '../../../assets/어둠의 추격.mp3';
import basementBackgroundUrl from '../assets/b1-basement-corridor.png';
import yeongsuGuardUrl from '../assets/yeongsu-guard-sprite.png';
import cctvMonsterUrl from '../assets/cctv-monster-sprite.png';
import { CHART, cueAt } from '../shared/content';
import {
  BEAT_MS,
  BPM,
  COVER_ZONES,
  EXIT_X,
  NOISE_OBSTACLES,
  STAGE_DURATION_MS,
  STAGE_WIDTH,
  beatAt,
  createStageState,
  stepStage,
  type PlayerInput,
  type RhythmPhase,
  type StageState,
} from '../shared/gameLogic';
import { BeatClick, beatIndexAt, type BeatClickControl } from './BeatClick';
import { GameMusic, type GameMusicControl } from './GameMusic';

type Screen = 'title' | 'loading' | 'playing' | 'paused' | 'result';

const COLORS = {
  background: '#030712', surface: '#111827', primary: '#312e81', feedback: '#818cf8',
  danger: '#fb7185', text: '#f9fafb', muted: '#c7d2fe', border: '#374151',
} as const;

const EMPTY_INPUT: PlayerInput = { left: false, right: false, crouch: false, run: false, interact: false };

export class RhythmHorrorGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly backgroundImage: HTMLImageElement | null;
  private readonly playerImage: HTMLImageElement | null;
  private readonly monsterImage: HTMLImageElement | null;
  private screen: Screen = 'title';
  private state: StageState = createStageState();
  private inputState: PlayerInput = { ...EMPTY_INPUT };
  private animationId: number | null = null;
  private lastUpdateMs = 0;
  private checkpointForRetry = 0;
  private readonly touchInputs = new Map<number, keyof PlayerInput>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly music: GameMusicControl = new GameMusic(backgroundMusicUrl),
    private readonly beatClick: BeatClickControl = new BeatClick(),
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;
    this.backgroundImage = typeof Image === 'undefined' ? null : new Image();
    if (this.backgroundImage) this.backgroundImage.src = basementBackgroundUrl;
    this.playerImage = typeof Image === 'undefined' ? null : new Image();
    if (this.playerImage) this.playerImage.src = yeongsuGuardUrl;
    this.monsterImage = typeof Image === 'undefined' ? null : new Image();
    if (this.monsterImage) this.monsterImage.src = cctvMonsterUrl;
  }

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.releaseInput);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', '4번째 박자. 빛에서는 멈추고 어둠에서는 이동하는 횡스크롤 리듬 스텔스 게임');
    if (this.animationId === null) this.animationId = requestAnimationFrame(this.loop);
  }

  async togglePause(): Promise<void> {
    if (this.screen === 'playing') {
      this.music.pause();
      this.beatClick.pause();
      this.releaseInput();
      this.screen = 'paused';
    } else if (this.screen === 'paused') {
      await Promise.all([this.music.resume(), this.beatClick.resume()]);
      this.lastUpdateMs = this.music.timeMs();
      if (this.screen === 'paused') this.screen = 'playing';
    }
  }

  private readonly releaseInput = (): void => {
    this.inputState = { ...EMPTY_INPUT };
    this.touchInputs.clear();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Enter' && (this.screen === 'title' || this.screen === 'result')) {
      event.preventDefault();
      void this.start(this.screen === 'result' && this.state.result === 'dead' ? this.checkpointForRetry : 0);
      return;
    }
    if (event.code === 'Escape' && (this.screen === 'playing' || this.screen === 'paused')) {
      event.preventDefault();
      if (!event.repeat) void this.togglePause();
      return;
    }
    if (this.screen !== 'playing') return;
    const key = this.inputKey(event.code);
    if (key) {
      event.preventDefault();
      this.inputState[key] = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = this.inputKey(event.code);
    if (key) this.inputState[key] = false;
  };

  private inputKey(code: string): keyof PlayerInput | null {
    if (code === 'KeyA' || code === 'ArrowLeft') return 'left';
    if (code === 'KeyD' || code === 'ArrowRight') return 'right';
    if (code === 'KeyS' || code === 'ArrowDown') return 'crouch';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'run';
    if (code === 'KeyW' || code === 'ArrowUp') return 'interact';
    return null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.canvas.focus();
    if (this.screen === 'title' || this.screen === 'result') {
      void this.start(this.screen === 'result' && this.state.result === 'dead' ? this.checkpointForRetry : 0);
      return;
    }
    if (this.screen === 'paused') {
      void this.togglePause();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    if (y < 458) return;
    let key: keyof PlayerInput;
    if (x < 105) key = 'left';
    else if (x < 210) key = 'right';
    else if (x < 315) key = 'crouch';
    else if (x > 820) key = 'interact';
    else key = 'run';
    this.touchInputs.set(event.pointerId, key);
    this.inputState[key] = true;
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const key = this.touchInputs.get(event.pointerId);
    if (!key) return;
    this.touchInputs.delete(event.pointerId);
    if (![...this.touchInputs.values()].includes(key)) this.inputState[key] = false;
  };

  private async start(checkpointX = 0): Promise<void> {
    this.releaseInput();
    this.state = createStageState(checkpointX || undefined);
    this.checkpointForRetry = checkpointX;
    this.screen = 'loading';
    await Promise.all([this.music.restart(), this.beatClick.start()]);
    this.lastUpdateMs = this.music.timeMs();
    if (this.screen === 'loading') this.screen = 'playing';
  }

  private readonly loop = (): void => {
    if (this.screen === 'playing') this.update();
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    const time = this.music.timeMs();
    const delta = Math.min(50, Math.max(0, time - this.lastUpdateMs));
    this.lastUpdateMs = time;
    const beatIndex = beatIndexAt(time);
    this.beatClick.sync(time, CHART[beatIndex]);
    this.state = stepStage(this.state, this.inputState, time, delta);
    if (this.inputState.interact) this.inputState.interact = false;
    if (this.state.checkpointX > this.checkpointForRetry) this.checkpointForRetry = this.state.checkpointX;
    if (this.state.result !== 'playing') {
      this.music.pause();
      this.beatClick.pause();
      this.releaseInput();
      this.screen = 'result';
    }
  }

  private render(): void {
    const time = this.screen === 'title' ? 0 : this.music.timeMs();
    const beat = beatAt(time);
    const shake = this.screen === 'playing' ? Math.max(0, this.state.tension - 62) / 38 : 0;
    const ctx = this.context;
    ctx.save();
    if (shake > 0) ctx.translate(Math.sin(time / 31) * shake * 2, Math.cos(time / 43) * shake);
    this.drawWorld(time, beat.phase);
    ctx.restore();
    if (this.screen !== 'title') {
      this.drawHud(time);
      this.drawBeatRail(time, beat.phase);
      this.drawTouchControls(time);
    }
    if (this.screen === 'title') this.drawTitle();
    if (this.screen === 'loading') this.drawOverlay('B1 신호 동기화 중', '메트로놈과 비상 조명을 연결하고 있습니다.');
    if (this.screen === 'paused') this.drawOverlay('일시정지', 'Esc 또는 화면을 눌러 계속');
    if (this.screen === 'result') this.drawResult();
  }

  private drawWorld(time: number, phase: RhythmPhase): void {
    const ctx = this.context;
    const finalChase = time >= 50_000;
    const lightOn = phase === 'light';
    const cameraX = Math.max(0, Math.min(STAGE_WIDTH - 960, this.state.playerX - 250));
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, lightOn ? '#152728' : COLORS.background);
    gradient.addColorStop(0.72, finalChase ? '#230910' : lightOn ? '#102023' : '#070c15');
    gradient.addColorStop(1, '#030712');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);

    ctx.save();
    ctx.translate(-cameraX, 0);
    const backgroundReady = Boolean(this.backgroundImage?.complete && this.backgroundImage.naturalWidth > 0);
    if (backgroundReady && this.backgroundImage) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.backgroundImage, 0, -180, STAGE_WIDTH, 720);
      ctx.fillStyle = lightOn ? 'rgba(214,211,154,.055)' : 'rgba(3,7,18,.34)';
      ctx.fillRect(0, 72, STAGE_WIDTH, 386);
    } else {
      ctx.fillStyle = lightOn ? '#182829' : '#090f18';
      ctx.fillRect(0, 72, STAGE_WIDTH, 320);
      ctx.strokeStyle = lightOn ? 'rgba(199,210,254,.12)' : 'rgba(55,65,81,.44)';
      for (let x = 0; x < STAGE_WIDTH; x += 96) {
        ctx.strokeRect(x, 74, 96, 244);
        ctx.beginPath(); ctx.moveTo(x + 48, 74); ctx.lineTo(x + 48, 318); ctx.stroke();
      }
      this.drawPipe(0, 112, STAGE_WIDTH);
      for (let x = 180; x < STAGE_WIDTH; x += 310) this.drawLamp(x, 72, lightOn, finalChase);
    }
    this.drawZoneLabel(92, 'B1-01', '지하 복도');
    this.drawZoneLabel(690, 'B1-02', '창고');
    this.drawZoneLabel(1_260, 'B1-03', '기계실');
    this.drawExit(EXIT_X, lightOn);
    for (const x of NOISE_OBSTACLES) this.drawObstacle(x);
    for (const x of COVER_ZONES) this.drawCover(x);

    ctx.fillStyle = backgroundReady
      ? lightOn ? 'rgba(20,35,39,.24)' : 'rgba(3,7,18,.42)'
      : lightOn ? '#142327' : '#080d15';
    ctx.fillRect(0, 354, STAGE_WIDTH, 104);
    ctx.strokeStyle = 'rgba(129,140,248,.12)';
    for (let x = 0; x < STAGE_WIDTH; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 354); ctx.lineTo(x + 24, 458); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(129,140,248,.14)';
    ctx.fillRect(this.state.checkpointX - 34, 448, 68, 4);

    this.drawPlayer(this.state.playerX, 357, phase === 'dark' && (this.inputState.left || this.inputState.right), this.inputState.crouch);
    this.drawMonster(this.state.monsterX, 347, this.state.monsterMode === 'chase', time);
    if (this.state.lastNoiseX !== null && time < this.state.noiseUntilMs) this.drawNoise(this.state.lastNoiseX, 342, time);
    ctx.restore();

    if (!lightOn) {
      const playerScreenX = this.state.playerX - cameraX;
      const vignette = ctx.createRadialGradient(playerScreenX, 330, 36, playerScreenX, 330, 350);
      vignette.addColorStop(0, 'rgba(3,7,18,.08)');
      vignette.addColorStop(1, 'rgba(3,7,18,.78)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 72, 960, 386);
    }
    if (finalChase) {
      ctx.fillStyle = `rgba(251,113,133,${0.035 + Math.sin(time / 120) * 0.02})`;
      ctx.fillRect(0, 72, 960, 386);
    }
  }

  private drawPipe(x: number, y: number, width: number): void {
    const ctx = this.context;
    ctx.strokeStyle = '#24303d'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.stroke();
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + width, y - 2); ctx.stroke();
  }

  private drawLamp(x: number, y: number, lit: boolean, danger: boolean): void {
    const ctx = this.context;
    ctx.fillStyle = danger ? COLORS.danger : lit ? '#d6d39a' : '#4b5563';
    ctx.fillRect(x - 28, y, 56, 7); ctx.fillRect(x - 4, y + 7, 8, 9);
    if (!lit && !danger) return;
    const glow = ctx.createRadialGradient(x, y + 20, 4, x, y + 20, 125);
    glow.addColorStop(0, danger ? 'rgba(251,113,133,.22)' : 'rgba(214,211,154,.17)'); glow.addColorStop(1, 'rgba(3,7,18,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 140, y, 280, 250);
  }

  private drawZoneLabel(x: number, code: string, label: string): void {
    const ctx = this.context;
    ctx.fillStyle = '#25303a'; ctx.fillRect(x, 164, 118, 50);
    ctx.fillStyle = COLORS.muted; ctx.font = '700 16px monospace'; ctx.fillText(code, x + 12, 185);
    ctx.font = '12px Pretendard, system-ui'; ctx.fillText(label, x + 12, 202);
  }

  private drawExit(x: number, lit: boolean): void {
    const ctx = this.context;
    ctx.fillStyle = lit ? '#172e2d' : '#0b111a'; ctx.fillRect(x - 25, 184, 92, 170);
    ctx.strokeStyle = this.state.playerX >= EXIT_X - 24 ? COLORS.feedback : '#42515b'; ctx.lineWidth = 3; ctx.strokeRect(x - 25, 184, 92, 170);
    ctx.fillStyle = COLORS.danger; ctx.fillRect(x - 12, 198, 66, 20);
    ctx.fillStyle = COLORS.text; ctx.font = '700 11px monospace'; ctx.fillText('EXIT / W', x - 7, 212);
  }

  private drawObstacle(x: number): void {
    const ctx = this.context;
    ctx.fillStyle = '#1c2731'; ctx.fillRect(x - 20, 318, 42, 36);
    ctx.strokeStyle = '#4b5563'; ctx.strokeRect(x - 20, 318, 42, 36);
    ctx.beginPath(); ctx.moveTo(x - 15, 325); ctx.lineTo(x + 15, 347); ctx.moveTo(x + 15, 325); ctx.lineTo(x - 15, 347); ctx.stroke();
  }

  private drawCover(x: number): void {
    const ctx = this.context;
    ctx.fillStyle = '#111a24'; ctx.fillRect(x - 38, 288, 76, 66);
    ctx.strokeStyle = '#374151'; ctx.strokeRect(x - 38, 288, 76, 66);
    ctx.fillStyle = '#c7d2fe'; ctx.font = '9px monospace'; ctx.fillText('S / HIDE', x - 27, 308);
  }

  private drawPlayer(x: number, y: number, moving: boolean, crouching: boolean): void {
    const ctx = this.context;
    const bob = moving ? Math.sin(this.music.timeMs() / 65) * 3 : 0;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob + (crouching ? 19 : 0)));
    if (this.playerImage && this.playerImage.complete && this.playerImage.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
      const renderHeight = crouching ? 72 : 102;
      const aspectRatio = this.playerImage.naturalWidth / this.playerImage.naturalHeight;
      const renderWidth = renderHeight * aspectRatio;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.playerImage, -renderWidth / 2, -renderHeight + 10, renderWidth, renderHeight);
    } else {
      ctx.fillStyle = '#0b1018'; ctx.fillRect(-13, -49, 28, crouching ? 25 : 38);
      ctx.fillStyle = '#bca58f'; ctx.fillRect(-10, -66, 22, 19);
      ctx.fillStyle = '#202735'; ctx.fillRect(-13, -71, 28, 11);
      ctx.fillStyle = COLORS.feedback; ctx.fillRect(-9, -37, 5, 17);
      ctx.fillStyle = '#080b12'; ctx.fillRect(-11, -11, 8, 20); ctx.fillRect(7, -11, 8, 20);
      ctx.fillStyle = COLORS.text; ctx.fillRect(7, -59, 3, 3);
    }
    ctx.restore();
  }

  private drawMonster(x: number, y: number, chasing: boolean, time: number): void {
    const ctx = this.context;
    const reach = chasing ? Math.sin(time / 55) * 8 : 0;
    ctx.save();
    ctx.translate(Math.round(x), y);
    if (this.monsterImage && this.monsterImage.complete && this.monsterImage.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
      const renderHeight = chasing ? 160 : 145;
      const aspectRatio = this.monsterImage.naturalWidth / this.monsterImage.naturalHeight;
      const renderWidth = renderHeight * aspectRatio;
      ctx.imageSmoothingEnabled = true;
      if (chasing) {
        ctx.shadowColor = COLORS.danger;
        ctx.shadowBlur = 15;
      }
      ctx.drawImage(this.monsterImage, -renderWidth / 2 + reach, -renderHeight + 30, renderWidth, renderHeight);
    } else {
      ctx.fillStyle = chasing ? '#18090e' : '#080c13';
      ctx.beginPath(); ctx.ellipse(0, -25, 31, 62, -.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-1, -82, 27, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = chasing ? '#210a11' : '#0b1119'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-25, -38); ctx.lineTo(-49 - reach, 3); ctx.moveTo(25, -38); ctx.lineTo(49 + reach, 3); ctx.stroke();
      ctx.fillStyle = COLORS.danger; ctx.fillRect(-16, -87, 5, 4); ctx.fillRect(9, -86, 5, 4);
    }
    ctx.restore();
  }

  private drawNoise(x: number, y: number, time: number): void {
    const ctx = this.context; const pulse = 18 + ((time / 12) % 34);
    ctx.strokeStyle = 'rgba(251,113,133,.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, pulse, Math.PI, Math.PI * 2); ctx.stroke();
  }

  private drawHud(time: number): void {
    const ctx = this.context; const cue = cueAt(time); const remaining = Math.max(0, Math.ceil((STAGE_DURATION_MS - time) / 1_000));
    ctx.fillStyle = 'rgba(3,7,18,.91)'; ctx.fillRect(0, 0, 960, 72);
    ctx.textAlign = 'left'; ctx.fillStyle = COLORS.text; ctx.font = '700 18px Pretendard, system-ui';
    ctx.fillText(`♥ ${'●'.repeat(this.state.hearts)}${'○'.repeat(3 - this.state.hearts)}`, 24, 28);
    ctx.fillStyle = this.state.monsterMode === 'chase' ? COLORS.danger : COLORS.muted; ctx.font = '12px Pretendard, system-ui';
    ctx.fillText(`괴물 · ${this.modeLabel()}`, 24, 51);
    ctx.textAlign = 'center'; ctx.fillStyle = COLORS.text; ctx.font = '700 17px monospace'; ctx.fillText(`00:${String(remaining).padStart(2, '0')}`, 480, 28);
    ctx.fillStyle = COLORS.muted; ctx.font = '12px Pretendard, system-ui'; ctx.fillText(`${cue.label} · BPM ${BPM}`, 480, 51);
    ctx.textAlign = 'right'; ctx.fillStyle = cue.danger ? COLORS.danger : COLORS.feedback; ctx.font = '700 12px Pretendard, system-ui'; ctx.fillText(cue.message, 936, 28);
    ctx.fillStyle = COLORS.border; ctx.fillRect(756, 43, 180, 7); ctx.fillStyle = this.state.tension > 68 ? COLORS.danger : COLORS.feedback; ctx.fillRect(756, 43, 180 * this.state.tension / 100, 7);
    ctx.fillStyle = COLORS.muted; ctx.font = '10px Pretendard, system-ui'; ctx.fillText('심박', 750, 51);

    if (time < this.state.feedbackUntilMs) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(3,7,18,.82)'; ctx.fillRect(260, 84, 440, 36);
      ctx.strokeStyle = this.state.feedback.includes('발각') || this.state.feedback.includes('붙잡') ? COLORS.danger : COLORS.border; ctx.strokeRect(260, 84, 440, 36);
      ctx.fillStyle = this.state.feedback.includes('발각') ? COLORS.danger : COLORS.text; ctx.font = '700 13px Pretendard, system-ui'; ctx.fillText(this.state.feedback, 480, 107);
    }
  }

  private drawBeatRail(time: number, phase: RhythmPhase): void {
    const ctx = this.context; const beat = beatAt(time); const active = beat.beatInBar - 1; const pulse = 1 - ((time % BEAT_MS) / BEAT_MS);
    ctx.fillStyle = 'rgba(3,7,18,.92)'; ctx.fillRect(332, 462, 420, 62); ctx.strokeStyle = COLORS.border; ctx.strokeRect(332, 462, 420, 62);
    ctx.textAlign = 'center';
    for (let index = 0; index < 4; index += 1) {
      const noteId = beat.id - active + index; const hidden = noteId >= 0 && CHART[noteId]?.hidden; const x = 390 + index * 72;
      ctx.strokeStyle = index < 2 ? '#d6d39a' : COLORS.feedback; ctx.beginPath(); ctx.moveTo(x - 35, 499); ctx.lineTo(x + 35, 499); ctx.stroke();
      if (hidden) {
        ctx.fillStyle = COLORS.danger; ctx.font = '700 18px monospace'; ctx.fillText('·', x, 504);
      } else {
        ctx.fillStyle = index === active ? (phase === 'light' ? '#d6d39a' : COLORS.feedback) : COLORS.border;
        ctx.beginPath(); ctx.arc(x, 499, index === active ? 8 + pulse * 4 : 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.text; ctx.font = '700 11px monospace'; ctx.fillText(String(index + 1), x, 482);
      }
    }
    ctx.fillStyle = phase === 'light' ? '#d6d39a' : COLORS.feedback; ctx.font = '700 12px Pretendard, system-ui';
    ctx.fillText(phase === 'light' ? '빛 · 멈춰' : '어둠 · 이동', 680, 504);
  }

  private drawTouchControls(time: number): void {
    this.drawControl(18, 'A', '왼쪽'); this.drawControl(112, 'D', '오른쪽'); this.drawControl(206, 'S', '숨기');
    this.drawControl(764, 'SHIFT', time >= 50_000 ? '달리기' : '추격 때'); this.drawControl(858, 'W', '문 열기');
  }

  private drawControl(x: number, key: string, label: string): void {
    const ctx = this.context; ctx.fillStyle = 'rgba(17,24,39,.92)'; ctx.fillRect(x, 468, 84, 48); ctx.strokeStyle = COLORS.border; ctx.strokeRect(x, 468, 84, 48);
    ctx.textAlign = 'center'; ctx.fillStyle = COLORS.muted; ctx.font = '700 9px monospace'; ctx.fillText(key, x + 42, 484); ctx.fillStyle = COLORS.text; ctx.font = '11px Pretendard, system-ui'; ctx.fillText(label, x + 42, 504);
  }

  private drawTitle(): void {
    const ctx = this.context; ctx.fillStyle = 'rgba(3,7,18,.78)'; ctx.fillRect(0, 0, 960, 540); ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.feedback; ctx.font = '700 13px Pretendard, system-ui'; ctx.fillText('2D RHYTHM · STEALTH · HORROR', 480, 92);
    ctx.fillStyle = COLORS.text; ctx.font = '700 54px Pretendard, system-ui'; ctx.fillText('4번째 박자', 480, 157);
    ctx.fillStyle = COLORS.danger; ctx.font = '700 18px Pretendard, system-ui'; ctx.fillText('리듬을 맞춰야, 살아남는다.', 480, 192);
    ctx.fillStyle = 'rgba(17,24,39,.96)'; ctx.fillRect(190, 226, 580, 154); ctx.strokeStyle = COLORS.border; ctx.strokeRect(190, 226, 580, 154);
    ctx.textAlign = 'left'; ctx.fillStyle = '#d6d39a'; ctx.font = '700 14px Pretendard, system-ui'; ctx.fillText('1 · 2  빛', 224, 260);
    ctx.fillStyle = COLORS.text; ctx.font = '13px Pretendard, system-ui'; ctx.fillText('아무 키도 누르지 말고 멈춘다.', 326, 260);
    ctx.fillStyle = COLORS.feedback; ctx.font = '700 14px Pretendard, system-ui'; ctx.fillText('3 · 4  어둠', 224, 295);
    ctx.fillStyle = COLORS.text; ctx.font = '13px Pretendard, system-ui'; ctx.fillText('A / D로 이동하고, 상자 앞에서는 S로 숨는다.', 326, 295);
    ctx.fillStyle = COLORS.danger; ctx.font = '700 14px Pretendard, system-ui'; ctx.fillText('목표', 224, 330);
    ctx.fillStyle = COLORS.text; ctx.font = '13px Pretendard, system-ui'; ctx.fillText('60초 안에 오른쪽 비상문에서 W. 실수는 세 번까지.', 326, 330);
    ctx.fillStyle = COLORS.muted; ctx.font = '12px Pretendard, system-ui'; ctx.fillText('중반부터 박자 신호가 하나씩 사라집니다.', 224, 361);
    ctx.fillStyle = COLORS.primary; ctx.fillRect(306, 408, 348, 54); ctx.strokeStyle = COLORS.feedback; ctx.strokeRect(306, 408, 348, 54);
    ctx.textAlign = 'center'; ctx.fillStyle = COLORS.text; ctx.font = '700 16px Pretendard, system-ui'; ctx.fillText('ENTER 또는 클릭하여 탈출 시작', 480, 441);
  }

  private drawResult(): void {
    const escaped = this.state.result === 'escaped';
    this.drawOverlay(escaped ? '비상문이 열렸다' : '박자를 놓쳤다', escaped
      ? '메트로놈은 멈췄지만, 네 번째 박자는 몸에 남아 있었다.\nENTER 또는 클릭 · 처음부터 다시'
      : `최근 안전 구역 ${Math.round(this.checkpointForRetry)}m에서 다시 시작합니다.\nENTER 또는 클릭 · 체크포인트 재시작`);
  }

  private drawOverlay(title: string, subtitle: string): void {
    const ctx = this.context; ctx.fillStyle = 'rgba(3,7,18,.94)'; ctx.fillRect(154, 146, 652, 242);
    ctx.strokeStyle = this.state.result === 'escaped' ? COLORS.feedback : COLORS.danger; ctx.strokeRect(154, 146, 652, 242);
    ctx.textAlign = 'center'; ctx.fillStyle = COLORS.text; ctx.font = '700 32px Pretendard, system-ui'; ctx.fillText(title, 480, 209);
    ctx.fillStyle = COLORS.muted; ctx.font = '14px Pretendard, system-ui'; subtitle.split('\n').forEach((line, index) => ctx.fillText(line, 480, 265 + index * 40));
  }

  private modeLabel(): string {
    return { idle: '정지', patrol: '순찰', investigate: '소음 조사', chase: '추격' }[this.state.monsterMode];
  }
}
