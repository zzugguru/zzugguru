import { describe, expect, it } from 'vitest';
import {
  advanceRescueDialogue, completeRescue, createRescue, nearbyRescueTarget,
  rescueAvailable, RESCUE_TARGETS, startRescueDialogue,
} from './rescueLogic';

describe('alien family rescue subsequence', () => {
  it('is unavailable until the blackout cutscene has been seen', () => {
    expect(rescueAvailable(false, createRescue())).toBe(false);
    expect(rescueAvailable(true, createRescue())).toBe(true);
  });

  it('becomes unavailable once all three family members are rescued', () => {
    let rescue = createRescue();
    for (const target of RESCUE_TARGETS) rescue = completeRescue(rescue, target.id);
    expect(rescue.completed).toBe(true);
    expect(rescueAvailable(true, rescue)).toBe(false);
  });

  it('finds only the nearest unrescued target within range', () => {
    const father = RESCUE_TARGETS.find((t) => t.id === 'father')!;
    let rescue = createRescue();
    expect(nearbyRescueTarget({ x: father.x - 13, y: father.y - 13 }, rescue)?.id).toBe('father');
    rescue = completeRescue(rescue, 'father');
    expect(nearbyRescueTarget({ x: father.x - 13, y: father.y - 13 }, rescue)).toBeNull();
  });

  it('rejects targets outside interaction range', () => {
    expect(nearbyRescueTarget({ x: 0, y: 0 }, createRescue())).toBeNull();
  });

  it('advances through each target line before becoming seen, in any order across targets', () => {
    const mother = RESCUE_TARGETS.find((t) => t.id === 'mother')!;
    let dialogue = startRescueDialogue(mother);
    expect(dialogue.seen).toBe(false);
    for (let i = 1; i < mother.lines.length; i += 1) {
      dialogue = advanceRescueDialogue(dialogue, mother);
      expect(dialogue.seen).toBe(false);
      expect(dialogue.step).toBe(i);
    }
    dialogue = advanceRescueDialogue(dialogue, mother);
    expect(dialogue.seen).toBe(true);
  });

  it('ignores further advances once a dialogue is seen', () => {
    const sister = RESCUE_TARGETS.find((t) => t.id === 'sister')!;
    let dialogue = startRescueDialogue(sister);
    for (let i = 0; i < sister.lines.length; i += 1) dialogue = advanceRescueDialogue(dialogue, sister);
    const seen = dialogue;
    expect(advanceRescueDialogue(seen, sister)).toBe(seen);
  });

  it('marks completed only after all three distinct targets are rescued, ignoring duplicates', () => {
    let rescue = createRescue();
    rescue = completeRescue(rescue, 'father');
    rescue = completeRescue(rescue, 'father');
    expect(rescue.rescued).toEqual(['father']);
    rescue = completeRescue(rescue, 'mother');
    expect(rescue.completed).toBe(false);
    rescue = completeRescue(rescue, 'sister');
    expect(rescue.completed).toBe(true);
    expect(rescue.rescued).toEqual(['father', 'mother', 'sister']);
  });
});
