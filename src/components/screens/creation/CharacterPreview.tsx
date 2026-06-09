import { motion } from 'framer-motion';
import type { Character } from '../../../types';
import { CLASS_ICONS } from '../../../utils/save';
import { RACE_BY_ID, STARTING_INVENTORY, STATS_INFO } from '../../../engine/character/data';
import { formatModifier } from '../../../engine/character/creation';

interface CharacterPreviewProps {
  character: Character;
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dungeon/60 py-2 text-center">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-xl font-bold text-gold">{value}</div>
    </div>
  );
}

/** Full preview of the assembled hero shown after the background is chosen. */
export default function CharacterPreview({ character }: CharacterPreviewProps) {
  const inventory = STARTING_INVENTORY[character.class];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl rounded-xl border border-gold/40 bg-surface p-5"
    >
      <div className="flex items-center gap-3 border-b border-surface-elevated pb-3">
        <span className="text-4xl">{CLASS_ICONS[character.class]}</span>
        <div>
          <div className="font-serif text-2xl text-gold">{character.name}</div>
          <div className="text-sm capitalize text-muted">
            {RACE_BY_ID[character.race].name} {character.class} · Level {character.level}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 py-3">
        <Vital label="HP" value={`${character.maxHp}`} />
        <Vital label="AC" value={`${character.ac}`} />
        <Vital label="Init" value={formatModifier(character.modifiers.dex)} />
        <Vital label="Prof" value={formatModifier(character.proficiencyBonus)} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STATS_INFO.map((info) => (
          <div key={info.key} className="rounded-md bg-dungeon/60 p-2 text-center">
            <div className="text-[11px] text-muted">{info.abbr}</div>
            <div className="text-lg text-parchment">{character.stats[info.key]}</div>
            <div className="text-xs text-gold">{formatModifier(character.modifiers[info.key])}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-surface-elevated pt-3">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted">
          <span>Starting inventory</span>
          <span className="text-gold">◉ {character.gold} gold</span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {inventory.map((item) => (
            <li key={item.name} className="rounded-md border border-surface-elevated px-2 py-1 text-xs text-parchment">
              {item.icon} {item.name}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
