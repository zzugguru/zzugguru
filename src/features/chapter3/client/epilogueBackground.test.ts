import { describe, expect, it } from 'vitest';
import { selectEpilogueBackground } from './epilogueBackground';

describe('Chapter03 epilogue background', () => {
  it('uses Yeongsu quarters for the silent wake-up and sister dialogue phases only', () => {
    const image = {} as CanvasImageSource;

    expect(selectEpilogueBackground('silence', image)).toBe(image);
    expect(selectEpilogueBackground('corridor', image)).toBe(image);
    expect(selectEpilogueBackground('archive', image)).toBeNull();
    expect(selectEpilogueBackground('montage', image)).toBeNull();
  });
});
