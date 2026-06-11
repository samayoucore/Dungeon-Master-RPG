import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import {
  classifyCommand,
  generateActionResponse,
  restHpAmount,
} from '../../engine/narrative/engine';
import { initCombat } from '../../engine/combat/system';
import { createEnemyById } from '../../engine/dungeon/bestiary';
import type { DMRequiresRoll } from '../../engine/ai/types';
import type { Enemy, Item } from '../../types';
import SkillCheckCard from './SkillCheckCard';
import { STAT_RU } from './statLabels';

interface PlayerInputProps {
  /** Disables submission while the narrative is still typing out. */
  isTyping: boolean;
}

const HISTORY_LIMIT = 20;

const QUICK_ACTIONS = [
  { label: '🔍 Осмотреться', command: 'осмотреться' },
  { label: '🔎 Обыскать', command: 'обыскать' },
  { label: '💤 Отдохнуть', command: 'отдохнуть' },
  { label: '🎒 Инвентарь', command: 'инвентарь' },
];

/** Crypto-backed id with a safe fallback for non-secure contexts. */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PlayerInput({ isTyping }: PlayerInputProps) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [skillCheck, setSkillCheck] = useState<DMRequiresRoll | null>(null);

  const dungeon = useGameStore((s) => s.dungeon);
  const character = useGameStore((s) => s.character);
  const inventory = useGameStore((s) => s.inventory);
  const quests = useGameStore((s) => s.quests);
  const combat = useGameStore((s) => s.combat);
  const isLoading = useGameStore((s) => s.isLoading);
  const addNarrative = useGameStore((s) => s.addNarrative);
  const incrementTurns = useGameStore((s) => s.incrementTurns);
  const updateHp = useGameStore((s) => s.updateHp);
  const addItem = useGameStore((s) => s.addItem);
  const addGold = useGameStore((s) => s.addGold);
  const addXp = useGameStore((s) => s.addXp);
  const advanceObjective = useGameStore((s) => s.advanceObjective);
  const setCombat = useGameStore((s) => s.setCombat);
  const setLoading = useGameStore((s) => s.setLoading);

  const room = dungeon?.rooms.find((r) => r.id === dungeon.currentRoomId);
  const inCombat = !!combat?.active;
  // Combat is driven by CombatPanel; never route free-text actions to the DM mid-fight.
  const locked = isTyping || isLoading || inCombat || skillCheck !== null;

  /** Apply the mechanical side-effects attached to a DM reply. */
  const applyResponse = (response: Awaited<ReturnType<typeof generateActionResponse>>) => {
    addNarrative(response.narrative, 'narration');

    if (response.combatStart) {
      const enemies = response.combatStart.enemyIds
        .map(createEnemyById)
        .filter((enemy): enemy is Enemy => enemy !== null);
      const hero = useGameStore.getState().character;
      if (enemies.length > 0 && hero) {
        setCombat(initCombat(enemies, hero));
        addNarrative(`${enemies[0].name} бросается в атаку — к оружию!`, 'combat');
      }
    }

    if (response.itemFound) {
      const found = response.itemFound;
      const item: Item = {
        id: createId(),
        name: found.name,
        type: found.type,
        rarity: found.rarity,
        weight: 1,
        value: found.value,
        description: found.description,
        icon: found.icon,
      };
      addItem(item);
      addNarrative(`Найдено: ${found.name}`, 'loot');
    }

    if (response.goldChange) {
      addGold(response.goldChange);
      addNarrative(
        response.goldChange > 0
          ? `+${response.goldChange} золота`
          : `Потеряно ${Math.abs(response.goldChange)} золота`,
        'loot',
      );
    }

    if (response.xpGained) {
      addXp(response.xpGained);
      addNarrative(`+${response.xpGained} опыта`, 'system');
    }

    if (response.questUpdate) {
      advanceObjective(response.questUpdate.questId, response.questUpdate.objectiveId);
    }

    if (response.requiresRoll) {
      setSkillCheck(response.requiresRoll);
    }
  };

  const submit = async (raw: string) => {
    const input = raw.trim();
    if (locked || !input || !room || !character || !dungeon) return;

    setHistory((prev) => [input, ...prev].slice(0, HISTORY_LIMIT));
    setHistoryIndex(-1);
    setValue('');

    setLoading(true);
    addNarrative(`> ${input}`, 'action');
    try {
      const log = useGameStore.getState().narrativeLog;
      const response = await generateActionResponse(
        input,
        room,
        character,
        inventory,
        quests,
        log,
        dungeon.floor,
        dungeon.biome,
      );
      applyResponse(response);
      // Preserve the short-rest heal from earlier phases (safe when no enemies).
      if (classifyCommand(input) === 'rest' && room.enemies.length === 0) {
        updateHp(restHpAmount(character));
      }
      incrementTurns();
    } finally {
      setLoading(false);
    }
  };

  const resolveSkillCheck = (success: boolean) => {
    if (!skillCheck) return;
    const statLabel = STAT_RU[skillCheck.stat];
    if (success) {
      addNarrative(`Успех! Проверка ${statLabel} пройдена.`, 'system');
    } else {
      addNarrative(
        `Провал. Проверка ${statLabel} не пройдена (Сложность ${skillCheck.dc}).`,
        'system',
      );
    }
    setSkillCheck(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void submit(value);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setValue(history[next]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setValue('');
        return;
      }
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setValue(history[next]);
    }
  };

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-surface-elevated p-3">
      {skillCheck && character && (
        <SkillCheckCard
          roll={skillCheck}
          modifier={character.modifiers[skillCheck.stat]}
          onResolve={resolveSkillCheck}
        />
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={locked}
          placeholder={inCombat ? 'Идёт бой — используй панель боя' : 'Что ты делаешь?'}
          className="flex-1 rounded-md border border-surface-elevated bg-dungeon px-3 py-2 text-sm text-parchment placeholder:text-muted/60 focus:border-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void submit(value)}
          disabled={locked || value.trim().length === 0}
          aria-label="Send command"
          className="flex items-center rounded-md bg-gold px-3 py-2 text-dungeon transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onClick={() => void submit(action.command)}
            disabled={locked}
            className="rounded-md border border-surface-elevated px-2 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
