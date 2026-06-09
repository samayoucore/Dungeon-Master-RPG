import type { Room } from '../../types';
import { ROOM_EMOJI, ROOM_LABELS } from './roomMeta';

interface RoomInfoProps {
  room: Room;
}

/** Summary of the current room: type, threats, loot, hazards and lore. */
export default function RoomInfo({ room }: RoomInfoProps) {
  const enemyCount = room.enemies.length;
  const itemCount = room.items.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{ROOM_EMOJI[room.type]}</span>
        <h3 className="font-serif text-lg capitalize text-gold">{ROOM_LABELS[room.type]}</h3>
      </div>

      {enemyCount > 0 && (
        <p className="text-sm text-danger">
          ⚔ {enemyCount} {enemyCount === 1 ? 'enemy' : 'enemies'} present
        </p>
      )}
      {itemCount > 0 && (
        <p className="text-sm text-gold">
          📦 {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      )}
      {room.trap && !room.trap.disarmed && (
        <p className="text-sm text-magic">⚡ Something feels dangerously wrong here…</p>
      )}
      {room.npcId === 'merchant' && <p className="text-sm text-sky-400">💬 A merchant beckons you over.</p>}
      {room.lore && <p className="text-xs italic leading-relaxed text-muted">{room.lore}</p>}
    </div>
  );
}
