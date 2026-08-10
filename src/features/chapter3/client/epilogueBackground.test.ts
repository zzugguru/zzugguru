import { describe, expect, it } from 'vitest';
import { selectEpilogueBackground } from './epilogueBackground';

describe('Chapter03 epilogue background', () => {
  it('selects the quarters and archive backgrounds for their playable phases', () => {
    const quarters = { id: 'quarters' } as CanvasImageSource;
    const archive = { id: 'archive' } as CanvasImageSource;

    expect(selectEpilogueBackground('silence', quarters, archive)).toBe(quarters);
    expect(selectEpilogueBackground('corridor', quarters, archive)).toBe(quarters);
    expect(selectEpilogueBackground('archive', quarters, archive)).toBe(archive);
    expect(selectEpilogueBackground('archive-complete', quarters, archive)).toBe(archive);
    expect(selectEpilogueBackground('montage', quarters, archive)).toBeNull();
  });
});
