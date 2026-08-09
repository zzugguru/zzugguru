import './style.css';
import { RhythmHorrorGame } from './features/rhythm-horror/client/RhythmHorrorGame';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app 요소를 찾을 수 없습니다.');

app.innerHTML = `
  <section class="game-shell" aria-labelledby="game-title">
    <h1 id="game-title" class="visually-hidden">새벽 3시 33분 리듬 호러 게임</h1>
    <canvas width="960" height="540"></canvas>
    <div class="controls" aria-label="게임 조작">
      <button type="button" data-action="hide"><kbd>Space</kbd><span>숨기</span></button>
      <button type="button" data-action="move"><kbd>WASD</kbd><span>이동</span></button>
      <button type="button" data-action="pause"><kbd>Esc</kbd><span>일시정지</span></button>
    </div>
    <p class="audio-note">소리를 켜고 플레이하세요 · 120 BPM · 헤드폰 권장</p>
  </section>
`;

const canvas = app.querySelector('canvas');
if (!canvas) throw new Error('게임 canvas를 만들 수 없습니다.');

const game = new RhythmHorrorGame(canvas);
game.mount();

app.querySelector('[data-action="hide"]')?.addEventListener('click', () => game.input('hide'));
app.querySelector('[data-action="move"]')?.addEventListener('click', () => game.input('move'));
app.querySelector('[data-action="pause"]')?.addEventListener('click', () => void game.togglePause());
