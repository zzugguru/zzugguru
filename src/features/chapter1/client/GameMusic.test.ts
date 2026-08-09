import { describe, expect, it, vi } from 'vitest';
import { GameMusic, type MusicAudio } from './GameMusic';

function setup(play: () => Promise<void> = () => Promise.resolve()) {
  let now = 1_000;
  const audio: MusicAudio = {
    currentTime: 0,
    loop: true,
    volume: 1,
    pause: vi.fn(),
    play: vi.fn(play),
  };
  const createAudio = vi.fn(() => audio);
  const music = new GameMusic('/music.mp3', createAudio, () => now);
  return { audio, createAudio, music, advance: (ms: number) => { now += ms; } };
}

describe('GameMusic', () => {
  it('사용자 시작에서 음원을 처음부터 한 번 재생한다', async () => {
    const { audio, createAudio, music } = setup();
    audio.currentTime = 19;

    await music.restart();

    expect(createAudio).toHaveBeenCalledWith('/music.mp3');
    expect(audio.loop).toBe(false);
    expect(audio.volume).toBe(0.72);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it('재생 가능할 때 오디오 위치를 게임의 시간 기준으로 사용한다', async () => {
    const { audio, music } = setup();
    await music.restart();
    audio.currentTime = 12.345;
    expect(music.timeMs()).toBe(12_345);
  });

  it('일시정지와 재개에서 같은 위치를 유지한다', async () => {
    const { audio, music } = setup();
    await music.restart();
    audio.currentTime = 8;
    music.pause();
    audio.currentTime = 99;
    expect(music.timeMs()).toBe(8_000);

    audio.currentTime = 8;
    await music.resume();
    expect(music.timeMs()).toBe(8_000);
  });

  it('브라우저가 재생을 거절하면 monotonic fallback 시간으로 계속 간다', async () => {
    const { advance, music } = setup(() => Promise.reject(new Error('blocked')));
    await expect(music.restart()).resolves.toBeUndefined();
    advance(2_750);
    expect(music.timeMs()).toBe(2_750);
  });

  it('fallback 재생을 일시정지한 뒤 오디오 재개에 성공해도 같은 위치를 유지한다', async () => {
    let attempt = 0;
    const { advance, audio, music } = setup(() => attempt++ === 0
      ? Promise.reject(new Error('blocked'))
      : Promise.resolve());
    await music.restart();
    advance(8_000);
    music.pause();

    await music.resume();

    expect(audio.currentTime).toBe(8);
    expect(music.timeMs()).toBe(8_000);
  });

  it('초기 play가 대기 중일 때 fallback 판정 시간이 먼저 흐르지 않는다', async () => {
    let resolvePlay: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => { resolvePlay = resolve; });
    const { advance, music } = setup(() => pending);

    const restarting = music.restart();
    advance(3_000);
    expect(music.timeMs()).toBe(0);
    resolvePlay?.();
    await restarting;
    expect(music.timeMs()).toBe(0);
  });
});
