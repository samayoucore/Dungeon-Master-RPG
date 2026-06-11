import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { classifyCommand, generateActionResponse, restHpAmount } from '../../engine/narrative/engine';

interface PlayerInputProps {
  /** Disables submission while the narrative is still typing out. */
  isTyping: boolean;
}

const HISTORY_LIMIT = 20;

const QUICK_ACTIONS = [
  { label: '🔍 Осмотреть', command: 'осмотреться' },
  { label: '🔎 Обыскать', command: 'обыскать' },
  { label: '💤 Отдых', command: 'отдохнуть' },
  { label: '🎒 Инвентарь', command: 'инвентарь' },
];

export default function PlayerInput({ isTyping }: PlayerInputProps) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const dungeon = useGameStore((s) => s.dungeon);
  const character = useGameStore((s) => s.character);
  const inventory = useGameStore((s) => s.inventory);
  const addNarrative = useGameStore((s) => s.addNarrative);
  const incrementTurns = useGameStore((s) => s.incrementTurns);
  const updateHp = useGameStore((s) => s.updateHp);

  const room = dungeon?.rooms.find((r) => r.id === dungeon.currentRoomId);

  const submit = (raw: string) => {
    const input = raw.trim();
    if (isTyping || !input || !room || !character) return;
    addNarrative(`> ${input}`, 'action');
    addNarrative(generateActionResponse(input, room, character, inventory), 'narration');
    incrementTurns();
    if (classifyCommand(input) === 'rest' && room.enemies.length === 0) {
      updateHp(restHpAmount(character));
    }
    setHistory((prev) => [input, ...prev].slice(0, HISTORY_LIMIT));
    setHistoryIndex(-1);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      submit(value);
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
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Что ты делаешь?"
          className="flex-1 rounded-md border border-surface-elevated bg-dungeon px-3 py-2 text-sm text-parchment placeholder:text-muted/60 focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={() => submit(value)}
          disabled={isTyping || value.trim().length === 0}
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
            onClick={() => submit(action.command)}
            disabled={isTyping}
            className="rounded-md border border-surface-elevated px-2 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
