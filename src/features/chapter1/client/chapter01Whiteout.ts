export interface Chapter01WhiteoutPresentation {
  phase: number;
  character: { x: number; y: number; opacity: number } | null;
  glitchIntensity: number;
  scanlineOffset: number;
  tearOffset: number;
}

/** 41·42번 화면은 같은 시간축의 정지 노이즈를 공유하고 강도만 이어서 높인다. */
export function getChapter01WhiteoutPresentation(
  storyIndex: number,
  animationSeconds: number,
): Chapter01WhiteoutPresentation {
  const phase = Math.max(0, storyIndex - 39);
  if (phase === 0) {
    return {
      phase,
      character: null,
      glitchIntensity: 0,
      scanlineOffset: 0,
      tearOffset: 0,
    };
  }

  const glitchIntensity = phase === 1 ? 0.34 : 0.52;
  return {
    phase,
    character: { x: 480, y: 212, opacity: phase === 1 ? 0.62 : 0.38 },
    glitchIntensity,
    scanlineOffset: Math.floor(animationSeconds * 36) % 6,
    tearOffset: Math.round(Math.sin(animationSeconds * 23) * 18 * glitchIntensity),
  };
}
