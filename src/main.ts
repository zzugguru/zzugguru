import './style.css';
import { MemoryReconstructionGame } from './features/memory-reconstruction/client/MemoryReconstructionGame';
import { RhythmHorrorGame } from './features/rhythm-horror/client/RhythmHorrorGame';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app 요소를 찾을 수 없습니다.');

app.innerHTML = `
  <main class="game-shell">
    <section class="chapter-menu" aria-labelledby="chapter-title">
      <p class="eyebrow">ZZUGGURU · STORY PROTOTYPES</p>
      <h1 id="chapter-title">플레이할 챕터를 선택하세요</h1>
      <button type="button" data-game="rhythm">Chapter 01 · 리듬 호러</button>
      <button type="button" data-game="memory">Chapter 03 · 마지막 저녁</button>
    </section>
    <section class="game-stage" hidden aria-label="선택한 챕터 게임">
      <canvas width="960" height="540" tabindex="0" aria-label="게임 화면"></canvas>
      <div class="map-controls" hidden aria-label="연구 구역 이동 조작">
        <span></span><button type="button" data-direction="up" aria-label="위로 이동">▲</button><span></span>
        <button type="button" data-direction="left" aria-label="왼쪽으로 이동">◀</button>
        <button type="button" data-direction="down" aria-label="아래로 이동">▼</button>
        <button type="button" data-direction="right" aria-label="오른쪽으로 이동">▶</button>
        <button class="interact-button" type="button" disabled>장치 작동 · E</button>
      </div>
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
const mapControls = app.querySelector<HTMLElement>('.map-controls');
const memoryChoices = app.querySelector<HTMLElement>('.memory-choices');
const lettingChoices = app.querySelector<HTMLElement>('.letting-go-choices');
const interactButton = app.querySelector<HTMLButtonElement>('.interact-button');
const returnButton = app.querySelector<HTMLButtonElement>('.return-button');
const retryButton = app.querySelector<HTMLButtonElement>('.retry-button');
const epilogueNext = app.querySelector<HTMLButtonElement>('.epilogue-next');
const liveRegion = app.querySelector<HTMLElement>('[role="status"]');
if (!menu || !stage || !canvas || !controlsText || !mapControls || !memoryChoices || !lettingChoices || !interactButton || !returnButton || !retryButton || !epilogueNext || !liveRegion) throw new Error('게임 인터페이스를 만들 수 없습니다.');

app.querySelectorAll<HTMLButtonElement>('[data-game]').forEach((button) => button.addEventListener('click', () => {
  menu.hidden = true; stage.hidden = false;
  if (button.dataset.game === 'memory') {
    canvas.setAttribute('aria-label', 'Chapter 03 연구 구역과 가족 기억 재구성 게임 화면');
    controlsText.textContent = '이동: 방향키/WASD/화면 버튼 · 상호작용: E/Enter';
    const directions = [...app.querySelectorAll<HTMLButtonElement>('[data-direction]')];
    new MemoryReconstructionGame(canvas, {
      map: mapControls,
      directions,
      interact: interactButton,
      choices: memoryChoices,
      choiceButtons: [...app.querySelectorAll<HTMLButtonElement>('[data-family]')],
      returnButton,
      retryButton,
      lettingChoices,
      lettingButtons: [...app.querySelectorAll<HTMLButtonElement>('[data-choice]')],
      epilogueNext,
      liveRegion,
    }).mount();
    requestAnimationFrame(() => directions[0].focus());
  } else {
    controlsText.textContent = 'D F J K · Enter 시작/다시 시작 · Esc 일시정지';
    new RhythmHorrorGame(canvas).mount();
    requestAnimationFrame(() => canvas.focus());
  }
}, { once: true }));
