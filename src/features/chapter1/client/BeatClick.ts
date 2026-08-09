import { BEAT_MS, LEAD_IN_BEATS, type BeatNote } from '../shared/gameLogic';

export interface BeatClickControl {
  start(): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  sync(timeMs: number, note: BeatNote | undefined): void;
}

export function beatIndexAt(timeMs: number): number {
  return Math.floor(timeMs / BEAT_MS) - LEAD_IN_BEATS;
}

export class BeatClick implements BeatClickControl {
  private context: AudioContext | null = null;
  private lastBeat = -1;

  constructor(private readonly createContext: () => AudioContext = () => new AudioContext()) {}

  async start(): Promise<void> {
    this.lastBeat = -1;
    try {
      this.context ??= this.createContext();
      await this.context.resume();
    } catch {
      this.context = null;
    }
  }

  pause(): void {
    void this.context?.suspend().catch(() => undefined);
  }

  async resume(): Promise<void> {
    try {
      await this.context?.resume();
    } catch {
      this.context = null;
    }
  }

  sync(timeMs: number, note: BeatNote | undefined): void {
    const beat = beatIndexAt(timeMs);
    if (beat < 0 || beat === this.lastBeat) return;
    this.lastBeat = beat;
    if (!this.context || !note || note.hidden) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = note.beatInBar === 1 ? 880 : note.phase === 'light' ? 660 : 440;
    gain.gain.setValueAtTime(0.032, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.045);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.045);
  }
}
