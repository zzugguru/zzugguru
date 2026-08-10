import { isMapComplete, isPlayerNearObject, type MapObject } from '../shared/mapObject';
import { step, type Bounds } from '../shared/movement';
import { moveMapPlayer } from '../shared/mapMovement';
import type { Vector2 } from '../shared/vector';
import type { InputState } from './input';
import type { Scene } from './Sequence';
import { drawInteractionObject, type ObjectVisual } from './interactionObjectSprite';

export interface MapObjectDefinition extends MapObject {
  label: string;
  /** 맵에 상시 표시할 짧은 오브젝트 이름. `label`은 근접 행동 프롬프트에만 사용한다. */
  visualLabel?: string;
  /** 상호작용 시 잠깐 보여줄 텍스트. 없으면 조용히 완료 처리만 된다. */
  message?: string;
  onInteract?: () => void;
  /** 이 목록의 오브젝트 중 "하나 이상"과 먼저 상호작용해야 이 오브젝트가 활성화된다. */
  unlockedBy?: string[];
  visual?: ObjectVisual;
  /** 배경 이미지에 이미 포함된 오브젝트는 에셋과 fallback 마커를 다시 그리지 않는다. */
  renderMarker?: boolean;
}

const OBJECT_SIZE = 16;
import { createLoadedImage, type MapVisual } from './mapVisuals';
import { drawPlayer, facingFromDirection, PLAYER_COLLISION_SIZE, type Facing } from './playerSprite';

const playerSpriteUrl = new URL('../../../assets/yeongsu-alien-suit-sprites.png', import.meta.url).href;
const interactionObjectUrl = new URL('../assets/interaction-objects.png', import.meta.url).href;

export function objectLabelPosition(object: MapObjectDefinition): Vector2 {
  const position = object.visual?.position ?? object.position;
  const objectHeight = object.visual?.height ?? OBJECT_SIZE;
  return { x: position.x, y: position.y + objectHeight / 2 + 16 };
}

export function objectPromptPosition(object: MapObjectDefinition): Vector2 {
  const label = objectLabelPosition(object);
  return { x: label.x, y: label.y + 24 };
}

export function shouldRenderObjectMarker(object: MapObjectDefinition): boolean {
  return object.renderMarker !== false;
}

/**
 * 오브젝트 배열로 정의된 맵을 재생하는 범용 씬. 필수(required) 오브젝트를 "전부" 상호작용해야 완료된다.
 *
 * 주의: 이 완료 규칙은 "여러 필수 오브젝트 중 정확히 하나만 골라야 하는" 진짜 분기(예: 상호배타적 선택지)엔
 * 그대로 맞지 않는다 — 지금은 아무것도 막지 않으므로 플레이어가 여러 선택지 오브젝트를 순서대로 전부
 * 상호작용할 수 있다. `getInteractedIds()`로 "무엇과 상호작용했는지"는 조회 가능하지만, "그중 하나만
 * 유효해야 한다"는 배타성은 아직 없다. 실제 분기를 만들 때는 배타성/그룹 개념을 추가로 설계해야 한다.
 *
 * `unlockedBy`가 설정된 오브젝트는 목록에 나열된 오브젝트 중 하나 이상과 먼저 상호작용하기 전까지
 * `findInteractable()`에서 아예 제외된다 — 범위 안에 있어도 프롬프트가 안 뜨고 상호작용도 안 된다.
 */
export class MapScene implements Scene {
  private playerPosition: Vector2;
  private readonly interactedIds = new Set<string>();
  private activeMessage: string | null = null;
  private facing: Facing = 'down';
  private readonly backgroundImage: HTMLImageElement | null;
  private readonly playerImage = createLoadedImage(playerSpriteUrl);
  private readonly objectImage = createLoadedImage(interactionObjectUrl);

  constructor(
    private readonly objects: MapObjectDefinition[],
    playerStart: Vector2,
    private readonly visual?: MapVisual,
  ) {
    this.playerPosition = playerStart;
    this.backgroundImage = visual ? createLoadedImage(visual.backgroundUrl) : null;
  }

  /** 어떤 오브젝트와 상호작용했는지 조회 — 다음 단계가 결과에 따라 갈라져야 할 때 사용. */
  getInteractedIds(): ReadonlySet<string> {
    return this.interactedIds;
  }

