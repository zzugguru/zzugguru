export interface DialogueAdvanceResult {
  index: number;
  finished: boolean;
}

export function advanceDialogue(index: number, lineCount: number): DialogueAdvanceResult {
  if (lineCount <= 0) {
    return { index: 0, finished: true };
  }
  if (index < lineCount - 1) {
    return { index: index + 1, finished: false };
  }
  return { index, finished: true };
}
