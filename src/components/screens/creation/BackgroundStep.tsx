import type { Character, CharacterBackground } from '../../../types';
import { BACKGROUNDS } from '../../../engine/character/data';
import SelectableCard from './SelectableCard';
import CharacterPreview from './CharacterPreview';

interface BackgroundStepProps {
  selected: CharacterBackground | null;
  onSelect: (background: CharacterBackground) => void;
  /** Assembled hero preview, available once every step is complete. */
  preview: Character | null;
}

export default function BackgroundStep({ selected, onSelect, preview }: BackgroundStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-serif text-4xl text-gold">Выбери предысторию</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BACKGROUNDS.map((bg) => (
          <SelectableCard
            key={bg.id}
            icon={bg.icon}
            title={bg.name}
            selected={selected === bg.id}
            onSelect={() => onSelect(bg.id)}
          >
            <p className="text-xs text-muted">
              Навыки: <span className="text-parchment">{bg.skills.join(', ')}</span>
            </p>
            <p className="text-xs text-gold/90">{bg.bonus}</p>
          </SelectableCard>
        ))}
      </div>
      {selected && preview && <CharacterPreview character={preview} />}
    </div>
  );
}
