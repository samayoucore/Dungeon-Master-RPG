import { motion } from 'framer-motion';
import type { CharacterRace, Stats } from '../../../types';
import { RACES, RACE_BY_ID, STAT_KEYS } from '../../../engine/character/data';
import { formatModifier } from '../../../engine/character/creation';
import SelectableCard from './SelectableCard';

interface RaceStepProps {
  selected: CharacterRace | null;
  onSelect: (race: CharacterRace) => void;
}

/** Render a race's ability bonuses, e.g. "+2 DEX, +1 INT" or "+1 to all". */
function bonusText(bonuses: Partial<Stats>): string {
  const parts = STAT_KEYS.filter((key) => bonuses[key]).map(
    (key) => `${formatModifier(bonuses[key] ?? 0)} ${key.toUpperCase()}`,
  );
  return parts.length === STAT_KEYS.length ? '+1 to all abilities' : parts.join(', ');
}

export default function RaceStep({ selected, onSelect }: RaceStepProps) {
  const active = selected ? RACE_BY_ID[selected] : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-serif text-4xl text-gold">Choose Your Race</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RACES.map((race) => (
          <SelectableCard
            key={race.id}
            icon={race.icon}
            title={race.name}
            selected={selected === race.id}
            onSelect={() => onSelect(race.id)}
          >
            <p className="text-sm font-medium text-gold">{bonusText(race.bonuses)}</p>
            <p className="text-xs text-muted">{race.traits.join(' · ')}</p>
          </SelectableCard>
        ))}
      </div>
      {active && (
        <motion.p
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-parchment/90"
        >
          {active.description}
        </motion.p>
      )}
    </div>
  );
}
