import type { Stats } from '../../types';

/** Russian ability-score labels, shared across combat / skill-check UI. */
export const STAT_RU: Record<keyof Stats, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
};
