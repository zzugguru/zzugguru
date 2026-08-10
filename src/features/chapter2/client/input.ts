import type { Direction } from '../shared/movement';

const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const CONFIRM_KEYS = new Set(['e', 'E', 'Enter']);
const CANCEL_KEYS = new Set(['x', 'X']);
const CONFIRM_CODES = new Set(['KeyE', 'Enter']);
const CANCEL_CODE = 'KeyX';
const CONFIRM_TOKEN = 'confirm';
const CANCEL_TOKEN = 'cancel';

export class InputState {
  private readonly pressed = new Set<string>();
  private confirmJustPressed = false;
  private cancelJustPressed = false;
  private leftJustPressed = false;
  private rightJustPressed = false;

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('click', this.handleClick);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (MOVE_KEYS.has(event.key)) {
      if (!this.pressed.has(event.key)) {
        if (event.key === 'ArrowLeft') this.leftJustPressed = true;
        if (event.key === 'ArrowRight') this.rightJustPressed = true;
      }
      this.pressed.add(event.key);
      event.preventDefault();
      return;
    }

    if (CONFIRM_CODES.has(event.code) || CONFIRM_KEYS.has(event.key)) {
      if (!this.pressed.has(CONFIRM_TOKEN)) this.confirmJustPressed = true;
      this.pressed.add(CONFIRM_TOKEN);
      event.preventDefault();
      return;
    }

    if (event.code === CANCEL_CODE || CANCEL_KEYS.has(event.key)) {
      if (!this.pressed.has(CANCEL_TOKEN)) this.cancelJustPressed = true;
      this.pressed.add(CANCEL_TOKEN);
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.key);
    if (CONFIRM_CODES.has(event.code) || CONFIRM_KEYS.has(event.key)) this.pressed.delete(CONFIRM_TOKEN);
    if (event.code === CANCEL_CODE || CANCEL_KEYS.has(event.key)) this.pressed.delete(CANCEL_TOKEN);
  };

  private readonly handleClick = (): void => {
    this.confirmJustPressed = true;
  };

  get direction(): Direction {
    return {
      up: this.pressed.has('ArrowUp'),
      down: this.pressed.has('ArrowDown'),
      left: this.pressed.has('ArrowLeft'),
      right: this.pressed.has('ArrowRight'),
    };
  }

  /** E, Enter 또는 마우스 클릭 — 진행/확인 액션. */
  wasConfirmJustPressed(): boolean {
    return this.confirmJustPressed;
  }

  /** X — 취소/나가기 액션. */
  wasCancelJustPressed(): boolean {
    return this.cancelJustPressed;
  }

  /** ← 키를 이번 프레임에 새로 눌렀는지 — 메뉴/채널 전환처럼 1회성 입력이 필요한 곳에 사용. */
  wasLeftJustPressed(): boolean {
    return this.leftJustPressed;
  }

  /** → 키를 이번 프레임에 새로 눌렀는지. */
  wasRightJustPressed(): boolean {
    return this.rightJustPressed;
  }

  /** 매 프레임 종료 시 호출해 "이번 프레임에만" 눌린 상태를 초기화합니다. */
  clearFrame(): void {
    this.confirmJustPressed = false;
    this.cancelJustPressed = false;
    this.leftJustPressed = false;
    this.rightJustPressed = false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('click', this.handleClick);
  }
}
