export interface MusicAudio {
  currentTime: number;
  loop: boolean;
  volume: number;
  pause(): void;
  play(): Promise<void>;
}

export interface GameMusicControl {
  restart(): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  timeMs(): number;
}

export class GameMusic implements GameMusicControl {
  private readonly audio: MusicAudio;
  private audible = false;
  private paused = true;
  private fallbackStartedAt = 0;
  private pausedAt = 0;

  constructor(
    source: string,
    createAudio: (source: string) => MusicAudio = (url) => new Audio(url),
    private readonly now: () => number = () => performance.now(),
  ) {
    this.audio = createAudio(source);
    this.audio.loop = false;
    this.audio.volume = 0.72;
  }

  async restart(): Promise<void> {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.pausedAt = 0;
    this.paused = true;
    this.audible = await this.playSafely();
    this.fallbackStartedAt = this.now();
    this.paused = false;
  }

  pause(): void {
    if (this.paused) return;
    this.pausedAt = this.timeMs();
    this.audio.pause();
    this.audible = false;
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.paused) return;
    try {
      this.audio.currentTime = this.pausedAt / 1000;
    } catch {
      // A failed seek still falls back to the monotonic clock below.
    }
    this.audible = await this.playSafely();
    this.fallbackStartedAt = this.now() - this.pausedAt;
    this.paused = false;
  }

  timeMs(): number {
    if (this.paused) return this.pausedAt;
    if (this.audible && Number.isFinite(this.audio.currentTime)) return Math.max(0, this.audio.currentTime * 1000);
    return Math.max(0, this.now() - this.fallbackStartedAt);
  }

  private async playSafely(): Promise<boolean> {
    try {
      await this.audio.play();
      return true;
    } catch {
      return false;
    }
  }
}
