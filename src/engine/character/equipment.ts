// ============================================================================
// Equipment helpers: which slot an item fits, and AC recalculation.
// Pure functions (no React, no store).
// ============================================================================

import type { Character, EquipmentSlot, EquipmentSlots, Item } from '../../types';

/** The slot an item equips into, or null if it cannot be equipped. */
export function equipmentSlotFor(item: Item): EquipmentSlot | null {
  if (item.type === 'weapon') return 'mainHand';
  if (item.type === 'shield') return 'offHand';
  if (item.type === 'armor') return item.armorStats?.slot ?? 'body';
  return null;
}

/**
 * Recompute AC from equipped gear (D&D-style):
 *   unarmored = 10 + DEX mod
 *   body armor = baseAc + min(DEX mod, maxDexBonus)
 *   shield in off-hand adds its baseAc bonus.
 */
export function recomputeAC(character: Character, equipped: EquipmentSlots): number {
  const dexMod = character.modifiers.dex;
  let ac = 10 + dexMod;

  const body = equipped.body;
  if (body?.armorStats) {
    const cap = body.armorStats.maxDexBonus ?? dexMod;
    ac = body.armorStats.baseAc + Math.min(dexMod, cap);
  }

  const offHand = equipped.offHand;
  if (offHand?.type === 'shield' && offHand.armorStats) {
    ac += offHand.armorStats.baseAc;
  }

  return ac;
}
