import { CHART, DURATION_MS, cueAt } from '../shared/content';
import { judgeLane, overdueNotes, scoreFor, type Judgement } from '../shared/gameLogic';
import { SynthClock } from './SynthClock';

type Screen = 'title' | 'playing' | 'paused' | 'result';
const KEYS = ['D', 'F', 'J', 'K'];

export class RhythmHorrorGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly clock = new SynthClock();
  private screen: Screen = 'title';
  private resolved = new Set<number>();
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private health = 100;
  private lastJudgement: Judgement | null = null;
  private judgementUntil = 0;
  private pressed = new Set<number>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;
  }

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('click', this.onCanvasClick);
    requestAnimationFrame(this.loop);
  }

  private readonly onCanvasClick = (): void => {
    if (this.screen === 'title' || this.screen === 'result') void this.start();
  };

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
    const lane = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'].indexOf(event.code);
    if (lane < 0 || event.repeat) return;
    event.preventDefault();
    this.pressed.add(lane);
    if (this.screen === 'playing') this.hit(lane);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const lane = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'].indexOf(event.code);
    if (lane >= 0) this.pressed.delete(lane);
  };

  private async start(): Promise<void> {
    this.resolved = new Set();
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.health = 100;
    this.lastJudgement = null;
    this.screen = 'playing';
    try {
      await this.clock.start();
    } catch {
      this.clock.reset();
    }
  }

  private async togglePause(): Promise<void> {
    if (this.screen === 'playing') {
      this.clock.pause();
      this.screen = 'paused';
    } else {
      this.screen = 'playing';
      await this.clock.resume();
    }
  }

  private hit(lane: number): void {
    const result = judgeLane(CHART, this.resolved, lane, this.clock.timeMs());
    if (result.note) this.resolved.add(result.note.id);
    this.applyJudgement(result.judgement);
    this.clock.hit(result.judgement === 'perfect' ? 660 : result.judgement === 'good' ? 440 : 120);
  }

  private applyJudgement(judgement: Judgement): void {
    this.lastJudgement = judgement;
    this.judgementUntil = performance.now() + 420;
    if (judgement === 'miss') {
      this.combo = 0;
      this.health = Math.max(0, this.health - 6);
    } else {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += scoreFor(judgement, this.combo);
      this.health = Math.min(100, this.health + (judgement === 'perfect' ? 1.2 : 0.5));
    }
  }

  private readonly loop = (): void => {
    if (this.screen === 'playing') this.update();
    this.render();
    requestAnimationFrame(this.loop);
  };

  private update(): void {
    const time = this.clock.timeMs();
    for (const note of overdueNotes(CHART, this.resolved, time)) {
      this.resolved.add(note.id);
      this.applyJudgement('miss');
    }
    if (time >= DURATION_MS || this.health <= 0) {
      this.clock.pause();
      this.screen = 'result';
    }
  }

  private render(): void {
    const ctx = this.context;
    const time = this.screen === 'title' ? 0 : this.clock.timeMs();
    const cue = cueAt(time);
    ctx.clearRect(0, 0, 960, 540);
    this.drawCctv(cue.threat, time);
    if (this.screen === 'title') this.drawTitle();
    else {
      this.drawHud(time);
      this.drawLanes(time);
      this.drawStory(cue.chapter, cue.message, cue.camera);
      if (this.screen === 'paused') this.drawOverlay('일시정지', 'Esc로 계속');
      if (this.screen === 'result') this.drawResult(time >= DURATION_MS);
    }
  }

  private drawCctv(threat: number, time: number): void {
    const ctx = this.context;
    const gradient = ctx.createLinearGradient(0, 0, 960, 540);
    gradient.addColorStop(0, '#030712');
    gradient.addColorStop(1, threat > 4 ? '#240b16' : '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);
    ctx.strokeStyle = 'rgba(199,210,254,.12)';
    for (let x = 20; x < 940; x += 115) ctx.strokeRect(x, 72, 105, 92);
    ctx.fillStyle = '#172033';
    ctx.fillRect(42, 142, 330, 230);
    ctx.fillStyle = '#202b3d';
    for (let x = 70; x < 350; x += 90) ctx.fillRect(x, 174, 18, 198);
    if (threat > 0) {
      const closeness = Math.min(1, threat / 6);
      const x = 270 + closeness * 125;
      const y = 170 - closeness * 40;
      ctx.fillStyle = threat > 5 ? '#c9c3bd' : '#757986';
      ctx.beginPath();
      ctx.ellipse(x, y + 56, 18 + closeness * 18, 65 + closeness * 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17151b';
      ctx.beginPath();
      ctx.arc(x, y, 27 + closeness * 17, 0, Math.PI * 2);
      ctx.fill();
    }
    if (threat >= 4 || Math.floor(time / 333) % 17 === 0) {
      ctx.fillStyle = 'rgba(249,250,251,.08)';
      for (let y = 0; y < 540; y += 8) ctx.fillRect(0, y, 960, 2);
    }
  }

  private drawTitle(): void {
    const ctx = this.context;
    ctx.fillStyle = 'rgba(3,7,18,.82)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c7d2fe';
    ctx.font = '16px system-ui';
    ctx.fillText('CHAPTER 01 · RHYTHM HORROR PROTOTYPE', 480, 145);
    ctx.fillStyle = '#f9fafb';
    ctx.font = '700 50px system-ui';
    ctx.fillText('새벽 3시 33분', 480, 220);
    ctx.font = '20px system-ui';
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText('D F J K로 신호를 놓치지 마세요', 480, 278);
    this.button('ENTER 또는 클릭하여 근무 시작', 480, 348);
  }

  private drawHud(time: number): void {
    const ctx = this.context;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f9fafb';
    ctx.font = '700 18px system-ui';
    ctx.fillText(`SCORE ${this.score.toString().padStart(7, '0')}`, 28, 34);
    ctx.fillStyle = '#c7d2fe';
    ctx.font = '15px system-ui';
    ctx.fillText(`COMBO ${this.combo} · MAX ${this.maxCombo}`, 28, 57);
    ctx.fillStyle = '#374151';
    ctx.fillRect(740, 26, 190, 12);
    ctx.fillStyle = this.health > 35 ? '#818cf8' : '#fb7185';
    ctx.fillRect(740, 26, 190 * (this.health / 100), 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f9fafb';
    ctx.fillText(this.storyClock(time), 930, 58);
  }

  private drawLanes(time: number): void {
    const ctx = this.context;
    const left = 500;
    const width = 92;
    const hitY = 448;
    for (let lane = 0; lane < 4; lane += 1) {
      ctx.fillStyle = this.pressed.has(lane) ? 'rgba(129,140,248,.32)' : 'rgba(17,24,39,.72)';
      ctx.fillRect(left + lane * width, 82, width - 5, 390);
      ctx.strokeStyle = '#c7d2fe';
      ctx.strokeRect(left + lane * width, hitY, width - 5, 24);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f9fafb';
      ctx.font = '700 18px system-ui';
      ctx.fillText(KEYS[lane], left + lane * width + 43, 500);
    }
    for (const note of CHART) {
      if (this.resolved.has(note.id)) continue;
      const distance = note.timeMs - time;
      if (distance < -200 || distance > 2_700) continue;
      const y = hitY - (distance / 2_700) * 350;
      const x = left + note.lane * width + 9;
      ctx.fillStyle = distance < 150 ? '#f9fafb' : '#818cf8';
      ctx.fillRect(x, y, width - 23, 14);
    }
    if (this.lastJudgement && performance.now() < this.judgementUntil) {
      ctx.textAlign = 'center';
      ctx.font = '700 24px system-ui';
      ctx.fillStyle = this.lastJudgement === 'perfect' ? '#f9fafb' : this.lastJudgement === 'good' ? '#c7d2fe' : '#fb7185';
      ctx.fillText(this.lastJudgement.toUpperCase(), 682, 420);
    }
  }

  private drawStory(chapter: string, message: string, camera: string): void {
    const ctx = this.context;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#818cf8';
    ctx.font = '700 15px system-ui';
    ctx.fillText(`● REC  ${camera}`, 42, 400);
    ctx.fillStyle = '#f9fafb';
    ctx.font = '700 22px system-ui';
    ctx.fillText(chapter, 42, 438);
    ctx.fillStyle = '#c7d2fe';
    ctx.font = '17px system-ui';
    this.wrapText(message, 42, 470, 400, 26);
  }

  private drawResult(survived: boolean): void {
    const title = survived ? '녹화 종료' : '신호가 끊겼다';
    const subtitle = survived ? '그날 밤, CCTV가 저절로 켜졌다.' : '경비실의 모든 불이 꺼졌다.';
    this.drawOverlay(title, `${subtitle}\nSCORE ${this.score} · MAX COMBO ${this.maxCombo}\nEnter 또는 클릭하여 다시 시작`);
  }

  private drawOverlay(title: string, subtitle: string): void {
    const ctx = this.context;
    ctx.fillStyle = 'rgba(3,7,18,.9)';
    ctx.fillRect(180, 145, 600, 250);
    ctx.strokeStyle = '#374151';
    ctx.strokeRect(180, 145, 600, 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f9fafb';
    ctx.font = '700 36px system-ui';
    ctx.fillText(title, 480, 210);
    ctx.font = '17px system-ui';
    ctx.fillStyle = '#c7d2fe';
    subtitle.split('\n').forEach((line, index) => ctx.fillText(line, 480, 260 + index * 34));
  }

  private button(label: string, x: number, y: number): void {
    const ctx = this.context;
    ctx.fillStyle = '#312e81';
    ctx.fillRect(x - 165, y - 25, 330, 50);
    ctx.fillStyle = '#f9fafb';
    ctx.font = '700 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 6);
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = [...text];
    let line = '';
    for (const word of words) {
      if (this.context.measureText(line + word).width > maxWidth) {
        this.context.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else line += word;
    }
    this.context.fillText(line, x, y);
  }

  private storyClock(time: number): string {
    const startMinutes = 3 * 60 + 31;
    const minutes = startMinutes + Math.floor(time / 56_000);
    const seconds = Math.floor((time % 56_000) / (56_000 / 60));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
