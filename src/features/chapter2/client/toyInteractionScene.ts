import { isWithinRange } from '../shared/proximity';
import { step, type Bounds } from '../shared/movement';
import type { Vector2 } from '../shared/vector';
import type { InputState } from './input';
import type { Scene } from './Sequence';

const PLAYER_SIZE = 24;
const TOY_SIZE = 16;
const INTERACTION_RADIUS = 48;

const MEMORY_TEXT = [
  '붉은 하늘.',
  '투명한 벽 너머로 떠 있는 두 개의 달.',
  '어린 자신이 장난감을 굴리며 누군가를 기다리던 모습.',
];

export class ToyInteractionScene implements Scene {
  private playerPosition: Vector2 = { x: 400, y: 300 };
  private readonly toyPosition: Vector2 = { x: 640, y: 200 };
  private memoryTriggered = false;
  private readyToAdvance = false;

  isComplete(): boolean {
    return this.readyToAdvance;
  }

  update(input: InputState, deltaSeconds: number, bounds: Bounds): void {
    this.playerPosition = step(this.playerPosition, input.direction, bounds, deltaSeconds);

    if (!input.wasConfirmJustPressed()) return;

    if (!this.memoryTriggered) {
      if (this.isPlayerNearToy) {
        this.memoryTriggered = true;
      }
      return;
    }

    this.readyToAdvance = true;
  }

  private get isPlayerNearToy(): boolean {
    return isWithinRange(this.playerPosition, this.toyPosition, INTERACTION_RADIUS);
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = '#030712';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#111827';
    context.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    context.fillStyle = '#F9FAFB';
    context.fillRect(
      this.toyPosition.x - TOY_SIZE / 2,
      this.toyPosition.y - TOY_SIZE / 2,
      TOY_SIZE,
      TOY_SIZE,
    );

    context.fillStyle = '#C7D2FE';
    context.fillRect(
      this.playerPosition.x - PLAYER_SIZE / 2,
      this.playerPosition.y - PLAYER_SIZE / 2,
      PLAYER_SIZE,
      PLAYER_SIZE,
    );

    if (this.isPlayerNearToy && !this.memoryTriggered) {
      this.drawPrompt(context, 'Z : 장난감 조사하기');
    }

    if (this.memoryTriggered && !this.readyToAdvance) {
      this.drawMemoryOverlay(context, canvas);
    }
  }

  private drawPrompt(context: CanvasRenderingContext2D, text: string): void {
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#F9FAFB';
    context.textAlign = 'center';
    context.fillText(text, this.toyPosition.x, this.toyPosition.y - 20);
  }

  private drawMemoryOverlay(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = 'rgb(3 7 18 / 85%)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#F9FAFB';
    context.textAlign = 'center';

    MEMORY_TEXT.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, canvas.height / 2 - 30 + index * 32);
    });

    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#C7D2FE';
    context.fillText('Z ▶ 계속', canvas.width / 2, canvas.height / 2 + 60);
  }
}
