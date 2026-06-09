// ============================================================================
// Combat engine. Pure functions only — NO React, NO store. Callers apply the
// returned TurnResults (damage, kills, logs) to game state themselves.
// ============================================================================

import type {
  Character,
  CombatState,
  DiceType,
  Enemy,
  Item,
  Room,
  StatusEffect,
  StatusEffectType,
  TurnEntry,
} from '../../types';
import { checkHit, checkHitMode, rollDamage, rollInitiative, rollRaw, roll } from './dice';
import type { AttackRoll, RollMode } from './dice';
import { createRng, randomSeed, randInt, chance } from '../random';
import { rollLoot } from '../dungeon/lootTables';

export interface TurnResult {
  narrative: string;
  damageDealt: number;
  /** Damage to the player; negative values heal. */
  damageTaken: number;
  killedEnemyId?: string;
  statusApplied?: StatusEffect;
  combatEnded: boolean;
  playerWon?: boolean;
  /** The d20 attack roll, when this turn involved an attack (drives the dice UI). */
  attackRoll?: AttackRoll;
}

const FLEE_DC = 12;
const BERSERK_THRESHOLD = 0.5;
const TACTICAL_RETREAT_THRESHOLD = 0.5;
const COWARD_HOLD_THRESHOLD = 0.7;
const COWARD_FLEE_THRESHOLD = 0.3;

// --- Combat flavour text ---

