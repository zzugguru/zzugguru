import './style.css';
import { Chapter1StoryGame } from './features/chapter1/client/Chapter1StoryGame';
import { MemoryReconstructionGame } from './features/chapter3/client/MemoryReconstructionGame';
import { Chapter2Game } from './features/chapter2/client/Chapter2Game';
import { RooftopEscapeGame } from './features/chapter1/client/RooftopEscapeGame';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app 요소를 찾을 수 없습니다.');

app.innerHTML = `
  <main class="game-shell">
    <section class="chapter-menu" aria-labelledby="chapter-title">
      <p class="eyebrow">ZZUGGURU · STORY PROTOTYPES</p>
      <h1 id="chapter-title">플레이할 챕터를 선택하세요</h1>
      <button type="button" data-game="chapter1">Chapter 01 · 새벽 3시 33분</button>
      <button type="button" data-game="chapter2">Chapter 02 · 이온</button>
      <button type="button" data-game="memory">Chapter 03 · 마지막 저녁</button>
    </section>
    <section class="game-stage" hidden aria-label="선택한 챕터 게임">
      <canvas width="960" height="540" tabindex="0" aria-label="게임 화면"></canvas>
      <div class="memory-choices" hidden aria-label="가족 생체 용기 선택">
        <button type="button" data-family="wife" disabled>1 · 아내</button>
        <button type="button" data-family="son" disabled>2 · 큰아들</button>
        <button type="button" data-family="daughter" disabled>3 · 작은딸</button>
      </div>
      <div class="letting-go-choices" hidden aria-label="기억 연결 정리 선택">
        <button type="button" data-choice="hold" disabled>1 · 붙잡는다</button>
        <button type="button" data-choice="record" disabled>2 · 기록으로 남긴다</button>
        <button type="button" data-choice="release" disabled>3 · 놓아준다</button>
      </div>
      <button class="return-button" type="button" hidden>연구 구역으로 돌아가기</button>
      <button class="retry-button" type="button" hidden>기억 연결 다시 시도</button>
      <button class="epilogue-next" type="button" hidden>다음 · Enter</button>
      <p class="controls"></p>
      <p class="sr-only" role="status" aria-live="polite"></p>
    </section>
  </main>`;

const menu = app.querySelector<HTMLElement>('.chapter-menu');
const stage = app.querySelector<HTMLElement>('.game-stage');
const canvas = app.querySelector<HTMLCanvasElement>('canvas');
const controlsText = app.querySelector<HTMLElement>('.controls');
const memoryChoices = app.querySelector<HTMLElement>('.memory-choices');
const lettingChoices = app.querySelector<HTMLElement>('.letting-go-choices');
const returnButton = app.querySelector<HTMLButtonElement>('.return-button');
const retryButton = app.querySelector<HTMLButtonElement>('.retry-button');
const epilogueNext = app.querySelector<HTMLButtonElement>('.epilogue-next');
const liveRegion = app.querySelector<HTMLElement>('[role="status"]');
if (!menu || !stage || !canvas || !controlsText || !memoryChoices || !lettingChoices || !returnButton || !retryButton || !epilogueNext || !liveRegion) throw new Error('게임 인터페이스를 만들 수 없습니다.');

app.querySelectorAll<HTMLButtonElement>('[data-game]').forEach((button) => button.addEventListener('click', () => {
  menu.hidden = true; stage.hidden = false;
  if (button.dataset.game === 'memory') {
    canvas.setAttribute('aria-label', 'Chapter 03 연구 구역과 가족 기억 재구성 게임 화면');
    controlsText.textContent = '이동: 방향키/WASD · 상호작용: E/Enter';
    new MemoryReconstructionGame(canvas, {
      choices: memoryChoices,
      choiceButtons: [...app.querySelectorAll<HTMLButtonElement>('[data-family]')],
      returnButton,
      retryButton,
      lettingChoices,
      lettingButtons: [...app.querySelectorAll<HTMLButtonElement>('[data-choice]')],
      epilogueNext,
      liveRegion,
    }).mount();
    requestAnimationFrame(() => canvas.focus());
  } else if (button.dataset.game === 'chapter2') {
    canvas.setAttribute('aria-label', 'Chapter 02 이온 게임 화면');
    controlsText.textContent = '이동: 방향키 · 확인: Z 또는 클릭 · CCTV 채널 전환: ◀ ▶';
    new Chapter2Game(canvas).mount();
    requestAnimationFrame(() => canvas.focus());
  } else {
    canvas.setAttribute('aria-label', 'Chapter 01 새벽 3시 33분 스토리 화면');
    controlsText.textContent = '스토리 진행: E · Enter · 화면 클릭';
    new Chapter1StoryGame(canvas, liveRegion, () => {
      canvas.setAttribute('aria-label', 'Chapter 01 옥상 탈출 추격 게임 화면');
      controlsText.textContent = '이동: A/D · ←/→ · 점프: W/↑/Space · 포복: S/↓/Shift · 시작/재시작: E/Enter 또는 클릭';
      new RooftopEscapeGame(canvas, liveRegion).mount();
      requestAnimationFrame(() => canvas.focus());
    }).mount();
    requestAnimationFrame(() => canvas.focus());
  }
}, { once: true }));
