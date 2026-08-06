import './style.css';
import { RhythmHorrorGame } from './features/rhythm-horror/client/RhythmHorrorGame';

const app = document.querySelector<HTMLElement>('#app');

if (!app) throw new Error('#app 요소를 찾을 수 없습니다.');

app.innerHTML = `
  <section class="game-shell" aria-label="새벽 3시 33분 리듬게임">
    <canvas width="960" height="540" aria-label="리듬게임 화면"></canvas>
    <p class="controls">D F J K · Enter 시작/재시작 · Esc 일시정지</p>
  </section>
`;

const canvas = app.querySelector('canvas');
if (!canvas) throw new Error('게임 canvas를 만들 수 없습니다.');

new RhythmHorrorGame(canvas).mount();
