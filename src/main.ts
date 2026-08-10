import './style.css';
import { Chapter1StoryGame } from './features/chapter1/client/Chapter1StoryGame';
import { MemoryReconstructionGame } from './features/chapter3/client/MemoryReconstructionGame';
import { Chapter2Game } from './features/chapter2/client/Chapter2Game';
import { RooftopEscapeGame } from './features/chapter1/client/RooftopEscapeGame';
import {
  readChapterProgress, unlockAfterCompletion,
  type ProgressStorage,
} from './features/welcome/shared/chapterProgress';
import {
  activateChapter, chapterIdForButton, renderChapterLocks,
} from './features/welcome/client/chapterMenuProgress';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app 요소를 찾을 수 없습니다.');

app.innerHTML = `
  <main class="game-shell">
    <section class="chapter-menu" aria-labelledby="chapter-title">
      <header class="chapter-menu__intro">
        <p class="eyebrow">ZZUGGURU · STORY JOURNEY</p>
        <h1 id="chapter-title">기억의 경계를 건너세요</h1>
        <p class="chapter-menu__lede">한 챕터의 끝이 다음 기억을 엽니다. 이어갈 이야기를 선택하세요.</p>
        <p class="chapter-progress" aria-live="polite">
          <span class="chapter-progress__label">STORY PROGRESS</span>
          <strong data-progress-count>1 / 3 CHAPTERS OPEN</strong>
        </p>
      </header>
      <nav class="chapter-list" aria-label="스토리 챕터">
        <button class="chapter-card" type="button" data-game="chapter1" data-unlocked-label="Chapter 01 · 새벽 3시 33분">
          <span class="chapter-card__meta"><span>CHAPTER 01</span><span class="chapter-card__status" data-chapter-status>플레이 가능</span></span>
          <strong class="chapter-card__title">새벽 3시 33분</strong>
          <span class="chapter-card__premise">사라진 일상의 흔적을 따라 아파트의 밤을 통과합니다.</span>
          <span class="chapter-card__action" data-chapter-action>이야기 시작 <span aria-hidden="true">→</span></span>
        </button>
        <button class="chapter-card" type="button" data-game="chapter2" data-unlocked-label="Chapter 02 · 이온">
          <span class="chapter-card__meta"><span>CHAPTER 02</span><span class="chapter-card__status" data-chapter-status>잠김</span></span>
          <strong class="chapter-card__title">이온</strong>
          <span class="chapter-card__premise">뒤틀린 기억 속에서 관계의 균열과 마주합니다.</span>
          <span class="chapter-card__action" data-chapter-action>Chapter 1 완료 필요</span>
        </button>
        <button class="chapter-card" type="button" data-game="memory" data-unlocked-label="Chapter 03 · 마지막 저녁">
          <span class="chapter-card__meta"><span>CHAPTER 03</span><span class="chapter-card__status" data-chapter-status>잠김</span></span>
          <strong class="chapter-card__title">마지막 저녁</strong>
          <span class="chapter-card__premise">가족의 기억을 복원하고 놓아줄 것을 결정합니다.</span>
          <span class="chapter-card__action" data-chapter-action>Chapter 2 완료 필요</span>
        </button>
      </nav>
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

const progressStorage: ProgressStorage | null = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
let highestUnlocked = readChapterProgress(progressStorage);
const chapterButtons = [...app.querySelectorAll<HTMLButtonElement>('[data-game]')];
const progressCount = app.querySelector<HTMLElement>('[data-progress-count]');
if (!progressCount) throw new Error('챕터 진행 표시를 만들 수 없습니다.');

const updateChapterLocks = (): void => {
  renderChapterLocks(chapterButtons, highestUnlocked);
  progressCount.textContent = `${highestUnlocked} / 3 CHAPTERS OPEN`;
};

const startChapter3 = (): void => {
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
};

const unlockAndStartChapter3 = (): void => {
  highestUnlocked = unlockAfterCompletion(progressStorage, highestUnlocked, 'chapter2');
  updateChapterLocks();
  startChapter3();
};

const startChapter2 = (): void => {
  canvas.setAttribute('aria-label', 'Chapter 02 이온 게임 화면');
  controlsText.textContent = '이동: 방향키 · 확인: E/Enter 또는 클릭 · CCTV 채널 전환: ◀ ▶';
  new Chapter2Game(canvas, unlockAndStartChapter3).mount();
  requestAnimationFrame(() => canvas.focus());
};

const unlockAndStartChapter2 = (): void => {
  highestUnlocked = unlockAfterCompletion(progressStorage, highestUnlocked, 'chapter1');
  updateChapterLocks();
  startChapter2();
};

updateChapterLocks();

chapterButtons.forEach((button) => button.addEventListener('click', () => {
  const chapter = chapterIdForButton(button);
  const activated = activateChapter(chapter, highestUnlocked, () => {
    menu.hidden = true; stage.hidden = false;
  }, () => {
    liveRegion.textContent = chapter === 'chapter2' ? 'Chapter 1을 먼저 완료해야 합니다.' : 'Chapter 2를 먼저 완료해야 합니다.';
  });
  if (!activated) return;
  if (button.dataset.game === 'memory') {
    startChapter3();
  } else if (button.dataset.game === 'chapter2') {
    startChapter2();
  } else {
    canvas.setAttribute('aria-label', 'Chapter 01 새벽 3시 33분 스토리 화면');
    controlsText.textContent = '스토리 진행: E · Enter · 화면 클릭';
    new Chapter1StoryGame(canvas, liveRegion, () => {
      canvas.setAttribute('aria-label', 'Chapter 01 옥상 탈출 추격 게임 화면');
      controlsText.textContent = '이동: A/D · ←/→ · 점프: W/↑/Space · 포복: S/↓/Shift · 시작/재시작: E/Enter 또는 클릭';
      new RooftopEscapeGame(canvas, liveRegion, unlockAndStartChapter2).mount();
      requestAnimationFrame(() => canvas.focus());
    }).mount();
    requestAnimationFrame(() => canvas.focus());
  }
}, { once: true }));
