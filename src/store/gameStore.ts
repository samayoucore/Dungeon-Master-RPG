import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Character,
  CombatState,
  Dungeon,
  EquipmentSlot,
  EquipmentSlots,
  GameScreen,
  GameState,
  GameStats,
  Item,
  NarrativeType,
  Quest,
  StatusEffect,
} from '../types';
import { generateRoomDescription } from '../engine/narrative/engine';
import { equipmentSlotFor, recomputeAC } from '../engine/character/equipment';
import {
  MAX_LEVEL,
  XP_THRESHOLDS,
  classFeatures,
  proficiencyForLevel,
  rollHitDie,
  xpToNextFor,
} from '../engine/character/progression';

/** Crypto-backed id with a safe fallback for non-secure contexts. */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEquipment(): EquipmentSlots {
  return {
    head: null,
    body: null,
    hands: null,
    legs: null,
    mainHand: null,
    offHand: null,
    ring1: null,
    ring2: null,
    amulet: null,
  };
}

function createStats(): GameStats {
  return { turnsPlayed: 0, enemiesKilled: 0, goldFound: 0, roomsExplored: 0 };
}

/** Fresh, character-less game state used on boot and reset. */
function createInitialState(): GameState {
  return {
    screen: 'title',
    character: null,
    dungeon: null,
    combat: null,
    inventory: [],
    equipped: createEquipment(),
    quests: [],
    narrativeLog: [],
    gameStats: createStats(),
    isLoading: false,
    savedAt: null,
    pendingLevelUp: null,
  };
}

/** Imperative actions exposed alongside the {@link GameState}. */
export interface GameActions {
  setScreen: (screen: GameScreen) => void;
  beginCreation: () => void;
  startNewGame: (character: Character) => void;
  resetGame: () => void;
  addNarrative: (text: string, type?: NarrativeType) => void;
  clearNarrative: () => void;
  updateHp: (delta: number) => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  clearLevelUp: () => void;
  addQuest: (quest: Quest) => void;
  advanceObjective: (questId: string, objectiveId: string, amount?: number) => void;
  setCombat: (combat: CombatState) => void;
  endCombat: () => void;
  damageEnemy: (enemyId: string, amount: number) => void;
  addCombatLog: (text: string) => void;
  nextCombatRound: () => void;
  setStatusEffects: (effects: StatusEffect[]) => void;
  setDungeonRoomCleared: (roomId: string) => void;
  setLoading: (loading: boolean) => void;
  incrementTurns: () => void;
  setDungeon: (dungeon: Dungeon) => void;
  moveToRoom: (roomId: string) => void;
  loadState: (state: GameState) => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    ...createInitialState(),

    setScreen: (screen) =>
      set((state) => {
        state.screen = screen;
      }),

    // Title screen -> start the creation wizard with a clean slate.
    beginCreation: () =>
      set((state) => {
        Object.assign(state, createInitialState());
        state.screen = 'character-creation';
      }),

    // Creation wizard -> commit the built hero and enter the dungeon.
    startNewGame: (character) =>
      set((state) => {
        Object.assign(state, createInitialState());
        state.character = character;
        state.screen = 'game';
      }),

    resetGame: () =>
      set((state) => {
        Object.assign(state, createInitialState());
      }),

    addNarrative: (text, type = 'narration') =>
      set((state) => {
        state.narrativeLog.push({ id: createId(), type, text, timestamp: Date.now() });
      }),

    clearNarrative: () =>
      set((state) => {
        state.narrativeLog = [];
      }),

    // Apply an HP delta, clamp to [0, maxHp], trigger game over at 0.
    updateHp: (delta) =>
      set((state) => {
        const { character } = state;
        if (!character) return;
        character.hp = Math.max(0, Math.min(character.maxHp, character.hp + delta));
        if (character.hp === 0) {
          state.screen = 'game-over';
        }
      }),

    addXp: (amount) =>
      set((state) => {
        const c = state.character;
        if (!c) return;
        c.xp += amount;
        // Apply every level-up the new XP total unlocks (possibly several).
        while (c.level < MAX_LEVEL && c.xp >= XP_THRESHOLDS[c.level + 1]) {
          const oldLevel = c.level;
          const oldMaxHp = c.maxHp;
          const oldProf = c.proficiencyBonus;
          const newLevel = c.level + 1;
          const hpGained = Math.max(1, rollHitDie(c.class) + c.modifiers.con);
          c.level = newLevel;
          c.maxHp += hpGained;
          c.hp += hpGained;
          c.proficiencyBonus = proficiencyForLevel(newLevel);
          c.xpToNext = xpToNextFor(newLevel);
          const features = classFeatures(c.class, newLevel);
          state.narrativeLog.push({
            id: createId(),
            type: 'system',
            text: `✦ Level Up! You are now level ${newLevel}.${features[0] ? ` ${features[0]}` : ''}`,
            timestamp: Date.now(),
          });
          state.pendingLevelUp = {
            oldLevel,
            newLevel,
            hpGained,
            oldMaxHp,
            newMaxHp: c.maxHp,
            oldProf,
            newProf: c.proficiencyBonus,
            features,
          };
        }
      }),

