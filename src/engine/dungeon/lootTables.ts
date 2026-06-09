// ============================================================================
// Basic loot table for Phase 3. Item factories return fresh Item objects;
// rollLoot draws probability-weighted items for treasure rooms.
// ============================================================================

import type { Item } from '../../types';
import { chance, randInt } from '../random';
import type { Rng } from '../random';

function makeItem(item: Omit<Item, 'id'>): Item {
  return { id: crypto.randomUUID(), ...item };
}

export function createHealthPotion(): Item {
  return makeItem({
    name: 'Health Potion',
    type: 'potion',
    rarity: 'common',
    weight: 0.5,
    value: 50,
    description: 'Restores 2d4 + 2 hit points when quaffed.',
    icon: '🧪',
    potionEffect: { effect: 'heal', diceCount: 2, diceType: 'd4', bonus: 2 },
  });
}

export function createDagger(): Item {
  return makeItem({
    name: 'Dagger',
    type: 'weapon',
    rarity: 'common',
    weight: 1,
    value: 2,
    description: 'A simple finesse blade. 1d4 piercing damage.',
    icon: '🔪',
    weaponStats: { damageDice: 'd4', damageCount: 1, damageBonus: 0, damageType: 'piercing', finesse: true },
  });
}

export function createGoldPouch(rng: Rng): Item {
  const value = randInt(rng, 10, 30);
  return makeItem({
    name: 'Gold Pouch',
    type: 'misc',
    rarity: 'common',
    weight: 0.2,
    value,
    description: `A small pouch holding ${value} gold pieces.`,
    icon: '💰',
  });
}

export function createLeatherArmor(): Item {
  return makeItem({
    name: 'Leather Armor',
    type: 'armor',
    rarity: 'uncommon',
    weight: 10,
    value: 10,
    description: 'Supple boiled leather. AC 11 + DEX modifier.',
    icon: '🥋',
    armorStats: { baseAc: 11, slot: 'body' },
  });
}

export function createScrollOfFireball(): Item {
  return makeItem({
    name: 'Scroll of Fireball',
    type: 'artifact',
    rarity: 'rare',
    weight: 0.1,
    value: 150,
    description: 'A single-use scroll unleashing a 3d6 fire blast.',
    icon: '📜',
  });
}

interface LootEntry {
  chance: number;
  create: (rng: Rng) => Item;
}

const LOOT_TABLE: LootEntry[] = [
  { chance: 0.6, create: () => createHealthPotion() },
  { chance: 0.4, create: () => createDagger() },
  { chance: 0.5, create: (rng) => createGoldPouch(rng) },
  { chance: 0.2, create: () => createLeatherArmor() },
  { chance: 0.1, create: () => createScrollOfFireball() },
];

/** Draw items by rolling the table until `count` items are gathered. */
export function rollLoot(rng: Rng, count: number): Item[] {
  const items: Item[] = [];
  let guard = 0;
  while (items.length < count && guard < 40) {
    guard += 1;
    for (const entry of LOOT_TABLE) {
      if (items.length >= count) break;
      if (chance(rng, entry.chance)) items.push(entry.create(rng));
    }
  }
  return items;
}
