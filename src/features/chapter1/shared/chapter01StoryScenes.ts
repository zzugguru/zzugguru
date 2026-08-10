import type { Chapter01Backdrop } from './chapter01Story';

export const CHAPTER01_EXCLUDED_SCENE_PAGES = [3, 11, 16, 31, 33, 34, 43, 44, 45, 46, 47, 48, 49] as const;

export type Chapter01StoryPlate =
  | 'current'
  | 'guard-room'
  | 'basement'
  | 'cctv-anomaly'
  | 'guard-room-haunting'
  | 'whiteout-apparition';

export interface Chapter01StoryScene {
  page: number;
  plate: Chapter01StoryPlate;
  tintAlpha: number;
  scanlineAlpha: number;
  focusX: number;
  focusY: number;
  signalTearY: number;
  silhouette: boolean;
}

const excludedPages = new Set<number>(CHAPTER01_EXCLUDED_SCENE_PAGES);

export function chapter01StorySceneFor(
  beatIndex: number,
  backdrop: Chapter01Backdrop,
): Chapter01StoryScene | null {
  const page = beatIndex + 1;
  if (excludedPages.has(page)) return null;

  return {
    page,
    plate: plateFor(page, backdrop),
    tintAlpha: 0.05 + (page % 5) * 0.018,
    scanlineAlpha: backdrop === 'cctv' || backdrop === 'epilogue' || backdrop === 'whiteout'
      ? 0.06 + (page % 4) * 0.025
      : 0.015 + (page % 3) * 0.012,
    focusX: 130 + ((page * 173) % 700),
    focusY: 88 + ((page * 79) % 210),
    signalTearY: 46 + ((page * 53) % 270),
    silhouette: (backdrop === 'cctv' || backdrop === 'epilogue') && page % 3 !== 0,
  };
}

function plateFor(page: number, backdrop: Chapter01Backdrop): Chapter01StoryPlate {
  if (page === 39) return 'guard-room-haunting';
  if (backdrop === 'whiteout') return 'whiteout-apparition';
  if (backdrop === 'cctv' || backdrop === 'epilogue') return 'cctv-anomaly';
  if (backdrop === 'basement') return 'basement';
  if (backdrop === 'guard-room' && page !== 2) return 'guard-room';
  return 'current';
}
