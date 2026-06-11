// ============================================================================
// Shared AI data contracts. Pure types — no runtime code, no React.
// The Dungeon Master (Groq LLM) replies with a DMResponse; the game engine
// turns its optional fields into mechanics.
// ============================================================================

import type { ItemRarity, ItemType, Stats } from '../../types';

/** A loot item the DM hands to the player. Mirrors the DM JSON schema. */
export interface DMItemFound {
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  rarity: ItemRarity;
  value: number;
}

/** A skill check the DM asks the player to make (d20 + ability vs DC). */
export interface DMRequiresRoll {
  stat: keyof Stats;
  dc: number;
  /** Russian flavour text, e.g. "Ты пытаешься взломать замок...". */
  description: string;
}

/** Structured reply from the Dungeon Master. Only `narrative` is guaranteed. */
export interface DMResponse {
  /** DM prose shown in the NarrativeLog (Russian, 2nd person). */
  narrative: string;
  /** Start combat with these bestiary ids (goblin, skeleton, ...). */
  combatStart?: {
    enemyIds: string[];
  };
  /** An item the DM awards. */
  itemFound?: DMItemFound;
  /** Gold delta — positive (found) or negative (lost). */
  goldChange?: number;
  /** Experience awarded. */
  xpGained?: number;
  /** Quest objective the action advances. */
  questUpdate?: {
    questId: string;
    objectiveId: string;
  };
  /** The DM requests a skill check before resolving the action. */
  requiresRoll?: DMRequiresRoll;
  /** True when the reply is pure narration with no attached mechanics. */
  narrationOnly: boolean;
}

/** One turn in the chat transcript sent to the LLM. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
