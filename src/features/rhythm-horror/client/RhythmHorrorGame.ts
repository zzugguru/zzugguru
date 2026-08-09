import backgroundMusicUrl from '../../../assets/어둠의 추격.mp3';
import { CHART, DURATION_MS, cueAt } from '../shared/content';
import {
  BEAT_MS,
  BPM,
  LEAD_IN_BEATS,
  judgeAction,
  overdueNotes,
  phaseForBeat,
  scoreFor,
  type BeatNote,
  type Judgement,
  type RhythmAction,
  type RhythmPhase,
} from '../shared/gameLogic';
import { GameMusic, type GameMusicControl } from './GameMusic';
import { BeatClick, beatIndexAt, type BeatClickControl } from './BeatClick';

type Screen = 'title' | 'loading' | 'playing' | 'paused' | 'result';

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

export class RhythmHorrorGame {
  private readonly context: CanvasRenderingContext2D;
  private screen: Screen = 'title';
  private resolved = new Set<number>();
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private hearts = 3;
  private threat = 22;
  private progress = 0;
  private lastJudgement: Judgement | null = null;
  private lastAction: RhythmAction | null = null;
  private judgementUntil = 0;
  private resultSurvived = false;
  private animationId: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly music: GameMusicControl = new GameMusic(backgroundMusicUrl),
    private readonly beatClick: BeatClickControl = new BeatClick(),
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;
  }

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', '새벽 3시 33분. 빛에서는 숨고 어둠에서는 이동하는 리듬 호러 게임');
    if (this.animationId === null) this.animationId = requestAnimationFrame(this.loop);
  }

  input(action: RhythmAction): void {
    if (this.screen !== 'playing') return;
    const result = judgeAction(CHART, this.resolved, action, this.music.timeMs());
    if (result.note) this.resolved.add(result.note.id);
    this.applyJudgement(result.judgement, action, result.note);
  }

  async togglePause(): Promise<void> {
    if (this.screen === 'playing') {
      this.music.pause();
      this.beatClick.pause();
      this.screen = 'paused';
      return;
    }
    if (this.screen === 'paused') {
      await Promise.all([this.music.resume(), this.beatClick.resume()]);
      if (this.screen === 'paused') this.screen = 'playing';
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Enter' && (this.screen === 'title' || this.screen === 'result')) {
      event.preventDefault();
      void this.start();
      return;
    }
    if (event.code === 'Escape' && (this.screen === 'playing' || this.screen === 'paused')) {
      event.preventDefault();
      void this.togglePause();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) this.input('hide');
      return;
    }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      if (!event.repeat) this.input('move');
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.canvas.focus();
    if (this.screen === 'title' || this.screen === 'result') {
      void this.start();
      return;
    }
    if (this.screen === 'paused') {
      void this.togglePause();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    if (y >= 455 && y <= 525) this.input(x < 180 ? 'hide' : x < 330 ? 'move' : this.currentPhase() === 'light' ? 'hide' : 'move');
  };

  private async start(): Promise<void> {
    this.resolved = new Set();
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hearts = 3;
    this.threat = 22;
    this.progress = 0;
    this.lastJudgement = null;
    this.lastAction = null;
    this.resultSurvived = false;
    this.screen = 'loading';
    await Promise.all([this.music.restart(), this.beatClick.start()]);
    if (this.screen === 'loading') this.screen = 'playing';
  }

  private readonly loop = (): void => {
    if (this.screen === 'playing') this.update();
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    const time = this.music.timeMs();
    const beatIndex = beatIndexAt(time);
    this.beatClick.sync(time, CHART[beatIndex]);
    for (const note of overdueNotes(CHART, this.resolved, time)) {
      this.resolved.add(note.id);
      this.applyJudgement('miss', null, note);
      if (this.screen === 'result') return;
    }
    if (time >= DURATION_MS) this.finish(this.hearts > 0 && this.progress >= 38);
  }

  private applyJudgement(judgement: Judgement, action: RhythmAction | null, note: BeatNote | null): void {
    this.lastJudgement = judgement;
    this.lastAction = action;
    this.judgementUntil = performance.now() + 430;

    if (judgement === 'perfect' || judgement === 'good') {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += scoreFor(judgement, this.combo);
      if (action === 'move') {
        this.progress += 1;
        this.threat = Math.max(0, this.threat - 11);
      } else {
        this.threat = Math.max(0, this.threat - 7);
      }
      return;
    }

    this.combo = 0;
    this.threat += judgement === 'wrong' ? 25 : note ? 15 : 7;
    while (this.threat >= 100 && this.hearts > 0) {
      this.hearts -= 1;
      this.threat -= 42;
    }
    if (this.hearts <= 0) this.finish(false);
  }

  private finish(survived: boolean): void {
    this.resultSurvived = survived;
    this.music.pause();
    this.beatClick.pause();
    this.screen = 'result';
  }

  private currentPhase(time = this.music.timeMs()): RhythmPhase {
    const globalBeat = Math.max(0, Math.floor(time / BEAT_MS) - LEAD_IN_BEATS);
    return phaseForBeat((globalBeat % 4) + 1);
  }

  private render(): void {
    const time = this.screen === 'title' ? 0 : this.music.timeMs();
    const phase = this.currentPhase(time);
    this.drawHallway(time, phase);
    if (this.screen === 'title') {
      this.drawTitle();
      return;
    }
    this.drawHud(time);
    this.drawNarrative(time);
    this.drawBeatRail(time, phase);
    this.drawTouchControls(phase);
    if (this.screen === 'loading') this.drawOverlay('음악 신호 연결 중', '잠시만 기다려 주세요');
    if (this.screen === 'paused') this.drawOverlay('일시정지', 'Esc 또는 화면을 눌러 계속');
    if (this.screen === 'result') this.drawResult();
  }

  private drawHallway(time: number, phase: RhythmPhase): void {
    const ctx = this.context;
    const cue = cueAt(time);
    const finalChase = cue.threatLevel >= 5;
    const lightOn = phase === 'light';
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, lightOn ? '#101c1c' : COLORS.background);
    gradient.addColorStop(0.65, finalChase ? '#210910' : lightOn ? '#142326' : '#080d17');
    gradient.addColorStop(1, '#030712');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = lightOn ? '#152526' : '#0b111c';
    ctx.fillRect(0, 72, 960, 280);
    ctx.strokeStyle = lightOn ? 'rgba(199,210,254,.14)' : 'rgba(55,65,81,.42)';
    ctx.lineWidth = 1;
    for (let y = 82; y < 352; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }
    for (let x = 0; x < 960; x += 74) {
      const offset = Math.floor(x / 74) % 2 ? 18 : 0;
      ctx.beginPath();
      ctx.moveTo(x + offset, 72);
      ctx.lineTo(x + offset, 352);
      ctx.stroke();
    }

    this.drawDoor(88, 156, 'B1', '보관실', lightOn);
    this.drawDoor(742, 142, cue.location, '03:33', lightOn);
    this.drawLamp(260, 72, lightOn, finalChase);
    this.drawLamp(612, 72, lightOn, finalChase);

    ctx.fillStyle = lightOn ? '#17262a' : '#080d15';
    ctx.beginPath();
    ctx.moveTo(0, 352);
    ctx.lineTo(960, 352);
    ctx.lineTo(960, 454);
    ctx.lineTo(0, 454);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(129,140,248,.12)';
    for (let x = 0; x <= 960; x += 80) {
      ctx.beginPath();
      ctx.moveTo(480, 352);
      ctx.lineTo(x, 454);
      ctx.stroke();
    }
    for (let y = 366; y < 454; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }

    const playerX = 150 + Math.min(1, this.progress / 55) * 270;
    const monsterX = 830 - this.threat * 2.45;
    this.drawPlayer(playerX, 322, phase === 'dark' && this.lastAction === 'move');
    this.drawMonster(Math.max(playerX + 72, monsterX), 280, finalChase);

    if (phase === 'dark') {
      ctx.fillStyle = 'rgba(3,7,18,.54)';
      ctx.fillRect(0, 72, 960, 382);
    }
    if (Math.floor(time / 333) % 23 === 0 || cue.threatLevel >= 4) {
      ctx.fillStyle = finalChase ? 'rgba(251,113,133,.08)' : 'rgba(249,250,251,.045)';
      for (let y = 0; y < 454; y += 9) ctx.fillRect(0, y, 960, 2);
    }
  }

  private drawDoor(x: number, y: number, label: string, sublabel: string, lit: boolean): void {
    const ctx = this.context;
    ctx.fillStyle = lit ? '#162c2c' : '#0b111a';
    ctx.fillRect(x, y, 122, 196);
    ctx.strokeStyle = lit ? '#45605f' : COLORS.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 122, 196);
    ctx.fillStyle = lit ? '#76a89e' : '#556176';
    ctx.font = '700 20px monospace';
    ctx.fillText(label, x + 14, y + 34);
    ctx.font = '12px Pretendard, system-ui';
    ctx.fillText(sublabel, x + 14, y + 53);
    ctx.fillRect(x + 96, y + 98, 7, 7);
  }

  private drawLamp(x: number, y: number, lit: boolean, danger: boolean): void {
    const ctx = this.context;
    ctx.fillStyle = danger ? '#fb7185' : lit ? '#d9d692' : '#556176';
    ctx.fillRect(x - 30, y, 60, 7);
    ctx.fillRect(x - 5, y + 7, 10, 9);
    if (!lit && !danger) return;
    const glow = ctx.createRadialGradient(x, y + 18, 2, x, y + 18, 110);
    glow.addColorStop(0, danger ? 'rgba(251,113,133,.24)' : 'rgba(217,214,146,.2)');
    glow.addColorStop(1, 'rgba(3,7,18,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 120, y, 240, 210);
  }

  private drawPlayer(x: number, y: number, moving: boolean): void {
    const ctx = this.context;
    const bob = moving ? Math.sin(this.music.timeMs() / 70) * 3 : 0;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.fillStyle = '#111827';
    ctx.fillRect(-14, -48, 30, 38);
    ctx.fillStyle = '#c3a98e';
    ctx.fillRect(-11, -65, 24, 19);
    ctx.fillStyle = '#202735';
    ctx.fillRect(-14, -70, 30, 11);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(-10, -36, 5, 18);
    ctx.fillStyle = '#080b12';
    ctx.fillRect(-12, -10, 9, 22);
    ctx.fillRect(7, -10, 9, 22);
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(8, -58, 3, 3);
    ctx.restore();
  }

  private drawMonster(x: number, y: number, enraged: boolean): void {
    const ctx = this.context;
    const scale = 0.85 + this.threat / 230;
    ctx.save();
    ctx.translate(Math.round(x), y);
    ctx.scale(scale, scale);
    ctx.fillStyle = enraged ? '#13080d' : '#090d14';
    ctx.beginPath();
    ctx.ellipse(0, 10, 42, 74, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, -58, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = enraged ? '#1b0a10' : '#0b1018';
    ctx.beginPath();
    ctx.moveTo(-30, -6);
    ctx.lineTo(-60, 60);
    ctx.moveTo(30, -5);
    ctx.lineTo(58, 62);
    ctx.stroke();
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(-19, -64, 6, 5);
    ctx.fillRect(10, -62, 6, 5);
    ctx.restore();
  }

  private drawHud(time: number): void {
    const ctx = this.context;
    ctx.fillStyle = 'rgba(3,7,18,.86)';
    ctx.fillRect(0, 0, 960, 72);
    ctx.textAlign = 'left';
    ctx.font = '700 18px Pretendard, system-ui';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`♥ ${'●'.repeat(this.hearts)}${'○'.repeat(3 - this.hearts)}`, 24, 29);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Pretendard, system-ui';
    ctx.fillText(`SCORE ${this.score.toString().padStart(6, '0')}  ·  COMBO ${this.combo}`, 24, 52);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 17px monospace';
    ctx.fillText(this.storyClock(time), 480, 29);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Pretendard, system-ui';
    ctx.fillText(`BPM ${BPM} · ${Math.min(100, Math.floor((time / DURATION_MS) * 100))}%`, 480, 52);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 14px Pretendard, system-ui';
    ctx.fillText('추격 거리', 936, 25);
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(756, 37, 180, 10);
    ctx.fillStyle = this.threat >= 70 ? COLORS.danger : COLORS.feedback;
    ctx.fillRect(756, 37, 180 * Math.min(1, this.threat / 100), 10);
  }

  private drawNarrative(time: number): void {
    const cue = cueAt(time);
    const ctx = this.context;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(3,7,18,.76)';
    ctx.fillRect(24, 372, 414, 70);
    ctx.strokeStyle = 'rgba(199,210,254,.18)';
    ctx.strokeRect(24, 372, 414, 70);
    ctx.fillStyle = cue.threatLevel >= 4 ? COLORS.danger : COLORS.feedback;
    ctx.font = '700 13px Pretendard, system-ui';
    ctx.fillText(`● REC  ${cue.location}  /  ${cue.chapter}`, 38, 394);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Pretendard, system-ui';
    ctx.fillText(cue.message, 38, 421);
  }

  private drawBeatRail(time: number, phase: RhythmPhase): void {
    const ctx = this.context;
    const absoluteBeat = Math.max(0, Math.floor(time / BEAT_MS) - LEAD_IN_BEATS);
    const barStart = Math.floor(absoluteBeat / 4) * 4;
    const active = absoluteBeat % 4;
    const pulse = 1 - Math.min(1, Math.abs((time % BEAT_MS) - 0) / BEAT_MS);

    ctx.fillStyle = 'rgba(3,7,18,.9)';
    ctx.fillRect(344, 458, 372, 66);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(344, 458, 372, 66);
    ctx.textAlign = 'center';
    for (let index = 0; index < 4; index += 1) {
      const note = CHART[barStart + index];
      const x = 404 + index * 82;
      ctx.strokeStyle = index < 2 ? '#d9d692' : COLORS.feedback;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 41, 496);
      ctx.lineTo(x + 41, 496);
      ctx.stroke();
      if (note?.hidden) {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = COLORS.danger;
        ctx.beginPath();
        ctx.arc(x, 496, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COLORS.danger;
        ctx.font = '12px Pretendard, system-ui';
        ctx.fillText('삭제', x, 478);
      } else {
        const radius = index === active ? 9 + pulse * 3 : 6;
        ctx.fillStyle = index === active ? (phase === 'light' ? '#d9d692' : COLORS.feedback) : COLORS.muted;
        ctx.beginPath();
        ctx.arc(x, 496, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.text;
        ctx.font = '700 13px monospace';
        ctx.fillText(String(index + 1), x, 480);
      }
    }
    ctx.fillStyle = phase === 'light' ? '#d9d692' : COLORS.feedback;
    ctx.font = '700 13px Pretendard, system-ui';
    ctx.fillText(phase === 'light' ? '빛 · 숨는다' : '어둠 · 이동한다', 530, 518);

    if (this.lastJudgement && performance.now() < this.judgementUntil) {
      ctx.fillStyle = this.lastJudgement === 'perfect' ? COLORS.text : this.lastJudgement === 'good' ? COLORS.feedback : COLORS.danger;
      ctx.font = '700 18px Pretendard, system-ui';
      ctx.fillText(this.judgementLabel(), 530, 452);
    }
  }

  private drawTouchControls(phase: RhythmPhase): void {
    this.drawControlButton(24, 465, 142, 52, 'SPACE', '숨기', phase === 'light');
    this.drawControlButton(178, 465, 142, 52, 'WASD / 방향키', '이동', phase === 'dark');
  }

  private drawControlButton(x: number, y: number, width: number, height: number, key: string, label: string, active: boolean): void {
    const ctx = this.context;
    ctx.fillStyle = active ? COLORS.primary : 'rgba(17,24,39,.9)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = active ? COLORS.feedback : COLORS.border;
    ctx.strokeRect(x, y, width, height);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.muted;
    ctx.font = '10px monospace';
    ctx.fillText(key, x + width / 2, y + 17);
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 15px Pretendard, system-ui';
    ctx.fillText(label, x + width / 2, y + 39);
  }

  private drawTitle(): void {
    const ctx = this.context;
    ctx.fillStyle = 'rgba(3,7,18,.74)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.muted;
    ctx.font = '700 14px Pretendard, system-ui';
    ctx.fillText('CHAPTER 01 · 4 BEAT RHYTHM HORROR', 480, 118);
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 52px Pretendard, system-ui';
    ctx.fillText('새벽 3시 33분', 480, 183);
    ctx.fillStyle = COLORS.danger;
    ctx.font = '700 19px Pretendard, system-ui';
    ctx.fillText('리듬을 맞춰야, 살아남는다.', 480, 220);

    ctx.fillStyle = 'rgba(17,24,39,.94)';
    ctx.fillRect(212, 250, 536, 118);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(212, 250, 536, 118);
    ctx.textAlign = 'left';
    ctx.font = '700 16px Pretendard, system-ui';
    ctx.fillStyle = '#d9d692';
    ctx.fillText('1 · 2  빛', 246, 286);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Pretendard, system-ui';
    ctx.fillText('SPACE로 숨는다. 움직이면 들킨다.', 350, 286);
    ctx.font = '700 16px Pretendard, system-ui';
    ctx.fillStyle = COLORS.feedback;
    ctx.fillText('3 · 4  어둠', 246, 326);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Pretendard, system-ui';
    ctx.fillText('WASD/방향키로 다음 안전지점까지 이동한다.', 350, 326);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px Pretendard, system-ui';
    ctx.fillText('중반부터 박자가 사라집니다. 음악의 간격을 기억하세요.', 246, 353);

    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(305, 402, 350, 56);
    ctx.strokeStyle = COLORS.feedback;
    ctx.strokeRect(305, 402, 350, 56);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 17px Pretendard, system-ui';
    ctx.fillText('ENTER 또는 클릭하여 순찰 시작', 480, 437);
  }

  private drawResult(): void {
    const title = this.resultSurvived ? '새벽을 빠져나왔다' : '신호가 끊겼다';
    const story = this.resultSurvived
      ? '뒤돌아본 CCTV 속에는 경비복을 입은 남자가 서 있었다.'
      : '경비실의 모든 불이 꺼지고, 화면은 정확히 7분간 멈췄다.';
    this.drawOverlay(title, `${story}\nSCORE ${this.score} · MAX COMBO ${this.maxCombo} · 이동 ${this.progress}\nEnter 또는 클릭하여 다시 시작`);
  }

  private drawOverlay(title: string, subtitle: string): void {
    const ctx = this.context;
    ctx.fillStyle = 'rgba(3,7,18,.93)';
    ctx.fillRect(150, 136, 660, 274);
    ctx.strokeStyle = this.resultSurvived ? COLORS.feedback : COLORS.danger;
    ctx.strokeRect(150, 136, 660, 274);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 34px Pretendard, system-ui';
    ctx.fillText(title, 480, 202);
    ctx.font = '15px Pretendard, system-ui';
    ctx.fillStyle = COLORS.muted;
    subtitle.split('\n').forEach((line, index) => ctx.fillText(line, 480, 258 + index * 38));
  }

  private judgementLabel(): string {
    if (this.lastJudgement === 'perfect') return this.lastAction === 'move' ? 'PERFECT · 이동' : 'PERFECT · 숨기';
    if (this.lastJudgement === 'good') return 'GOOD';
    if (this.lastJudgement === 'wrong') return '위험! 반대 행동';
    return 'MISS · 괴물이 가까워진다';
  }

  private storyClock(time: number): string {
    const elapsedSeconds = Math.min(60, Math.floor(time / 1000));
    const minute = elapsedSeconds >= 60 ? 33 : 32;
    const second = elapsedSeconds >= 60 ? 0 : elapsedSeconds;
    return `03:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }
}