  isComplete(): boolean {
    return this.activeMessage === null && isMapComplete(this.objects, this.interactedIds);
  }

  update(input: InputState, deltaSeconds: number, bounds: Bounds): void {
    if (this.activeMessage !== null) {
      if (input.wasConfirmJustPressed()) {
        this.activeMessage = null;
      }
      return;
    }

    this.facing = facingFromDirection(input.direction, this.facing);
    this.playerPosition = this.visual
      ? moveMapPlayer(
          this.playerPosition,
          input.direction,
          deltaSeconds,
          this.visual.floor,
          this.visual.collisions,
        )
      : step(this.playerPosition, input.direction, bounds, deltaSeconds);

    if (!input.wasConfirmJustPressed()) return;

    const target = this.findInteractable();
    if (!target) return;

    this.interactedIds.add(target.id);
    target.onInteract?.();
    if (target.message) {
      this.activeMessage = target.message;
    }
  }

  render(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.drawBackground(context, canvas)) {
      context.fillStyle = '#030712';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#111827';
      context.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
    }

    for (const object of this.objects) {
      this.renderObject(context, object);
      this.renderObjectLabel(context, object);
    }

    if (!drawPlayer(context, this.playerImage, this.playerPosition, this.facing)) {
      context.fillStyle = '#C7D2FE';
      context.fillRect(
        this.playerPosition.x - PLAYER_COLLISION_SIZE / 2,
        this.playerPosition.y - PLAYER_COLLISION_SIZE / 2,
        PLAYER_COLLISION_SIZE,
        PLAYER_COLLISION_SIZE,
      );
    }

    if (this.activeMessage !== null) {
      this.renderMessageOverlay(context, canvas, this.activeMessage);
      return;
    }

    const promptTarget = this.findInteractable();
    if (promptTarget) {
      const promptPosition = objectPromptPosition(promptTarget);
      context.font = '16px Inter, Pretendard, system-ui, sans-serif';
      context.fillStyle = '#F9FAFB';
      context.textAlign = 'center';
      context.fillText(
        `Z : ${promptTarget.label}`,
        promptPosition.x,
        promptPosition.y,
      );
    }
  }

  private drawBackground(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean {
    if (!this.backgroundImage?.complete || this.backgroundImage.naturalWidth === 0) return false;
    context.imageSmoothingEnabled = false;
    context.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
    return true;
  }

  private findInteractable(): MapObjectDefinition | undefined {
    return this.objects.find(
      (object) =>
        !this.interactedIds.has(object.id) &&
        this.isUnlocked(object) &&
        isPlayerNearObject(this.playerPosition, object),
    );
  }

  private isUnlocked(object: MapObjectDefinition): boolean {
    if (!object.unlockedBy || object.unlockedBy.length === 0) return true;
    return object.unlockedBy.some((id) => this.interactedIds.has(id));
  }

  private renderObject(context: CanvasRenderingContext2D, object: MapObjectDefinition): void {
    if (!shouldRenderObjectMarker(object)) return;
    if (object.visual && drawInteractionObject(context, this.objectImage, object.visual, this.interactedIds.has(object.id))) return;
    context.fillStyle = this.interactedIds.has(object.id) ? '#374151' : '#F9FAFB';
    context.fillRect(
      object.position.x - OBJECT_SIZE / 2,
      object.position.y - OBJECT_SIZE / 2,
      OBJECT_SIZE,
      OBJECT_SIZE,
    );
  }

  private renderObjectLabel(context: CanvasRenderingContext2D, object: MapObjectDefinition): void {
    const position = objectLabelPosition(object);
    const completed = this.interactedIds.has(object.id);
    context.fillStyle = '#C7D2FE';
    context.font = '12px Inter, Pretendard, system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText(
      completed ? `${object.visualLabel ?? object.label} · 완료` : (object.visualLabel ?? object.label),
      position.x,
      position.y,
    );
  }

  private renderMessageOverlay(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    message: string,
  ): void {
    context.fillStyle = 'rgb(3 7 18 / 85%)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.textAlign = 'center';
    context.fillStyle = '#F9FAFB';
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    context.fillStyle = '#C7D2FE';
    context.font = '16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText('Z ▶ 계속', canvas.width / 2, canvas.height / 2 + 40);
  }
}
