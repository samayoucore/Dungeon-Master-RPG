import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { Item, ItemRarity } from '../../types';
import { useGameStore } from '../../store/gameStore';

export interface LootResult {
  items: Item[];
  gold: number;
  xp: number;
  enemyCount: number;
}

interface LootPanelProps {
  loot: LootResult;
  onClose: () => void;
}

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'text-parchment',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  'very-rare': 'text-magic',
  legendary: 'text-gold',
};

/** Animate a number from 0 up to the target over `duration` ms. */
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/** Post-victory modal: XP count-up, gold, item drops, take-all. */
export default function LootPanel({ loot, onClose }: LootPanelProps) {
  const character = useGameStore((s) => s.character);
  const addItem = useGameStore((s) => s.addItem);
  const addGold = useGameStore((s) => s.addGold);
  const addXp = useGameStore((s) => s.addXp);
  const applied = useRef(false);
  const [taken, setTaken] = useState(false);

  // Award XP and gold exactly once.
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    addXp(loot.xp);
    if (loot.gold > 0) addGold(loot.gold);
  }, [loot, addXp, addGold]);

  const xpShown = useCountUp(loot.xp);
  const leveledUp = character ? character.xp >= character.xpToNext : false;
  const hasItems = loot.items.length > 0;

  const takeAll = () => {
    loot.items.forEach(addItem);
    setTaken(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-xl border border-gold/40 bg-surface p-6 text-center"
      >
        <h2 className="font-serif text-2xl text-gold">Victory!</h2>
        <p className="mb-4 text-sm text-muted">
          You defeated {loot.enemyCount} {loot.enemyCount === 1 ? 'enemy' : 'enemies'}
        </p>

        <div className="mb-3 text-3xl font-bold text-gold">+{xpShown} XP</div>
        {leveledUp && <div className="crit-pulse mb-3 font-serif text-lg text-gold">LEVEL UP available!</div>}
        {loot.gold > 0 && (
          <div className="mb-4 flex items-center justify-center gap-1 text-parchment">
            <Coins className="h-4 w-4 text-gold" /> +{loot.gold} gp
          </div>
        )}

        {hasItems && (
          <div className="mb-4 flex flex-col gap-1">
            {loot.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-surface-elevated px-3 py-1.5 text-left text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className={`flex-1 ${RARITY_COLOR[item.rarity]}`}>{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {hasItems && !taken ? (
          <button
            type="button"
            onClick={takeAll}
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-dungeon transition-colors hover:bg-gold/90"
          >
            Take All
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-dungeon transition-colors hover:bg-gold/90"
          >
            Continue
          </button>
        )}
      </motion.div>
    </div>
  );
}
