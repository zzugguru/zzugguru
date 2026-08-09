import { describe, expect, it } from 'vitest';
import { advanceDialogue } from './dialogue';

describe('advanceDialogue', () => {
  it('moves to the next line when not on the last line', () => {
    expect(advanceDialogue(0, 3)).toEqual({ index: 1, finished: false });
  });

  it('finishes when advancing while already on the last line', () => {
    expect(advanceDialogue(2, 3)).toEqual({ index: 2, finished: true });
  });

  it('finishes immediately for a single-line dialogue', () => {
    expect(advanceDialogue(0, 1)).toEqual({ index: 0, finished: true });
  });

  it('treats an empty dialogue as already finished', () => {
    expect(advanceDialogue(0, 0)).toEqual({ index: 0, finished: true });
  });
});
