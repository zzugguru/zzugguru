import type { FamilyId } from '../shared/gameLogic';

export const FAMILY_NPC_FRAME_WIDTH = 64;
export const FAMILY_NPC_FRAME_HEIGHT = 80;
export const FAMILY_NPC_VISIBLE_BOTTOM = 76;

export type FamilyNpcAnchor = Readonly<{
  centerX: number;
  feetY: number;
}>;

const FAMILY_NPC_ASSET_PATHS: Readonly<Record<FamilyId, string>> = {
  wife: new URL('../assets/family-wife.png', import.meta.url).href,
  son: new URL('../assets/family-son.png', import.meta.url).href,
  daughter: new URL('../assets/family-daughter.png', import.meta.url).href,
};

export function familyNpcAssetPath(id: FamilyId): string {
  return FAMILY_NPC_ASSET_PATHS[id];
}

export function familyNpcDestination(anchor: FamilyNpcAnchor): Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  return {
    x: Math.round(anchor.centerX - FAMILY_NPC_FRAME_WIDTH / 2),
    y: Math.round(anchor.feetY - FAMILY_NPC_VISIBLE_BOTTOM),
    width: FAMILY_NPC_FRAME_WIDTH,
    height: FAMILY_NPC_FRAME_HEIGHT,
  };
}

export function drawFamilyNpcSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  anchor: FamilyNpcAnchor,
): boolean {
  if (!image.complete
    || image.naturalWidth !== FAMILY_NPC_FRAME_WIDTH
    || image.naturalHeight !== FAMILY_NPC_FRAME_HEIGHT) return false;

  const destination = familyNpcDestination(anchor);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, destination.x, destination.y, destination.width, destination.height);
  return true;
}