const FUMBLES = [
  'You swing wildly and nearly drop your weapon.',
  'Your foot slips on the stone — the blow goes nowhere.',
  'You overcommit and stumble, leaving yourself exposed.',
  'The attack twists in your grip and whistles past harmlessly.',
  'You misjudge the distance and strike only empty air.',
];
const MISSES = [
  "Your attack glances off the {enemy}'s defenses.",
  'The {enemy} sidesteps your blow.',
  'You strike, but the {enemy} twists away in time.',
  'Your weapon meets only the space where the {enemy} stood.',
];
const HITS = [
  'You strike the {enemy} for {damage} damage.',
  'Your blow lands true — {damage} damage to the {enemy}.',
  'You catch the {enemy} hard, dealing {damage} damage.',
  'A clean hit! The {enemy} takes {damage} damage.',
];
const CRITS = [
  'Critical hit! You find a vital spot — {damage} damage!',
  'A devastating strike! The {enemy} reels — {damage} damage!',
  'Perfectly placed! You tear into the {enemy} for {damage} damage!',
  'Critical! Your blow bites deep — {damage} damage!',
];
const ENEMY_DEATHS = [
  'The {enemy} collapses, lifeless.',
  'With a final shudder, the {enemy} falls.',
  'The {enemy} crumples to the floor, defeated.',
];
const ENEMY_HITS = [
  'The {enemy} strikes you for {damage} damage.',
  'You fail to dodge — the {enemy} deals {damage} damage.',
  "The {enemy}'s attack lands, costing you {damage} damage.",
];
const ENEMY_MISSES = [
  'The {enemy} lunges, but you turn the blow aside.',
  "You parry the {enemy}'s attack just in time.",
  'The {enemy} swings and misses.',
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function diceSides(dice: DiceType): number {
  return parseInt(dice.slice(1), 10);
}

function damageExpr(count: number, dice: DiceType, bonus: number): string {
  return `${count}d${diceSides(dice)}${bonus >= 0 ? `+${bonus}` : `${bonus}`}`;
}

function dexMod(enemy: Enemy): number {
  return Math.floor((enemy.stats.dex - 10) / 2);
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/** Roll initiative for all combatants and build a fresh CombatState. */
export function initCombat(enemies: Enemy[], character: Character): CombatState {
  // Deep-copy so combat damage never mutates the room's source enemies.
  const combatEnemies: Enemy[] = JSON.parse(JSON.stringify(enemies));
  const turnOrder: TurnEntry[] = [
    { id: 'player', kind: 'player', initiative: rollInitiative(character.modifiers.dex) },
    ...combatEnemies.map((enemy): TurnEntry => ({ id: enemy.id, kind: 'enemy', initiative: rollInitiative(dexMod(enemy)) })),
  ];
  turnOrder.sort((a, b) => b.initiative - a.initiative);
  return { active: true, round: 1, turnOrder, currentTurnIndex: 0, enemies: combatEnemies, log: [] };
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

/** Resolve a player melee/ranged attack. weaponAttackBonus is the FULL to-hit bonus. */
export function playerAttack(
  character: Character,
  targetEnemy: Enemy,
  weaponDamage: string,
  weaponAttackBonus: number,
): TurnResult {
  const enemy = targetEnemy.name.toLowerCase();
  const blessed = character.statusEffects.some((e) => e.type === 'blessed');
  const bonus = weaponAttackBonus + (blessed ? rollRaw(4) : 0);
  const attack = checkHit(bonus, targetEnemy.ac);

  if (attack.isCritFail) {
    return { narrative: pick(FUMBLES), damageDealt: 0, damageTaken: 0, combatEnded: false, attackRoll: attack };
  }
  if (!attack.isHit) {
    return { narrative: fill(pick(MISSES), { enemy }), damageDealt: 0, damageTaken: 0, combatEnded: false, attackRoll: attack };
  }

  const damage = rollDamage(weaponDamage, attack.isCrit);
  const template = attack.isCrit ? pick(CRITS) : pick(HITS);
  let narrative = fill(template, { enemy, damage: String(damage) });
  const result: TurnResult = { narrative, damageDealt: damage, damageTaken: 0, combatEnded: false, attackRoll: attack };

  if (targetEnemy.hp - damage <= 0) {
    result.killedEnemyId = targetEnemy.id;
    narrative += ` ${fill(pick(ENEMY_DEATHS), { enemy })}`;
    result.narrative = narrative;
  }
  return result;
}

export function playerDodge(_character: Character): TurnResult {
  return {
    narrative: 'You take a defensive stance. Attacks against you have disadvantage this round.',
    damageDealt: 0,
    damageTaken: 0,
    combatEnded: false,
  };
}

export function playerFlee(character: Character, _room: Room): TurnResult {
  const check = rollRaw(20) + character.modifiers.dex;
  if (check >= FLEE_DC) {
    return { narrative: 'You break away and escape into the dark!', damageDealt: 0, damageTaken: 0, combatEnded: true, playerWon: false };
  }
  return { narrative: 'You try to flee but the enemy blocks your path!', damageDealt: 0, damageTaken: 0, combatEnded: false };
}

export function playerUseItem(_character: Character, item: Item, _targetEnemyId?: string): TurnResult {
  const effect = item.potionEffect;
  if (item.type === 'potion' && effect?.effect === 'heal') {
    const healed = roll(damageExpr(effect.diceCount ?? 1, effect.diceType ?? 'd4', effect.bonus ?? 0));
    return { narrative: `You drink the ${item.name} and recover ${healed} HP.`, damageDealt: 0, damageTaken: -healed, combatEnded: false };
  }
  return { narrative: 'Nothing happens.', damageDealt: 0, damageTaken: 0, combatEnded: false };
}

// ---------------------------------------------------------------------------
// Enemy actions
// ---------------------------------------------------------------------------

/** Resolve every living enemy's turn (in order); callers play them with delays. */
export function resolveEnemyTurns(enemies: Enemy[], character: Character, isDodging: boolean): TurnResult[] {
  const living = enemies.filter((enemy) => enemy.hp > 0);
  return living.map((enemy) => resolveEnemyAction(enemy, character, isDodging, living));
}

export function resolveEnemyAction(
  enemy: Enemy,
  character: Character,
  isDodging: boolean,
  allies?: Enemy[],
): TurnResult {
  const name = enemy.name.toLowerCase();
  const hpFraction = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;

  // Cowards disengage or flee outright when hurt.
  if (enemy.behavior === 'coward') {
    if (hpFraction < COWARD_FLEE_THRESHOLD) {
      return { narrative: `The ${name} flees in terror!`, damageDealt: 0, damageTaken: 0, killedEnemyId: enemy.id, combatEnded: false };
    }
    if (hpFraction < COWARD_HOLD_THRESHOLD) {
      return { narrative: `The ${name} cowers and retreats!`, damageDealt: 0, damageTaken: 0, combatEnded: false };
    }
  }

  // Tacticians sometimes pull back when wounded.
  if (enemy.behavior === 'tactical' && hpFraction < TACTICAL_RETREAT_THRESHOLD && chance(createRng(randomSeed()), 0.5)) {
    return { narrative: `The ${name} retreats to a safer position.`, damageDealt: 0, damageTaken: 0, combatEnded: false };
  }

  // Support casters mend a wounded ally instead of attacking (flavour for now).
  if (enemy.behavior === 'support' && allies) {
    const wounded = allies.find((a) => a.id !== enemy.id && a.hp > 0 && a.hp / a.maxHp < 0.5);
    if (wounded) {
      return {
        narrative: `The ${name} chants a dark incantation, mending the ${wounded.name.toLowerCase()}'s wounds.`,
        damageDealt: 0,
        damageTaken: 0,
        combatEnded: false,
      };
    }
  }

  // Berserkers attack harder once bloodied.
  let attackBonus = 0;
  let damageBonus = 0;
  let prefix = '';
  if (enemy.behavior === 'berserker' && hpFraction < BERSERK_THRESHOLD) {
    attackBonus = 2;
    damageBonus = 2;
    prefix = `The ${name} lets out a furious roar and attacks with wild abandon! `;
  }

  // Tacticians favour their biggest attack; others pick at random.
  const attack =
    enemy.behavior === 'tactical'
      ? enemy.attacks.reduce((best, a) => (a.damageCount * diceSides(a.damageDice) > best.damageCount * diceSides(best.damageDice) ? a : best), enemy.attacks[0])
      : pick(enemy.attacks);

  const mode: RollMode = isDodging ? 'disadvantage' : 'normal';
  const hit = checkHitMode(attack.toHitBonus + attackBonus, character.ac, mode);
  if (!hit.isHit) {
    return { narrative: prefix + fill(pick(ENEMY_MISSES), { enemy: name }), damageDealt: 0, damageTaken: 0, combatEnded: false, attackRoll: hit };
  }
  const damage = rollDamage(damageExpr(attack.damageCount, attack.damageDice, attack.damageBonus + damageBonus), hit.isCrit);
  return { narrative: prefix + fill(pick(ENEMY_HITS), { enemy: name, damage: String(damage) }), damageDealt: 0, damageTaken: damage, combatEnded: false, attackRoll: hit };
}

// ---------------------------------------------------------------------------
// Status effects
// ---------------------------------------------------------------------------

/** Apply start-of-turn status effects to the player (poison/bleed/burn/stun). */
export function tickStatusEffects(character: Character): { character: Character; log: string[]; skipTurn: boolean } {
  const log: string[] = [];
  let hp = character.hp;
  let skipTurn = false;
  const remaining: StatusEffect[] = [];

  for (const effect of character.statusEffects) {
    let keep = effect.duration > 1;
    switch (effect.type) {
      case 'poisoned': {
        const n = roll('1d4');
        hp -= n;
        log.push(`Poison courses through your veins — ${n} damage.`);
        break;
      }
      case 'bleeding': {
        const n = roll('1d4');
        hp -= n;
        log.push(`Your wounds seep blood — ${n} damage.`);
        break;
      }
      case 'burning': {
        const n = roll('1d4');
        hp -= n;
        log.push(`Flames lick at you — ${n} damage.`);
        if (Math.random() < 0.3) keep = false;
        break;
      }
      case 'stunned': {
        skipTurn = true;
        keep = false;
        log.push('You are stunned and cannot act.');
        break;
      }
      default:
        break;
    }
    if (keep) remaining.push({ ...effect, duration: effect.duration - 1 });
  }

  return { character: { ...character, hp: Math.max(0, hp), statusEffects: remaining }, log, skipTurn };
}

/** Add a status effect to a list if it isn't already present. */
export function applyStatusEffect(
  effects: StatusEffect[],
  type: StatusEffectType,
  duration: number,
  magnitude?: number,
): StatusEffect[] {
  if (effects.some((e) => e.type === type)) return effects;
  return [...effects, { type, duration, magnitude }];
}

// ---------------------------------------------------------------------------
// Resolution & loot
// ---------------------------------------------------------------------------

export function checkCombatEnd(enemies: Enemy[], character: Character): { ended: boolean; playerWon: boolean } {
  const playerWon = enemies.every((enemy) => enemy.hp <= 0);
  return { ended: playerWon || character.hp <= 0, playerWon };
}

/** Roll rewards for the defeated enemies: XP, gold and a few dropped items. */
export function resolveLoot(enemies: Enemy[]): { items: Item[]; gold: number; xp: number } {
  const rng = createRng(randomSeed());
  let xp = 0;
  let gold = 0;
  const items: Item[] = [];
  for (const enemy of enemies) {
    xp += enemy.xpReward;
    gold += randInt(rng, 3, 12) + Math.round(enemy.cr * 10);
    if (chance(rng, 0.4)) items.push(...rollLoot(rng, 1));
  }
  return { items, gold, xp };
}
