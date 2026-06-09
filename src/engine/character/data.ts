// ============================================================================
// Static character-creation data: races, classes, backgrounds, names, point-buy.
// Pure data only — no React, no logic. Consumed by creation.ts and the wizard UI.
// ============================================================================

import type {
  ArmorStats,
  CharacterBackground,
  CharacterClass,
  CharacterRace,
  ItemRarity,
  ItemType,
  Stats,
  WeaponStats,
} from '../../types';

// ---------------------------------------------------------------------------
// Ability scores
// ---------------------------------------------------------------------------

/** Ability-score keys in canonical display order. */
export const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export interface StatInfo {
  key: StatKey;
  abbr: string;
  name: string;
  hint: string;
}

export const STATS_INFO: StatInfo[] = [
  { key: 'str', abbr: 'STR', name: 'Strength', hint: 'Melee attacks, carrying capacity' },
  { key: 'dex', abbr: 'DEX', name: 'Dexterity', hint: 'Armor class, initiative, ranged' },
  { key: 'con', abbr: 'CON', name: 'Constitution', hint: 'Hit points and stamina' },
  { key: 'int', abbr: 'INT', name: 'Intelligence', hint: 'Arcane spells and lore' },
  { key: 'wis', abbr: 'WIS', name: 'Wisdom', hint: 'Divine spells and perception' },
  { key: 'cha', abbr: 'CHA', name: 'Charisma', hint: 'Social skills, bardic magic' },
];

// ---------------------------------------------------------------------------
// Point buy
// ---------------------------------------------------------------------------

export const POINT_BUY_BUDGET = 27;
export const STAT_MIN = 8;
export const STAT_MAX = 15;

/** Cost in points to raise a score to the given value (before racial bonuses). */
export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

function byId<K extends string, T extends { id: K }>(items: T[]): Record<K, T> {
  return Object.fromEntries(items.map((item): [K, T] => [item.id, item])) as Record<K, T>;
}

// ---------------------------------------------------------------------------
// Races
// ---------------------------------------------------------------------------

export interface RaceData {
  id: CharacterRace;
  name: string;
  icon: string;
  bonuses: Partial<Stats>;
  traits: string[];
  description: string;
}

export const RACES: RaceData[] = [
  {
    id: 'human',
    name: 'Human',
    icon: '🧑',
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: ['Versatile'],
    description:
      'Ambitious and adaptable, humans master no single art but bend every path to their will. A bonus to all abilities suits them to any calling.',
  },
  {
    id: 'elf',
    name: 'Elf',
    icon: '🧝',
    bonuses: { dex: 2, int: 1 },
    traits: ['Darkvision', 'Fey Ancestry'],
    description:
      'Graceful and long-lived, elves move with uncanny precision. Keen senses and an agile body favour scouts, archers and arcane tricksters.',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    icon: '🧔',
    bonuses: { con: 2, wis: 1 },
    traits: ['Darkvision', 'Dwarven Resilience'],
    description:
      'Stout, stubborn folk of stone and forge. Their resilience and hardy constitution let them outlast almost any foe in a war of attrition.',
  },
  {
    id: 'halfling',
    name: 'Halfling',
    icon: '🧒',
    bonuses: { dex: 2, cha: 1 },
    traits: ['Lucky', 'Brave'],
    description:
      'Small, nimble and improbably lucky. Halflings slip through danger with a grin, turning near-disasters into fortunate escapes.',
  },
  {
    id: 'half-orc',
    name: 'Half-Orc',
    icon: '👹',
    bonuses: { str: 2, con: 1 },
    traits: ['Darkvision', 'Relentless Endurance'],
    description:
      'Born of two worlds and at home in neither, half-orcs channel fury into raw power. They refuse to fall while a single breath remains.',
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    icon: '😈',
    bonuses: { cha: 2, int: 1 },
    traits: ['Darkvision', 'Hellish Resistance'],
    description:
      'Marked by an infernal bloodline, tieflings carry an unsettling charm and resistance to flame. Distrusted by many, they forge their own fortune.',
  },
];

export const RACE_BY_ID = byId(RACES);

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export interface ClassData {
  id: CharacterClass;
  name: string;
  icon: string;
  hitDie: number;
  primary: StatKey[];
  feature: string;
  featureDesc: string;
  description: string;
  startingGold: number;
  isCaster: boolean;
}

