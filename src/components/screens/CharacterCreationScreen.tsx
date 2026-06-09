import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { CharacterBackground, CharacterClass, CharacterRace, Stats } from '../../types';
import {
  buildCharacter,
  buildStartingInventory,
  createBaseStats,
  getIntroNarrative,
} from '../../engine/character/creation';
import type { CharacterDraft } from '../../engine/character/creation';
import WizardProgress from './creation/WizardProgress';
import RaceStep from './creation/RaceStep';
import ClassStep from './creation/ClassStep';
import NameStep from './creation/NameStep';
import StatsStep from './creation/StatsStep';
import BackgroundStep from './creation/BackgroundStep';

interface DraftState {
  race: CharacterRace | null;
  class: CharacterClass | null;
  name: string;
  baseStats: Stats;
  background: CharacterBackground | null;
}

const STEP_LABELS = ['Race', 'Class', 'Name', 'Stats', 'Background'];
const LAST_STEP = STEP_LABELS.length - 1;

// Each step slides in from the side matching the navigation direction
// (forward = from the right, back = from the left). Enter-only: the keyed
// remount below replaces the old step without an exit-completion dependency.
const slide: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
};

/** Narrow the nullable wizard draft once every required field is set. */
function isComplete(draft: DraftState): draft is CharacterDraft {
  return (
    draft.race !== null &&
    draft.class !== null &&
    draft.background !== null &&
    draft.name.trim().length >= 2
  );
}

export default function CharacterCreationScreen() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const addItem = useGameStore((s) => s.addItem);
  const addNarrative = useGameStore((s) => s.addNarrative);
  const setScreen = useGameStore((s) => s.setScreen);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<DraftState>(() => ({
    race: null,
    class: null,
    name: '',
    baseStats: createBaseStats(),
    background: null,
  }));

  const patch = (partial: Partial<DraftState>) => setDraft((current) => ({ ...current, ...partial }));

  const stepComplete = [
    draft.race !== null,
    draft.class !== null,
    draft.name.trim().length >= 2,
    true,
    draft.background !== null,
  ][step];

  const preview = useMemo(() => (isComplete(draft) ? buildCharacter(draft) : null), [draft]);

  const goBack = () => {
    if (step === 0) {
      setScreen('title');
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const goNext = () => {
    if (!stepComplete) return;
    if (step < LAST_STEP) {
      setDirection(1);
      setStep((s) => s + 1);
      return;
    }
    if (!isComplete(draft)) return;
    const character = buildCharacter(draft);
    startNewGame(character);
    buildStartingInventory(character.class).forEach(addItem);
    addNarrative(getIntroNarrative(character.class), 'narration');
  };

  const stepNodes = [
    <RaceStep selected={draft.race} onSelect={(race) => patch({ race })} />,
    <ClassStep selected={draft.class} onSelect={(value) => patch({ class: value })} />,
    <NameStep race={draft.race} name={draft.name} onChange={(name) => patch({ name })} />,
    draft.race && draft.class ? (
      <StatsStep
        race={draft.race}
        characterClass={draft.class}
        stats={draft.baseStats}
        onChange={(baseStats) => patch({ baseStats })}
        onReset={() => patch({ baseStats: createBaseStats() })}
      />
    ) : null,
    <BackgroundStep selected={draft.background} onSelect={(background) => patch({ background })} preview={preview} />,
  ];

  const beginReady = step === LAST_STEP && stepComplete;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden px-4 py-6">
      <div className="mx-auto w-full max-w-4xl">
        <WizardProgress steps={STEP_LABELS} current={step} />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-8">
        <motion.div
          key={step}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          transition={{ duration: 0.3 }}
        >
          {stepNodes[step]}
        </motion.div>
      </div>

      <nav className="mx-auto flex w-full max-w-4xl gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-surface-elevated px-6 py-3 text-muted transition-colors hover:border-gold hover:text-gold sm:flex-none sm:px-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!stepComplete}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-dungeon transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            step === LAST_STEP ? 'bg-gold text-lg' : 'bg-gold/90 hover:bg-gold'
          } ${beginReady ? 'begin-pulse' : ''}`}
        >
          {step === LAST_STEP ? (
            'Begin Adventure ⚔'
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </nav>
    </div>
  );
}
