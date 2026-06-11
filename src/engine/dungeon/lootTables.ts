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
    name: 'Зелье лечения',
    type: 'potion',
    rarity: 'common',
    weight: 0.5,
    value: 50,
    description: 'Восстанавливает 2к4 + 2 HP, если выпить.',
    icon: '🧪',
    potionEffect: { effect: 'heal', diceCount: 2, diceType: 'd4', bonus: 2 },
  });
}

export function createDagger(): Item {
  return makeItem({
    name: 'Кинжал',
    type: 'weapon',
    rarity: 'common',
    weight: 1,
    value: 2,
    description: 'Простой клинок с фехтовальным свойством. 1к4 колющего урона.',
    icon: '🔪',
    weaponStats: { damageDice: 'd4', damageCount: 1, damageBonus: 0, damageType: 'piercing', finesse: true },
  });
}

export function createGoldPouch(rng: Rng): Item {
  const value = randInt(rng, 10, 30);
  return makeItem({
    name: 'Кошель с золотом',
    type: 'misc',
    rarity: 'common',
    weight: 0.2,
    value,
    description: `Небольшой кошель с ${value} золотыми монетами.`,
    icon: '💰',
  });
}

export function createLeatherArmor(): Item {
  return makeItem({
    name: 'Кожаный доспех',
    type: 'armor',
    rarity: 'uncommon',
    weight: 10,
    value: 10,
    description: 'Мягкая варёная кожа. КБ 11 + модификатор Ловкости.',
    icon: '🥋',
    armorStats: { baseAc: 11, slot: 'body' },
  });
}

export function createScrollOfFireball(): Item {
  return makeItem({
    name: 'Свиток огненного шара',
    type: 'artifact',
    rarity: 'rare',
    weight: 0.1,
    value: 150,
    description: 'Одноразовый свиток, выпускающий взрыв огня на 3к6.',
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