export const CLASSES: ClassData[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    icon: '⚔️',
    hitDie: 10,
    primary: ['str', 'con'],
    feature: 'Second Wind',
    featureDesc: 'Heal 1d10 + level once per rest.',
    description:
      'A master of weapons and armour who wins through discipline and staying power. Fighters hit hard, take hits harder, and rarely run short of stamina.',
    startingGold: 10,
    isCaster: false,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    icon: '🗡️',
    hitDie: 8,
    primary: ['dex'],
    feature: 'Sneak Attack',
    featureDesc: 'Deal an extra 1d6 when you strike from advantage.',
    description:
      'A precise opportunist who turns a single opening into a lethal blow. Rogues thrive on stealth, traps and finding the soft spot in any defence.',
    startingGold: 15,
    isCaster: false,
  },
  {
    id: 'wizard',
    name: 'Wizard',
    icon: '🪄',
    hitDie: 6,
    primary: ['int'],
    feature: 'Spellcasting',
    featureDesc: 'Cast arcane spells; refill slots with Arcane Recovery.',
    description:
      'A scholar of the arcane who bends reality through study. Fragile in body but devastating in the right moment, the wizard wields the widest spell list of all.',
    startingGold: 10,
    isCaster: true,
  },
  {
    id: 'cleric',
    name: 'Cleric',
    icon: '✨',
    hitDie: 8,
    primary: ['wis'],
    feature: 'Spellcasting',
    featureDesc: 'Channel divine spells granted by a Divine Domain.',
    description:
      'A holy warrior-priest who heals allies and smites the unworthy. Clerics blend solid armour with divine magic, thriving at the heart of any party.',
    startingGold: 10,
    isCaster: true,
  },
  {
    id: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    hitDie: 10,
    primary: ['dex', 'wis'],
    feature: 'Favored Enemy',
    featureDesc: 'Track prey and survive the wilds as a Natural Explorer.',
    description:
      'A hunter of the borderlands, equally deadly with bow and blade. Rangers read the land, mark their quarry, and rarely lose a trail once they catch it.',
    startingGold: 10,
    isCaster: false,
  },
  {
    id: 'bard',
    name: 'Bard',
    icon: '🎵',
    hitDie: 8,
    primary: ['cha'],
    feature: 'Bardic Inspiration',
    featureDesc: 'Grant allies a d6 boost; cast versatile spells.',
    description:
      'A charismatic jack-of-all-trades whose magic flows through performance. Bards inspire allies, charm foes and dabble in a little of everything.',
    startingGold: 15,
    isCaster: true,
  },
];

export const CLASS_BY_ID = byId(CLASSES);

// ---------------------------------------------------------------------------
// Starting inventory (templates -> Item objects are built in creation.ts)
// ---------------------------------------------------------------------------

export interface StartItemSpec {
  name: string;
  type: ItemType;
  icon: string;
  description: string;
  rarity?: ItemRarity;
  weight?: number;
  value?: number;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
}

const LEATHER_ARMOR: StartItemSpec = {
  name: 'Leather Armor',
  type: 'armor',
  icon: '🥋',
  description: 'Supple boiled leather. AC 11 + DEX modifier.',
  weight: 10,
  value: 10,
  armorStats: { baseAc: 11, slot: 'body' },
};

const CHAIN_MAIL: StartItemSpec = {
  name: 'Chain Mail',
  type: 'armor',
  icon: '🛡️',
  description: 'Heavy interlocking rings. Sets AC to 16.',
  weight: 55,
  value: 75,
  armorStats: { baseAc: 16, maxDexBonus: 0, slot: 'body' },
};

