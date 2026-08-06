/** 프로젝트의 첫 실행 상태를 그리는 예제 기능입니다. */
export function renderWelcome(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): void {
  const { width, height } = canvas;
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#111827');
  gradient.addColorStop(1, '#312e81');

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#f9fafb';
  context.font = 'bold 38px system-ui';
  context.textAlign = 'center';
  context.fillText('ZZUGGURU', width / 2, height / 2 - 10);
  context.font = '20px system-ui';
  context.fillStyle = '#c7d2fe';
  context.fillText('첫 번째 게임 기능을 만들어 보세요!', width / 2, height / 2 + 35);
}
