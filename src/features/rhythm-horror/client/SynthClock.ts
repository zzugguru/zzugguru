export class SynthClock {
  private context: AudioContext | null = null;
  private startedAt = 0;
  private pausedAt = 0;
  private timer: number | null = null;
  private fallbackStartedAt = 0;

  async start(fromMs = 0): Promise<void> {
    this.stopBeat();
    this.fallbackStartedAt = performance.now() - fromMs;
    this.pausedAt = 0;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      this.startedAt = this.context.currentTime - fromMs / 1000;
      this.scheduleBeat();
    } catch {
      this.context = null;
    }
  }

  timeMs(): number {
    if (!this.context) return this.pausedAt || Math.max(0, performance.now() - this.fallbackStartedAt);
    return this.pausedAt || Math.max(0, (this.context.currentTime - this.startedAt) * 1000);
  }

  pause(): void {
    if (this.pausedAt) return;
    this.pausedAt = this.timeMs();
    this.stopBeat();
  }

  async resume(): Promise<void> {
    if (!this.pausedAt) return;
    await this.start(this.pausedAt);
  }

  reset(): void {
    this.stopBeat();
    this.pausedAt = 0;
    this.startedAt = this.context?.currentTime ?? 0;
    this.fallbackStartedAt = performance.now();
  }

  hit(frequency: number): void {
    if (!this.context) return;
    this.tone(frequency, 0.035, 0.025);
  }

  private scheduleBeat(): void {
    const elapsed = this.timeMs();
    const nextBeat = nextBeatTimeMs(elapsed);
    this.timer = window.setTimeout(() => {
      if (!this.context) return;
      const current = this.timeMs();
      this.tone(current > 91_000 ? 82 : 55, 0.045, current >= 58_000 ? 0.05 : 0.035);
      this.scheduleBeat();
    }, Math.max(0, nextBeat - elapsed));
  }

  private tone(frequency: number, duration: number, volume: number): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  private stopBeat(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}

/** 채보와 동일한 절대 시간축의 다음 박자 경계를 반환합니다. */
export function nextBeatTimeMs(elapsedMs: number): number {
  if (elapsedMs < 2_500) return 2_500;
  if (elapsedMs < 58_000) return 2_500 + (Math.floor((elapsedMs - 2_500) / 750) + 1) * 750;
  return 58_000 + (Math.floor((elapsedMs - 58_000) / 600) + 1) * 600;
}
