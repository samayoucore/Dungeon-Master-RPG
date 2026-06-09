// ============================================================================
// Character progression: XP thresholds, level-up math and class features.
// Pure functions (no React, no store).
// ============================================================================

import type { Character, CharacterClass } from '../../types';
import { roll } from '../combat/dice';

export const MAX_LEVEL = 10;

/** Cumulative XP required to REACH each level (D&D 5e). */
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
};

const HIT_DICE: Record<CharacterClass, string> = {
  fighter: '1d10',
  ranger: '1d10',
  rogue: '1d8',
  cleric: '1d8',
  bard: '1d8',
  wizard: '1d6',
};

const FEATURES: Record<CharacterClass, Record<number, string>> = {
  fighter: {
    2: 'Action Surge: Take one additional action on your turn (1/rest)',
    5: 'Extra Attack: Attack twice when you take the Attack action',
  },
  rogue: {
    2: 'Cunning Action: Dash, Disengage or Hide as a bonus action',
    5: "Uncanny Dodge: Use your reaction to halve an attack's damage",
  },
  wizard: {
    2: 'Arcane Tradition: You have chosen your school of magic',
    5: '3rd-level spells unlocked',
  },
  cleric: {
    2: 'Channel Divinity: Invoke divine power (1/rest)',
    5: 'Destroy Undead: Undead of CR 1/2 or lower are destroyed',
  },
  ranger: {
    2: 'Fighting Style: Choose a combat specialty',
    5: 'Extra Attack: Attack twice when you take the Attack action',
  },
  bard: {
    2: 'Jack of All Trades: Add half proficiency to non-proficient checks',
    5: 'Font of Inspiration: Regain Bardic Inspiration on a short rest',
  },
};

export interface LevelUpResult {
  newCharacter: Character;
  newLevel: number;
  hpGained: number;
  newFeatures: string[];
}

export function hitDie(characterClass: CharacterClass): string {
  return HIT_DICE[characterClass];
}

export function rollHitDie(characterClass: CharacterClass): number {
  return roll(hitDie(characterClass));
}

/** Proficiency bonus by level (2 / 3 at 5+ / 4 at 9+). */
export function proficiencyForLevel(level: number): number {
  return level >= 9 ? 4 : level >= 5 ? 3 : 2;
}

/** XP needed for the next level (max-level keeps the level-10 threshold). */
export function xpToNextFor(level: number): number {
  return XP_THRESHOLDS[level + 1] ?? XP_THRESHOLDS[MAX_LEVEL];
}

/** New class features unlocked at the given level (may be empty). */
export function classFeatures(characterClass: CharacterClass, level: number): string[] {
  const feature = FEATURES[characterClass][level];
  return feature ? [feature] : [];
}

export function checkLevelUp(character: Character): boolean {
  return character.level < MAX_LEVEL && character.xp >= XP_THRESHOLDS[character.level + 1];
}

/** Produce a leveled-up copy of the character plus a summary of the gains. */
export function levelUp(character: Character): LevelUpResult {
  const newLevel = character.level + 1;
  const hpGained = Math.max(1, rollHitDie(character.class) + character.modifiers.con);
  return {
    newCharacter: {
      ...character,
      level: newLevel,
      maxHp: character.maxHp + hpGained,
      hp: character.hp + hpGained,
      xpToNext: xpToNextFor(newLevel),
      proficiencyBonus: proficiencyForLevel(newLevel),
    },
    newLevel,
    hpGained,
    newFeatures: classFeatures(character.class, newLevel),
  };
}
