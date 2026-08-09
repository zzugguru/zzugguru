const PHOTO_WIDTH = 220;
const PHOTO_HEIGHT = 340; // 대화 텍스트박스(상단 y=396)와 겹치도록 충분히 길게
const PHOTO_Y = 90;

/** 화면 위쪽 중앙에 가족사진 프레임을 그린다(placeholder — 실제 이미지 없이 흰 사각형+테두리). */
export function renderPhotoFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const x = (canvas.width - PHOTO_WIDTH) / 2;

  context.fillStyle = '#F9FAFB';
  context.fillRect(x, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT);

  context.strokeStyle = '#374151';
  context.lineWidth = 4;
  context.strokeRect(x, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT);
}
