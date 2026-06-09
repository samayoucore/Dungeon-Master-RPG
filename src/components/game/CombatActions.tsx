import { useState } from 'react';
import type { CombatState, Item } from '../../types';

interface CombatActionsProps {
  combat: CombatState;
  inventory: Item[];
  isPlayerTurn: boolean;
  busy: boolean;
  lastLog: string;
  onAttack: (targetId: string) => void;
  onDodge: () => void;
  onFlee: () => void;
  onUseItem: (itemId: string) => void;
}

function ActionButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-surface-elevated bg-surface px-3 py-2 text-sm text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function SelectList({
  title,
  items,
  onPick,
  onBack,
}: {
  title: string;
  items: { id: string; label: string }[];
  onPick: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{title}</span>
        <button type="button" onClick={onBack} className="hover:text-gold">
          ← back
        </button>
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            className="rounded-md border border-surface-elevated px-3 py-1.5 text-left text-sm text-parchment transition-colors hover:border-gold hover:text-gold"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Center column: player action buttons, target/item pickers, last log line. */
export default function CombatActions({
  combat,
  inventory,
  isPlayerTurn,
  busy,
  lastLog,
  onAttack,
  onDodge,
  onFlee,
  onUseItem,
}: CombatActionsProps) {
  const [mode, setMode] = useState<'actions' | 'target' | 'item'>('actions');
  const living = combat.enemies.filter((e) => e.hp > 0);
  const consumables = inventory.filter((i) => i.type === 'potion');
  const disabled = busy || !isPlayerTurn;

  if (!isPlayerTurn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted">
        <span className="text-sm">Enemy is acting</span>
        <span className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
        </span>
      </div>
    );
  }

  const startAttack = () => {
    if (living.length <= 1) {
      if (living[0]) onAttack(living[0].id);
    } else {
      setMode('target');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      {mode === 'actions' && (
        <div className="grid grid-cols-2 gap-2">
          <ActionButton label="⚔ Attack" disabled={disabled || living.length === 0} onClick={startAttack} />
          <ActionButton label="🛡 Dodge" disabled={disabled} onClick={onDodge} />
          <ActionButton label="💨 Flee" disabled={disabled} onClick={onFlee} />
          <ActionButton label="🧪 Use Item" disabled={disabled || consumables.length === 0} onClick={() => setMode('item')} />
        </div>
      )}
      {mode === 'target' && (
        <SelectList
          title="Choose a target"
          onBack={() => setMode('actions')}
          onPick={(id) => {
            setMode('actions');
            onAttack(id);
          }}
          items={living.map((e) => ({ id: e.id, label: `${e.name} · ${e.hp} HP` }))}
        />
      )}
      {mode === 'item' && (
        <SelectList
          title="Use which item?"
          onBack={() => setMode('actions')}
          onPick={(id) => {
            setMode('actions');
            onUseItem(id);
          }}
          items={consumables.map((i) => ({ id: i.id, label: i.name }))}
        />
      )}
      {lastLog && <p className="mt-auto truncate text-xs italic text-muted">{lastLog}</p>}
    </div>
  );
}
