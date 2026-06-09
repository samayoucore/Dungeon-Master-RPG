import type { ItemRarity } from '../../types';

/** Text colour per item rarity. */
export const RARITY_TEXT: Record<ItemRarity, string> = {
  common: 'text-parchment',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  'very-rare': 'text-magic',
  legendary: 'text-gold',
};

/** Background colour for the small rarity dot. */
export const RARITY_DOT: Record<ItemRarity, string> = {
  common: 'bg-muted',
  uncommon: 'bg-green-400',
  rare: 'bg-blue-400',
  'very-rare': 'bg-magic',
  legendary: 'bg-gold',
};