export const STARTING_INVENTORY: Record<CharacterClass, StartItemSpec[]> = {
  fighter: [
    {
      name: 'Longsword',
      type: 'weapon',
      icon: '🗡️',
      description: 'A versatile blade. 1d8 slashing damage.',
      weight: 3,
      value: 15,
      weaponStats: { damageDice: 'd8', damageCount: 1, damageBonus: 0, damageType: 'slashing' },
    },
    CHAIN_MAIL,
    {
      name: 'Shield',
      type: 'shield',
      icon: '🛡️',
      description: 'A sturdy shield. +2 AC when equipped.',
      weight: 6,
      value: 10,
      armorStats: { baseAc: 2, slot: 'offHand' },
    },
  ],
  rogue: [
    {
      name: 'Shortsword',
      type: 'weapon',
      icon: '🗡️',
      description: 'A light finesse blade. 1d6 piercing damage.',
      weight: 2,
      value: 10,
      weaponStats: { damageDice: 'd6', damageCount: 1, damageBonus: 0, damageType: 'piercing', finesse: true },
    },
    LEATHER_ARMOR,
    {
      name: "Thieves' Tools",
      type: 'misc',
      icon: '🛠️',
      description: 'Picks and probes for locks and traps.',
      weight: 1,
      value: 25,
    },
  ],
  wizard: [
    {
      name: 'Quarterstaff',
      type: 'weapon',
      icon: '🪄',
      description: 'A simple staff. 1d6 bludgeoning damage.',
      weight: 4,
      value: 2,
      weaponStats: { damageDice: 'd6', damageCount: 1, damageBonus: 0, damageType: 'bludgeoning' },
    },
    { name: 'Spellbook', type: 'misc', icon: '📖', description: 'Your arcane tome of known spells.', weight: 3, value: 50 },
    { name: 'Component Pouch', type: 'misc', icon: '🎒', description: 'Material components for spellcasting.', weight: 2, value: 25 },
  ],
  cleric: [
    {
      name: 'Mace',
      type: 'weapon',
      icon: '🔨',
      description: 'A blunt instrument of faith. 1d6 bludgeoning damage.',
      weight: 4,
      value: 5,
      weaponStats: { damageDice: 'd6', damageCount: 1, damageBonus: 0, damageType: 'bludgeoning' },
    },
    CHAIN_MAIL,
    { name: 'Holy Symbol', type: 'misc', icon: '✨', description: 'A divine focus for channeling miracles.', weight: 1, value: 5 },
  ],
  ranger: [
    {
      name: 'Longbow',
      type: 'weapon',
      icon: '🏹',
      description: 'A tall bow with long range. 1d8 piercing damage.',
      weight: 2,
      value: 50,
      weaponStats: { damageDice: 'd8', damageCount: 1, damageBonus: 0, damageType: 'piercing', ranged: true, twoHanded: true },
    },
    { name: 'Quiver', type: 'misc', icon: '🎯', description: 'Holds 20 arrows.', weight: 1, value: 1 },
    LEATHER_ARMOR,
  ],
  bard: [
    {
      name: 'Rapier',
      type: 'weapon',
      icon: '🤺',
      description: 'An elegant finesse blade. 1d8 piercing damage.',
      weight: 2,
      value: 25,
      weaponStats: { damageDice: 'd8', damageCount: 1, damageBonus: 0, damageType: 'piercing', finesse: true },
    },
    LEATHER_ARMOR,
    { name: 'Lute', type: 'misc', icon: '🎵', description: 'A fine instrument and spellcasting focus.', weight: 2, value: 35 },
  ],
};

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

export interface BackgroundData {
  id: CharacterBackground;
  name: string;
  icon: string;
  skills: string[];
  bonus: string;
  bonusGold: number;
}

export const BACKGROUNDS: BackgroundData[] = [
  { id: 'soldier', name: 'Soldier', icon: '🎖️', skills: ['Athletics', 'Intimidation'], bonus: '+10 gold and a Military Rank that commands respect.', bonusGold: 10 },
  { id: 'criminal', name: 'Criminal', icon: '🗝️', skills: ['Deception', 'Stealth'], bonus: "Thieves' Tools and a Criminal Contact in every town.", bonusGold: 0 },
  { id: 'scholar', name: 'Scholar', icon: '📚', skills: ['History', 'Arcana'], bonus: 'Two extra languages and a spare spell scroll.', bonusGold: 0 },
  { id: 'noble', name: 'Noble', icon: '👑', skills: ['History', 'Persuasion'], bonus: '+20 gold and a Signet Ring of your house.', bonusGold: 20 },
  { id: 'folk-hero', name: 'Folk Hero', icon: '🌾', skills: ['Animal Handling', 'Survival'], bonus: "Artisan's Tools and fame among common villagers.", bonusGold: 0 },
  { id: 'outlander', name: 'Outlander', icon: '🏔️', skills: ['Athletics', 'Survival'], bonus: 'A Musical Instrument and an unerring sense of the land.', bonusGold: 0 },
];

export const BACKGROUND_BY_ID = byId(BACKGROUNDS);

// ---------------------------------------------------------------------------
// Random names, per race (min 10 each)
// ---------------------------------------------------------------------------

export const NAMES: Record<CharacterRace, string[]> = {
  human: ['Aldric', 'Mara', 'Cedric', 'Elena', 'Garrett', 'Rosalind', 'Tobias', 'Linnea', 'Roderick', 'Isolde', 'Bram', 'Cora'],
  elf: ['Aelar', 'Sylvara', 'Thalion', 'Naivara', 'Erevan', 'Liriel', 'Caelynn', 'Faelar', 'Shanairra', 'Varis', 'Aramil', 'Mialee'],
  dwarf: ['Thorin', 'Helga', 'Balin', 'Dagna', 'Gimli', 'Brunhild', 'Durin', 'Vistra', 'Harbek', 'Audhild', 'Orsik', 'Gunnloda'],
  halfling: ['Pip', 'Rosie', 'Milo', 'Lavinia', 'Wenna', 'Cade', 'Seraphina', 'Osborn', 'Tilly', 'Roscoe', 'Merric', 'Nedda'],
  'half-orc': ['Grosh', 'Yevelda', 'Mhurren', 'Shautha', 'Karg', 'Baggi', 'Thokk', 'Emen', 'Dench', 'Volen', 'Ront', 'Sutha'],
  tiefling: ['Akmenos', 'Nemeia', 'Damaia', 'Mordai', 'Kallista', 'Skamos', 'Criella', 'Therai', 'Barakas', 'Rieta', 'Pelaios', 'Orianna'],
};
