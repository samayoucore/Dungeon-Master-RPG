import { useEffect, useRef, useState } from 'react';
import type { Character, CombatState } from '../../types';

interface TurnOrderListProps {
  combat: CombatState;
  character: Character;
  activeId: string;
}

function hpColor(pct: number): string {
  if (pct > 60) return 'bg-[#16a34a]';
  if (pct >= 30) return 'bg-[#ca8a04]';
  return 'bg-danger';
}

/** Thin enemy HP bar that briefly shakes when its HP drops. */
function EnemyHpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const [shake, setShake] = useState(false);
  const prev = useRef(hp);

  useEffect(() => {
    if (hp < prev.current) {
      setShake(true);
      const timer = window.setTimeout(() => setShake(false), 320);
      prev.current = hp;
      return () => window.clearTimeout(timer);
    }
    prev.current = hp;
  }, [hp]);

  const pct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  return (
    <div className={`mt-1 h-1 overflow-hidden rounded-full bg-dungeon ${shake ? 'hp-shake' : ''}`}>
      <div className={`h-full rounded-full transition-all duration-300 ${hpColor(pct)}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Left column: initiative order with the active combatant highlighted. */
export default function TurnOrderList({ combat, character, activeId }: TurnOrderListProps) {
  const enemyById = new Map(combat.enemies.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs uppercase tracking-wider text-muted">Раунд {combat.round}</div>
      {combat.turnOrder.map((entry) => {
        const isPlayer = entry.kind === 'player';
        const enemy = isPlayer ? null : enemyById.get(entry.id);
        const dead = !isPlayer && (!enemy || enemy.hp <= 0);
        const active = entry.id === activeId && !dead;
        const name = isPlayer ? character.name : enemy?.name ?? 'Неизвестно';
        return (
          <div
            key={entry.id}
            className={`rounded-md border px-2 py-1 ${active ? 'border-gold bg-gold/10' : 'border-surface-elevated'} ${dead ? 'opacity-40' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`truncate text-sm ${dead ? 'text-muted line-through' : isPlayer ? 'text-gold' : 'text-parchment'}`}>
                {isPlayer ? '🛡 ' : '👹 '}
                {name}
              </span>
              <span className="shrink-0 text-[10px] text-muted">иниц {entry.initiative}</span>
            </div>
            {!isPlayer && enemy && (
              <>
                {!dead && <EnemyHpBar hp={enemy.hp} maxHp={enemy.maxHp} />}
                <div className="text-[10px] text-muted">{Math.max(0, enemy.hp)} / {enemy.maxHp} HP</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
