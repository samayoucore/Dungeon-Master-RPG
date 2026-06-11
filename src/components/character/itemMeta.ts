import type { ItemRarity, ItemType } from '../../types';

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

/** Russian rarity names. */
export const RARITY_RU: Record<ItemRarity, string> = {
  common: 'обычный',
  uncommon: 'необычный',
  rare: 'редкий',
  'very-rare': 'очень редкий',
  legendary: 'легендарный',
};

/** Russian item-type names. */
export const TYPE_RU: Record<ItemType, string> = {
  weapon: 'оружие',
  armor: 'доспех',
  shield: 'щит',
  potion: 'зелье',
  artifact: 'артефакт',
  quest: 'квест',
  misc: 'разное',
};
