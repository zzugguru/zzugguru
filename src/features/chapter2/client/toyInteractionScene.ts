import { isWithinRange } from '../shared/proximity';
import type { Bounds } from '../shared/movement';
import { moveMapPlayer } from '../shared/mapMovement';
import type { Vector2 } from '../shared/vector';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { ALIEN_CHILDHOOD_ROOM, createLoadedImage } from './mapVisuals';
import { drawPlayer, facingFromDirection, PLAYER_COLLISION_SIZE, type Facing } from './playerSprite';
import { drawInteractionObject } from './interactionObjectSprite';

const playerSpriteUrl = new URL('../../../assets/yeongsu-alien-suit-sprites.png', import.meta.url).href;
const interactionObjectUrl = new URL('../assets/interaction-objects.png', import.meta.url).href;

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
  private facing: Facing = 'down';
  private readonly backgroundImage = createLoadedImage(ALIEN_CHILDHOOD_ROOM.backgroundUrl);
  private readonly playerImage = createLoadedImage(playerSpriteUrl);
  private readonly objectImage = createLoadedImage(interactionObjectUrl);

  isComplete(): boolean {
    return this.readyToAdvance;
  }

  update(input: InputState, deltaSeconds: number, _bounds: Bounds): void {
    this.facing = facingFromDirection(input.direction, this.facing);
    this.playerPosition = moveMapPlayer(
      this.playerPosition,
      input.direction,
      deltaSeconds,
      ALIEN_CHILDHOOD_ROOM.floor,
      ALIEN_CHILDHOOD_ROOM.collisions,
    );

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
    if (!this.drawBackground(context, canvas)) {
      context.fillStyle = '#030712';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#111827';
      context.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
    }

    if (!drawInteractionObject(context, this.objectImage, {
      asset: 'toy', position: this.toyPosition, width: 48, height: 42,
    }, this.memoryTriggered)) {
      context.fillStyle = '#F9FAFB';
      context.fillRect(
        this.toyPosition.x - TOY_SIZE / 2,
        this.toyPosition.y - TOY_SIZE / 2,
        TOY_SIZE,
        TOY_SIZE,
      );
    }

    context.font = '12px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#C7D2FE';
    context.textAlign = 'center';
    context.fillText(
      this.memoryTriggered ? '어린 시절 장난감 · 완료' : '어린 시절 장난감',
      this.toyPosition.x,
      this.toyPosition.y + 37,
    );

    if (!drawPlayer(context, this.playerImage, this.playerPosition, this.facing)) {
      context.fillStyle = '#C7D2FE';
      context.fillRect(
        this.playerPosition.x - PLAYER_COLLISION_SIZE / 2,
        this.playerPosition.y - PLAYER_COLLISION_SIZE / 2,
        PLAYER_COLLISION_SIZE,
        PLAYER_COLLISION_SIZE,
      );
    }

    if (this.isPlayerNearToy && !this.memoryTriggered) {
      this.drawPrompt(context, 'Z : 장난감 조사하기');
    }

    if (this.memoryTriggered && !this.readyToAdvance) {
      this.drawMemoryOverlay(context, canvas);
    }
  }

  private drawBackground(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean {
    if (!this.backgroundImage?.complete || this.backgroundImage.naturalWidth === 0) return false;
    context.imageSmoothingEnabled = false;
    context.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
    return true;
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

    context.font = '12px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#C7D2FE';
    context.fillText('어린 시절 장난감 · 완료', canvas.width / 2, 190);

    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#F9FAFB';
    MEMORY_TEXT.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, canvas.height / 2 - 30 + index * 32);
    });

    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillStyle = '#C7D2FE';
    context.fillText('Z ▶ 계속', canvas.width / 2, canvas.height / 2 + 60);
  }
}
