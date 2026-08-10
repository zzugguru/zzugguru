import type { RescueTarget, RescueTargetId } from '../shared/rescueLogic';

export const ALIEN_FAMILY_FRAME_WIDTH = 64;
export const ALIEN_FAMILY_FRAME_HEIGHT = 80;
export const ALIEN_FAMILY_VISIBLE_BOTTOM = 76;

export type AlienFamilyProfile = Readonly<{
  relation: 'father' | 'mother' | 'older-sister';
  humanEquivalentAge: 'late-50s' | 'late-40s';
  speciesTraits: string;
  attire: string;
}>;

export const ALIEN_FAMILY_PROFILES: Readonly<Record<RescueTargetId, AlienFamilyProfile>> = {
  father: { relation: 'father', humanEquivalentAge: 'late-50s', speciesTraits: 'cool blue-gray skin, large dark eyes, high cheekbones', attire: 'tailored navy jacket, gray high-collar shirt, charcoal trousers' },
  mother: { relation: 'mother', humanEquivalentAge: 'late-50s', speciesTraits: 'cool blue-gray skin, large dark eyes, high cheekbones', attire: 'structured indigo long jacket, charcoal blouse and trousers' },
  sister: { relation: 'older-sister', humanEquivalentAge: 'late-40s', speciesTraits: 'cool blue-gray skin, large dark eyes, high cheekbones', attire: 'cropped navy jacket, slate blouse, charcoal trousers' },
};

const ALIEN_FAMILY_ASSET_PATHS: Readonly<Record<RescueTargetId, string>> = {
  father: new URL('../assets/alien-family-father.png', import.meta.url).href,
  mother: new URL('../assets/alien-family-mother.png', import.meta.url).href,
  sister: new URL('../assets/alien-family-sister.png', import.meta.url).href,
};

export function alienFamilyAssetPath(id: RescueTargetId): string {
  return ALIEN_FAMILY_ASSET_PATHS[id];
}

export function alienFamilyDestination(target: RescueTarget): Readonly<{ x: number; y: number; width: number; height: number }> {
  return {
    x: Math.round(target.x - ALIEN_FAMILY_FRAME_WIDTH / 2),
    y: Math.round(target.y + 16 - ALIEN_FAMILY_VISIBLE_BOTTOM),
    width: ALIEN_FAMILY_FRAME_WIDTH,
    height: ALIEN_FAMILY_FRAME_HEIGHT,
  };
}

export function drawAlienFamilyNpc(context: CanvasRenderingContext2D, image: HTMLImageElement, target: RescueTarget): boolean {
  if (!image.complete || image.naturalWidth !== ALIEN_FAMILY_FRAME_WIDTH || image.naturalHeight !== ALIEN_FAMILY_FRAME_HEIGHT) return false;
  const destination = alienFamilyDestination(target);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, destination.x, destination.y, destination.width, destination.height);
  return true;
}
