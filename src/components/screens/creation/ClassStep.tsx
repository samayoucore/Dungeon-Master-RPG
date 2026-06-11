import { motion } from 'framer-motion';
import type { CharacterClass } from '../../../types';
import { CLASSES, CLASS_BY_ID, STARTING_INVENTORY, STAT_ABBR } from '../../../engine/character/data';
import SelectableCard from './SelectableCard';

interface ClassStepProps {
  selected: CharacterClass | null;
  onSelect: (characterClass: CharacterClass) => void;
}

export default function ClassStep({ selected, onSelect }: ClassStepProps) {
  const active = selected ? CLASS_BY_ID[selected] : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-serif text-4xl text-gold">Выбери класс</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CLASSES.map((cls) => (
          <SelectableCard
            key={cls.id}
            icon={cls.icon}
            title={cls.name}
            selected={selected === cls.id}
            onSelect={() => onSelect(cls.id)}
          >
            <p className="text-xs text-muted">
              Кость хитов <span className="text-parchment">к{cls.hitDie}</span> · Основные{' '}
              <span className="text-parchment">{cls.primary.map((p) => STAT_ABBR[p]).join('/')}</span>
            </p>
            <p className="text-sm text-gold">{cls.feature}</p>
            <p className="text-xs text-muted">{cls.featureDesc}</p>
          </SelectableCard>
        ))}
      </div>
      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm leading-relaxed text-parchment/90">{active.description}</p>
          <p className="mt-3 text-xs uppercase tracking-wider text-muted">Стартовое снаряжение</p>
          <p className="text-sm text-parchment">
            {STARTING_INVENTORY[active.id].map((item) => item.name).join(' · ')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
