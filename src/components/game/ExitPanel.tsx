import { ChevronRight } from 'lucide-react';
import type { Dungeon, Room } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';
import { ROOM_EMOJI, ROOM_LABELS } from './roomMeta';

interface ExitPanelProps {
  dungeon: Dungeon;
  /** Movement is locked during combat. */
  disabled?: boolean;
}

/** Lists the exits from the current room; clicking one moves the party there. */
export default function ExitPanel({ dungeon, disabled = false }: ExitPanelProps) {
  const moveToRoom = useGameStore((s) => s.moveToRoom);
  const addNarrative = useGameStore((s) => s.addNarrative);
  const incrementTurns = useGameStore((s) => s.incrementTurns);
  const { play } = useSound();

  const byId = new Map(dungeon.rooms.map((r) => [r.id, r]));
  const current = byId.get(dungeon.currentRoomId);
  if (!current) return null;

  const exits = current.connections
    .map((id) => byId.get(id))
    .filter((room): room is Room => room !== undefined);

  const handleMove = (room: Room) => {
    play('footstep');
    addNarrative(`Ты направляешься дальше: ${ROOM_LABELS[room.type].toLowerCase()}.`, 'action');
    moveToRoom(room.id);
    incrementTurns();
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Выходы</h3>
      {exits.length === 0 && <p className="text-sm text-muted">Выхода нет…</p>}
      {exits.map((room) => {
        const known = room.isVisited;
        return (
          <button
            key={room.id}
            type="button"
            disabled={disabled}
            onClick={() => handleMove(room)}
            className="group flex items-center gap-3 rounded-md border border-surface-elevated bg-dungeon/40 px-3 py-2 text-left transition-colors hover:border-gold hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-surface-elevated"
          >
            <span className="text-lg">{known ? ROOM_EMOJI[room.type] : '❓'}</span>
            <span className="flex-1 text-sm text-parchment">
              {known ? ROOM_LABELS[room.type] : 'Неизвестный проход'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
          </button>
        );
      })}
    </div>
  );
}
