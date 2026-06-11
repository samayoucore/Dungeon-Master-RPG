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
    2: 'Всплеск действий: одно дополнительное действие в ход (1/отдых)',
    5: 'Дополнительная атака: при действии «Атака» бьёшь дважды',
  },
  rogue: {
    2: 'Хитрое действие: рывок, отход или скрытность бонусным действием',
    5: 'Невероятное уклонение: реакцией снижаешь урон атаки вдвое',
  },
  wizard: {
    2: 'Магическая традиция: ты выбрал свою школу магии',
    5: 'Открыты заклинания 3-го уровня',
  },
  cleric: {
    2: 'Божественный канал: призыв божественной силы (1/отдых)',
    5: 'Уничтожение нежити: нежить с ПО 1/2 и ниже уничтожается',
  },
  ranger: {
    2: 'Боевой стиль: выбери боевую специализацию',
    5: 'Дополнительная атака: при действии «Атака» бьёшь дважды',
  },
  bard: {
    2: 'Мастер на все руки: половина владения к непрофильным проверкам',
    5: 'Источник вдохновения: вдохновение восстанавливается на отдыхе',
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
