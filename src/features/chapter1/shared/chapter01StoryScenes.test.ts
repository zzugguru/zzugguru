import { describe, expect, it } from 'vitest';
import { CHAPTER01_STORY } from './chapter01Story';
import {
  CHAPTER01_EXCLUDED_SCENE_PAGES,
  chapter01StorySceneFor,
} from './chapter01StoryScenes';

describe('chapter01StoryScenes', () => {
  it('keeps the 13 requested pages unchanged and maps all other 36 pages', () => {
    const scenes = CHAPTER01_STORY.map((beat, index) => chapter01StorySceneFor(index, beat.backdrop));
    expect(scenes.filter(Boolean)).toHaveLength(36);
    expect(scenes.flatMap((scene, index) => scene ? [] : [index + 1])).toEqual(CHAPTER01_EXCLUDED_SCENE_PAGES);
  });

  it('shares coherent location plates while giving every eligible page a distinct treatment', () => {
    const scenes = CHAPTER01_STORY.map((beat, index) => chapter01StorySceneFor(index, beat.backdrop)).filter((scene) => scene !== null);
    const treatmentTuples = scenes.map(({ plate, tintAlpha, scanlineAlpha, focusX, focusY, signalTearY, silhouette }) =>
      JSON.stringify([plate, tintAlpha, scanlineAlpha, focusX, focusY, signalTearY, silhouette]));
    expect(new Set(treatmentTuples).size).toBe(36);
    expect(treatmentTuples.every((tuple, index) => index === 0 || tuple !== treatmentTuples[index - 1])).toBe(true);
    expect(scenes.find(({ page }) => page === 39)?.plate).toBe('guard-room-haunting');
    expect(scenes.filter(({ page }) => page >= 40 && page <= 42).map(({ plate }) => plate)).toEqual([
      'whiteout-apparition',
      'whiteout-apparition',
      'whiteout-apparition',
    ]);
    expect(scenes.at(-1)).toMatchObject({ page: 42, plate: 'whiteout-apparition' });
  });
});
