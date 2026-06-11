import { Dices } from 'lucide-react';
import type { CharacterRace } from '../../../types';
import { randomName } from '../../../engine/character/creation';

interface NameStepProps {
  race: CharacterRace | null;
  name: string;
  onChange: (name: string) => void;
}

export default function NameStep({ race, name, onChange }: NameStepProps) {
  const handleRandom = () => {
    if (race) onChange(randomName(race));
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center font-serif text-4xl text-gold">Назови героя</h2>
      <input
        type="text"
        value={name}
        onChange={(event) => onChange(event.target.value)}
        maxLength={24}
        placeholder="Введи имя…"
        autoFocus
        className="w-full max-w-md rounded-lg border border-gold/30 bg-surface px-5 py-4 text-center font-serif text-2xl text-parchment placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      <button
        type="button"
        onClick={handleRandom}
        disabled={!race}
        className="flex items-center gap-2 rounded-md border border-surface-elevated px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Dices className="h-4 w-4" /> Случайное имя
      </button>
    </div>
  );
}
