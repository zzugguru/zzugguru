import type { FamilyId, MemoryGameState } from '../shared/gameLogic';
import { MEMORY_CLUES, REQUIRED_BY_FAMILY } from '../shared/gameLogic';

export const BIO_VESSEL_WIDTH = 160;
export const BIO_VESSEL_HEIGHT = 184;

export type BioVesselState = 'idle' | 'active' | 'unstable' | 'connected' | 'open';
export type BioVesselRect = Readonly<{ x: number; y: number; width: number; height: number }>;

const BIO_VESSEL_ASSET_PATHS: Readonly<Record<FamilyId, string>> = {
  wife: new URL('../assets/bio-vessel-wife.png', import.meta.url).href,
  son: new URL('../assets/bio-vessel-son.png', import.meta.url).href,
  daughter: new URL('../assets/bio-vessel-daughter.png', import.meta.url).href,
};

export function bioVesselAssetPath(id: FamilyId): string {
  return BIO_VESSEL_ASSET_PATHS[id];
}

export function bioVesselDestination(rect: BioVesselRect): Readonly<{
  x: number; y: number; width: number; height: number;
}> {
  return {
    x: Math.round(rect.x + 62),
    y: Math.round(rect.y + (rect.height - BIO_VESSEL_HEIGHT) / 2),
    width: BIO_VESSEL_WIDTH,
    height: BIO_VESSEL_HEIGHT,
  };
}

export function bioVesselInfoPanel(rect: BioVesselRect): BioVesselRect {
  return { x: rect.x + 8, y: rect.y + 24, width: 88, height: rect.height - 48 };
}

export function puzzleVesselState(state: MemoryGameState, family: FamilyId): BioVesselState {
  if (state.completed[family] >= REQUIRED_BY_FAMILY[family]) return 'connected';
  if (state.feedback.includes('일치하지') && state.stability < 3) return 'unstable';
  return MEMORY_CLUES[state.clueIndex]?.family === family ? 'active' : 'idle';
}

export function vesselStateLabel(state: BioVesselState): string {
  if (state === 'active') return '기억 신호 수신 중';
  if (state === 'unstable') return '연결 불안정';
  if (state === 'connected') return '기억 연결 완료';
  if (state === 'open') return '용기 개방 · 생체 신호 확인';
  return '생체 신호 대기 중';
}

export function drawBioVesselSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: BioVesselRect,
  state: BioVesselState,
  nowMs: number,
): boolean {
  if (!image.complete || image.naturalWidth !== BIO_VESSEL_WIDTH || image.naturalHeight !== BIO_VESSEL_HEIGHT) return false;

  const destination = bioVesselDestination(rect);
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(image, destination.x, destination.y, destination.width, destination.height);

  const pulse = 0.55 + Math.sin(nowMs / 180) * 0.2;
  context.globalAlpha = state === 'idle' ? 0.45 : state === 'unstable' ? 0.9 : pulse;
  context.strokeStyle = state === 'unstable' ? '#fb7185' : state === 'idle' ? '#374151' : '#818cf8';
  context.lineWidth = state === 'open' ? 4 : 2;
  context.strokeRect(destination.x + 35, destination.y + 43, destination.width - 70, destination.height - 79);

  if (state === 'unstable') {
    context.fillStyle = '#fb7185';
    for (let offset = 0; offset < 3; offset += 1) {
      const y = destination.y + 58 + offset * 34 + Math.round(Math.sin(nowMs / 90 + offset) * 3);
      context.fillRect(destination.x + 40, y, destination.width - 80, 2);
    }
  } else if (state === 'open') {
    context.fillStyle = '#818cf8';
    context.fillRect(destination.x + destination.width / 2 - 2, destination.y + 46, 4, destination.height - 84);
  }
  context.restore();
  return true;
}

export function drawBioVesselPanel(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rect: BioVesselRect,
  state: BioVesselState,
  nowMs: number,
  label: Readonly<{ name: string; progress?: string }>,
): boolean {
  context.fillStyle = state === 'connected' || state === 'open' ? '#312e81' : '#111827';
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.strokeStyle = state === 'unstable' ? '#fb7185' : state === 'idle' ? '#374151' : '#818cf8';
  context.lineWidth = state === 'active' || state === 'open' ? 3 : 1;
  context.strokeRect(rect.x, rect.y, rect.width, rect.height);
  const drewImage = drawBioVesselSprite(context, image, rect, state, nowMs);

  const info = bioVesselInfoPanel(rect);
  context.fillStyle = 'rgba(3,7,18,.86)'; context.fillRect(info.x, info.y, info.width, info.height);
  context.textAlign = 'center'; context.fillStyle = '#f9fafb'; context.font = '700 15px system-ui';
  context.fillText(label.name, info.x + info.width / 2, info.y + 30);
  context.fillStyle = state === 'unstable' ? '#fb7185' : '#c7d2fe'; context.font = '11px system-ui';
  context.fillText(vesselStateLabel(state), info.x + info.width / 2, info.y + 69, info.width - 10);
  if (label.progress) context.fillText(label.progress, info.x + info.width / 2, info.y + 94, info.width - 10);
  return drewImage;
}
