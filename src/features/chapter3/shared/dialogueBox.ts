export interface DialogueLine {
  speaker: string;
  text: string;
}

const BOX_HEIGHT = 120;
const BOX_MARGIN = 24;
const BOX_RADIUS = 8;
const BOX_PADDING = 20;

/** Chapter02의 하단 고정 대화창(`chapter2/shared/dialogueBox.ts`)과 동일한 형식으로 대사를 그린다. */
export function renderDialogueBox(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  line: DialogueLine,
  hint: string,
): void {
  const boxY = canvas.height - BOX_HEIGHT - BOX_MARGIN;
  const boxWidth = canvas.width - BOX_MARGIN * 2;

  context.fillStyle = '#111827';
  context.beginPath();
  context.roundRect(BOX_MARGIN, boxY, boxWidth, BOX_HEIGHT, BOX_RADIUS);
  context.fill();

  context.textAlign = 'left';
  context.fillStyle = '#F9FAFB';

  if (line.speaker) {
    context.font = 'bold 16px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(line.speaker, BOX_MARGIN + BOX_PADDING, boxY + 34);
    context.font = '20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(line.text, BOX_MARGIN + BOX_PADDING, boxY + 70);
  } else {
    context.font = 'italic 20px Inter, Pretendard, system-ui, sans-serif';
    context.fillText(line.text, BOX_MARGIN + BOX_PADDING, boxY + 55);
  }

  context.textAlign = 'right';
  context.fillStyle = '#C7D2FE';
  context.font = '16px Inter, Pretendard, system-ui, sans-serif';
  context.fillText(hint, canvas.width - BOX_MARGIN - BOX_PADDING, boxY + BOX_HEIGHT - 16);
}
