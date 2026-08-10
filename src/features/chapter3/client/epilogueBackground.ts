import type { EpiloguePhase } from '../shared/epilogueLogic';

export function selectEpilogueBackground<T>(
  phase: EpiloguePhase,
  quartersImage: T,
  archiveImage: T,
): T | null {
  if (phase === 'silence' || phase === 'corridor') return quartersImage;
  if (phase === 'archive' || phase === 'archive-complete') return archiveImage;
  return null;
}
