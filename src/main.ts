import './style.css';
import { renderWelcome } from './features/welcome/client/renderWelcome';
import { Game } from './platform/client/Game';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('#app 요소를 찾을 수 없습니다.');
}

const canvas = document.createElement('canvas');
canvas.width = 960;
canvas.height = 540;
canvas.setAttribute('aria-label', '게임 화면');
app.append(canvas);

new Game(canvas, renderWelcome).start();