    addGold: (amount) =>
      set((state) => {
        if (!state.character) return;
        state.character.gold = Math.max(0, state.character.gold + amount);
        if (amount > 0) state.gameStats.goldFound += amount;
      }),

    addItem: (item) =>
      set((state) => {
        state.inventory.push(item);
      }),

    removeItem: (itemId) =>
      set((state) => {
        const index = state.inventory.findIndex((item) => item.id === itemId);
        if (index !== -1) state.inventory.splice(index, 1);
      }),

    // Equip an item into its slot, returning any displaced item to the bag.
    equipItem: (item) =>
      set((state) => {
        const character = state.character;
        if (!character) return;
        let slot = equipmentSlotFor(item);
        if (!slot) return;
        if (slot === 'ring1' && state.equipped.ring1) slot = 'ring2';
        const index = state.inventory.findIndex((i) => i.id === item.id);
        if (index === -1) return;
        state.inventory.splice(index, 1);
        const previous = state.equipped[slot];
        if (previous) state.inventory.push(previous);
        state.equipped[slot] = item;
        character.ac = recomputeAC(character, state.equipped);
      }),

    unequipItem: (slot) =>
      set((state) => {
        const character = state.character;
        const item = state.equipped[slot];
        if (!character || !item) return;
        state.equipped[slot] = null;
        state.inventory.push(item);
        character.ac = recomputeAC(character, state.equipped);
      }),

    clearLevelUp: () =>
      set((state) => {
        state.pendingLevelUp = null;
      }),

    addQuest: (quest) =>
      set((state) => {
        state.quests.push(quest);
      }),

    // Advance one objective; auto-complete the quest when every objective is done.
    advanceObjective: (questId, objectiveId, amount = 1) =>
      set((state) => {
        const quest = state.quests.find((q) => q.id === questId);
        if (!quest) return;
        const objective = quest.objectives.find((o) => o.id === objectiveId);
        if (!objective) return;
        objective.current = Math.min(objective.target, objective.current + amount);
        objective.isComplete = objective.current >= objective.target;
        if (quest.objectives.every((o) => o.isComplete)) {
          quest.status = 'completed';
        }
      }),

    setCombat: (combat) =>
      set((state) => {
        state.combat = combat;
      }),

    endCombat: () =>
      set((state) => {
        state.combat = null;
      }),

    // Apply damage to a combat enemy (negative heals). Clamped to [0, maxHp].
    damageEnemy: (enemyId, amount) =>
      set((state) => {
        const enemy = state.combat?.enemies.find((e) => e.id === enemyId);
        if (enemy) enemy.hp = Math.max(0, Math.min(enemy.maxHp, enemy.hp - amount));
      }),

    addCombatLog: (text) =>
      set((state) => {
        if (state.combat) {
          state.combat.log.push({ id: createId(), text, timestamp: Date.now() });
        }
      }),

    nextCombatRound: () =>
      set((state) => {
        if (state.combat) state.combat.round += 1;
      }),

    setStatusEffects: (effects) =>
      set((state) => {
        if (state.character) state.character.statusEffects = effects;
      }),

    // Clear a defeated room: count kills, mark cleared, remove enemies.
    setDungeonRoomCleared: (roomId) =>
      set((state) => {
        const room = state.dungeon?.rooms.find((r) => r.id === roomId);
        if (!room) return;
        state.gameStats.enemiesKilled += room.enemies.length;
        room.isCleared = true;
        room.enemies = [];
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    incrementTurns: () =>
      set((state) => {
        state.gameStats.turnsPlayed += 1;
      }),

    setDungeon: (dungeon) =>
      set((state) => {
        state.dungeon = dungeon;
      }),

    // Move to a connected room: reveal it and its neighbours, count first visits.
    moveToRoom: (roomId) =>
      set((state) => {
        const dungeon = state.dungeon;
        if (!dungeon) return;
        const room = dungeon.rooms.find((r) => r.id === roomId);
        if (!room) return;
        dungeon.currentRoomId = roomId;
        if (!room.isVisited) {
          room.isVisited = true;
          state.gameStats.roomsExplored += 1;
        }
        room.isRevealed = true;
        for (const neighbourId of room.connections) {
          const neighbour = dungeon.rooms.find((r) => r.id === neighbourId);
          if (neighbour) neighbour.isRevealed = true;
        }
        // Describe the newly entered room via the narrative engine.
        if (state.character) {
          state.narrativeLog.push({
            id: createId(),
            type: 'narration',
            text: generateRoomDescription(room, state.character),
            timestamp: Date.now(),
          });
        }
      }),

    // Replace data fields from a loaded save (action methods are preserved).
    loadState: (loaded) =>
      set((state) => {
        Object.assign(state, loaded);
      }),
  })),
);
