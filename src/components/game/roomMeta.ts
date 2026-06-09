import type { RoomType } from '../../types';

/** Player-facing room names (used by the exit list and room info). */
export const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrance',
  corridor: 'Corridor',
  barracks: 'Barracks',
  library: 'Library',
  crypt: 'Crypt',
  trap: 'Trapped Room',
  puzzle: 'Puzzle Chamber',
  treasure: 'Treasure Vault',
  boss: 'Boss Lair',
  shop: "Merchant's Den",
  throne: 'Throne Room',
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
