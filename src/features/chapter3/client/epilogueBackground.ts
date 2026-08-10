import type { EpiloguePhase } from '../shared/epilogueLogic';

export function selectEpilogueBackground<T>(
  phase: EpiloguePhase,
  quartersImage: T,
): T | null {
  return phase === 'silence' || phase === 'corridor' ? quartersImage : null;
}
