import type { RoomType } from '../../types';

/** Player-facing room names (used by the exit list and room info). */
export const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Вход',
  corridor: 'Коридор',
  barracks: 'Казарма',
  library: 'Библиотека',
  crypt: 'Крипта',
  trap: 'Комната-ловушка',
  puzzle: 'Комната-загадка',
  treasure: 'Сокровищница',
  boss: 'Логово босса',
  shop: 'Лавка торговца',
  throne: 'Тронный зал',
};

/** Emoji per room type. */
export const ROOM_EMOJI: Record<RoomType, string> = {
  entrance: '🚪',
  corridor: '🕯️',
  barracks: '⚔️',
  library: '📖',
  crypt: '💀',
  trap: '⚡',
  puzzle: '❓',
  treasure: '💎',
  boss: '☠️',
  shop: '🪙',
  throne: '👑',
};
